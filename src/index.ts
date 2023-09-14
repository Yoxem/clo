var fs = require('fs');
import { argv, resourceUsage } from 'node:process';
import * as tk from './tokenize.js';
import * as util from 'util';
import { reduceRotation } from 'pdf-lib';

/**
 * token tree type.
 */
type tkTree = tkTree[] | tk.Token

export interface TokenMatcheePair {
    matched: tkTree[]
    remained: tk.Token[]
}

export interface MaybeTokensAST{
    maybeTokens: tk.Maybe<TokenMatcheePair>;
    ast: tkTree;
}

/**
 * @description
 * match one token type.
 * 
 * it returns a function which test if the type of first token of the `remained` part of
 *  the argument of the function is `typ` , if it's true, update the `TokenMatcheePair` wrapped
 * in `Some`. Otherwise, it returns `None`.
 *  * @param typ : the type to be test.
 * @returns the updated `TokenMatcheePair` wrapped in `Some(x)` or `None`.
 */
export function m1TType(typ: tk.TokenType):
    (m: TokenMatcheePair) => tk.Maybe<TokenMatcheePair> {
    return (m: TokenMatcheePair) => {
        if (m.remained.length == 0) {
            return { _tag: "None" };
        }
        /**
         * token to be matched
         * */
        const ttbm = m.remained[0];
        
        if (ttbm.type == typ) {
            let new_matched = m.matched.concat(ttbm);
            let result : tk.Some<TokenMatcheePair> = {
                _tag: "Some", value: {
                    matched: new_matched,
                    remained: m.remained.slice(1)
                }
            };
            return result;
        }
        else {
            return { _tag: "None" };
        }
    }
};

let toSome = tk.toSome;
let thenDo = tk.thenDo;
let zeroOrOnceDo = tk.zeroOrOnceDo;
let orDo = tk.orDo;
let zeroOrMoreDo = tk.zeroOrMoreDo;


argv.forEach((val, index) => {
    console.log(`${index}=${val}`);
});

let commandInput = "int a str b"//argv[2];
let commandInputTokenized = tk.tokenize(commandInput);
let commandInputTokenizedFiltered = commandInputTokenized.filter(
    (x : tk.Token)=>{return x.type != tk.TokenType.SP &&
                            x.type != tk.TokenType.NL});
console.log("aaa: "+util.inspect(commandInputTokenizedFiltered, { showHidden: true, depth: null }));

/**
 * matchee pair of commandInputTokenized
 */
let commandTPair : TokenMatcheePair = {matched:[],
                                remained: commandInputTokenizedFiltered};


let tInt = m1TType(tk.TokenType.INT);
let tFlo = m1TType(tk.TokenType.FLO);
let tStr = m1TType(tk.TokenType.STR);
let tId = m1TType(tk.TokenType.ID);
let tApos = m1TType(tk.TokenType.APOS);


function tBool (x : TokenMatcheePair) :tk.Maybe<TokenMatcheePair> {
    let text = x.remained[0].text
    if (text == "true" || text == "false"){
        return thenDo(toSome(x), m1TType(tk.TokenType.ID));
    }else{
        return {_tag : "None"};
    }
}

/**
 * define the right hand side of a grammar
 * eg. `LHS ::= a + b`
 * @param process  the right hand side processing : eg. `a + b` in `LHS`
 * @param arrange define the order (0 starting) of the elements of the result.
 * ast. : eg. `a + c` is `1 0 2` `(+ a c)`
 * @returns the processed ast. 
 */
function gramRHS (process: Function, arrange : number[]){
    return (m : TokenMatcheePair)=>{

    let middle : tk.Maybe<TokenMatcheePair> = process(m);

    console.log("Middle"+util.inspect(middle, { showHidden: true, depth: null })); 

    if (middle._tag == "None"){
        return middle;
    }
    else{
        let matched = middle.value.matched;
        let arrLength = arrange.length;
        let returnRrray : tkTree[] = Array(arrange.length);

        arrange.forEach((val, index) => {
            returnRrray[arrange[index]] = matched[index];
        });

        let matchedTmp1Length = matched.length-arrLength;
        console.log(matchedTmp1Length);
        var matchedTmp1 : tkTree[] = matched
                                    .slice(0,matchedTmp1Length);
        
        console.log("matchedTmp1"+util.inspect(matchedTmp1, { showHidden: true, depth: null })); 
        console.log("returnRrray"+util.inspect(returnRrray, { showHidden: true, depth: null })); 
        matchedTmp1.push(returnRrray);


        let result : tk.Some<TokenMatcheePair> = {_tag:"Some",
                    value : {matched : matchedTmp1,
                             remained : middle.value.remained}};
        return result;
    }
    }
}

/**
 * typeABS ::= "'" ID
 */
var typeABS = (x : TokenMatcheePair)=>
{
    var result = thenDo(thenDo(toSome(x),tApos),tId);
    if (result._tag == "Some" && "text" in result.value.matched[1]){
        var realToken : tk.Token = result.value.matched[1];
        realToken.text = "'"+realToken.text;
        result.value.matched = [realToken];
    }
    return result;
}

/**
 * TypeId ::=  typeABS | ID
 */
var typeName =  (x : TokenMatcheePair)=>
{
    return thenDo(toSome(x), orDo(typeABS, tId));
}

/**
 *  CONST ::= INT | STR | FLO | BOOL
 */

/**
 * TODO: 要用 debugger 檢查分析問題
 */
var constParser = gramRHS((x : TokenMatcheePair)=>
    {return thenDo(toSome(x),orDo(orDo(orDo(tInt,tFlo),tStr),tBool))}, [0]);

/**
 * storing the tree
 */
var astTree : tkTree = [];

/**
 * TYPE_PAIR ::= TYP_ID ID
 */
var typePair = (x : MaybeTokensAST)=> 
{
    
    
    let a = thenDo(thenDo(x.maybeTokens, typeName), tId);
    if (a._tag == "Some"){
        let matched = a.value.matched;
        let slice = matched.slice(matched.length-2);
        console.log("slice"+slice);

        let b : MaybeTokensAST = {maybeTokens : a, ast : slice};
        return b;
    }
    else{
        let b : MaybeTokensAST= {maybeTokens : a, ast : []};
        return b;
    }
} 

/**
 * function's arguments
 * FN_ARGS = TYPE_PAIR ("," TYPE_PAIR)+
 */

var fnArgs = (x : TokenMatcheePair)=>
    {   
        let wrapper : MaybeTokensAST = {maybeTokens : toSome(x), ast : []};
        let a = typePair(wrapper);
        console.log("AAAAA"+util.inspect(a, { showHidden: true, depth: null })); 
        let abanibi = typePair(a);
        console.log("ABNB"+util.inspect(abanibi, { showHidden: true, depth: null })); 


        return {maybeTokens : abanibi.maybeTokens, ast : [a.ast, abanibi.ast]};
    
    };

let tree = fnArgs(commandTPair);
console.log("CHRANN"+util.inspect(tree, { showHidden: true, depth: null })); 
