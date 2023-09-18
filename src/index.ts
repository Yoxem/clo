var fs = require('fs');
import { argv, resourceUsage } from 'node:process';
import * as tk from './tokenize.js';
import * as util from 'util';
import { drawEllipsePath, reduceRotation } from 'pdf-lib';
import { isTypedArray } from 'node:util/types';
import { error } from 'node:console';

/**
 * debug reprensenting
 */
let repr = (x : any)=>{return util.inspect(x, {depth: null})};

/**
 * token tree type.
 */
type tkTree = tkTree[] | tk.Token

/**
 * concated 2 `tkTree`s
 * @param x the array to be concated
 * @param y the item or array to ve concated
 * @returns concated tkTree array, or thrown error if can't be concated.
 */
function concat(x: tkTree, y:tkTree): tkTree[] {
    if (Array.isArray(x)){
            return x.concat(y);
    }else{
        throw new Error("the tkTree can't be concated, because it's not an array.");
        
    }
}

function slice(x: tkTree, index?:number, end?:number): tkTree[] {
    if (Array.isArray(x)){
            return x.slice(index,end);
    }else{
        throw new Error("the tkTree can't be concated, because it's not an array.");
        
    }
}

/**
 * TokenMatcheePair for tokens' parser combinator
 * matched: the matched (now and before) tokens
 * remained: tokens to be matched
 * ast: abstract syntax tree
 */
export interface TokenMatcheePair {
    matched: tk.Token[]
    remained: tk.Token[]
    ast : tkTree[]
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
                    remained: m.remained.slice(1),
                    ast:  ([ttbm]),
                }
            };
            return result;
        }
        else {
            return { _tag: "None" };
        }
    }
};

/**
 * type int
 */
let tInt  = m1TType(tk.TokenType.INT);
let tAdd  = m1TType(tk.TokenType.I_ADD);
let tMul  = m1TType(tk.TokenType.I_MUL);


argv.forEach((val, index) => {
    console.log(`${index}=${val}`);
});


/**
 * like `m ==> f` in ocaml
 * @param m matchee wrapped
 * @param f matching function
 * @returns wrapped result
 */
function thenDo(m : tk.Maybe<TokenMatcheePair>, f : Function){
    if (m._tag == "None"){
        return m;
    }else{
        var a : tk.Maybe<TokenMatcheePair> = f(m.value);
        if (a._tag == "Some"){
            a.value.ast = concat(m.value.ast, a.value.ast);
        }

        return a;
    }
}

/**
 * like `f1 | f2` in regex
 * @param f1 the first tried function
 * @param f2 the second tried function
 * @returns wrapped result
 */
function orDo(f1 : Function, f2 : Function){
    return (x : TokenMatcheePair) =>{
        let res1 : tk.Maybe<TokenMatcheePair> = f1(x);
        if (res1._tag == "Some"){
            return res1;
        }else{
            let res2 : tk.Maybe<TokenMatcheePair> = f2(x);
            return res2;
        }
    }
    
}

let midfix = (f : Function, signal? : string) => (x : TokenMatcheePair)=>{
    var a = f(x);
    if (a._tag == "Some"){
        let ast_head : tkTree[] = slice(a.value.ast,0,a.value.ast.length-3);
        let ast_tail : tkTree[] = slice(a.value.ast,a.value.ast.length-3);
        let new_ast = [ast_tail];
        a.value.ast = new_ast;

        console.log("+"+signal+"+"+repr(a));

        
    }
    return a;
}

/**
 * 
 * fac1 = int MUL int
 */
//let fac1 = midfix((x : TokenMatcheePair)=>
//            thenDo(thenDo(thenDo(tk.toSome(x), tInt), tMul), tInt));

let fac1 = (x : TokenMatcheePair) => {
    let a = midfix((x : TokenMatcheePair)=>
            thenDo(thenDo(thenDo(tk.toSome(x), tInt), tMul), tInt), "fac1")(x);

    return a;
}

            
/**
 * 
 * fac2 = int MUL int
 */
let fac2 = tInt;

/**
 * fac = fac1 | fac2
 */
let fac = orDo(fac1, fac2);
 

/**
 * 
 * expr1 = fac ADD fac
 */
let expr1 = midfix((x : TokenMatcheePair)=>
                thenDo(thenDo(thenDo(tk.toSome(x), fac), tAdd), fac), "expr1");
/**
 * expr2 = fac
 */
let expr2 = fac;

/**
 * expr = expr1 | expr2
 */
let expr = orDo(expr1, expr2);




let tokens = tk.tokenize("2+3*4");//tk.tokenize(argv[2]);
let tokensFiltered = tokens.filter(
    (x)=>{return (x.type != tk.TokenType.NL
            && x.type != tk.TokenType.SP)});

let wrappedTokens : tk.Maybe<TokenMatcheePair> = 
    tk.toSome({
        matched : [] ,
        remained : tokensFiltered,
        ast : []});

let beta = expr({
        matched : [] ,
        remained : tokensFiltered,
        ast : []});

console.log(repr(wrappedTokens));

console.log(repr(beta));

