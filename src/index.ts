var fs = require('fs');
import { argv, resourceUsage } from 'node:process';
import * as tk from './tokenize.js';
import * as util from 'util';
import { drawEllipsePath, reduceRotation } from 'pdf-lib';
import { isAnyArrayBuffer, isTypedArray } from 'node:util/types';
import { error } from 'node:console';
import { isUndefined } from 'node:util';

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
 *  
 * matched: the matched (now and before) tokens
 * 
 * remained: tokens to be matched
 * 
 * ast: abstract syntax tree
 */
export interface TokenMatcheePair {
    matched: tk.Token[]
    remained: tk.Token[]
    ast : tkTree[]
}

/**
 * convert a `tkTree` AST to S-expr string
 * @param t the `tkTree`
 * @returns S-expr String
 */
export function tkTreeToSExp(t: tkTree): string{
    var str = "";

    if (Array.isArray(t)){
        let strArray = t.map((x)=>tkTreeToSExp(x));
        str = "(" + strArray.join(" ") + ")";
    }else{
        if (t=== undefined){
            str = "%undefined"
        }else{
            str = t.text;
        }
    }

    return str;
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
let tId  = m1TType(tk.TokenType.ID);


let tAdd  = m1TType(tk.TokenType.I_ADD);
let tSub = m1TType(tk.TokenType.I_SUB);
let tMul  = m1TType(tk.TokenType.I_MUL);
let tDiv = m1TType(tk.TokenType.I_DIV);
let tLParen = m1TType(tk.TokenType.L_PAREN);
let tRParen = m1TType(tk.TokenType.R_PAREN);

let toSome = tk.toSome;


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


/**
 * 
 * @param m : the `MatcheePair` to be consumed.
 * @returns if the length of `m.remained` >= 1; consumes the matchee by 1 token
 *  and wraps it in `Some`,
 * otherwise, returns `None`.
 */
export function matchAny(m: TokenMatcheePair): tk.Maybe<TokenMatcheePair> {
    if (m.remained.length >= 1) {
        return {
            _tag: "Some", value: {
                matched: m.matched.concat(m.remained[0]),
                remained: m.remained.slice(1),
                ast :  [m.remained[0]],
            }
        };
    } else {
        return { _tag: "None" };
    }
}

/**
 * Danger : Maybe it's not enough to work.
* @description repeating matching function `f` 
* zero or more times, like the asterisk `*` in regex `f*` . 
* @param f : the function to be repeated 0+ times.
* @returns:the combined function
*/
export function OnceOrMoreDo(f: Function): (x: TokenMatcheePair) =>
    tk.Maybe<TokenMatcheePair> {
    return (x) => {
        var wrappedOldX: tk.Maybe<TokenMatcheePair> = { _tag: "Some", value: x };
        var wrappedNewX: tk.Maybe<TokenMatcheePair> = wrappedOldX;

        var counter = -1;

        while (wrappedNewX._tag != "None") {
            wrappedOldX = wrappedNewX;
            wrappedNewX = thenDo(wrappedOldX, f);
            counter += 1;

        };


        if (counter <= 0){
            return { _tag: "None"};
        }
        let ast = wrappedOldX.value.ast ;
        wrappedOldX.value.ast =ast.slice(ast.length-counter);
        console.log(repr(wrappedOldX.value.ast));

        return wrappedOldX; };
}

/**
 * aux function for midfix operator
 * @param f function
 * @param signal the rule name
 * @returns 
 */
let midfix = (f : Function, signal? : string) => (x : TokenMatcheePair)=>{
    var a = f(x);
    if (a._tag == "Some"){
        let ast_tail : tkTree[] = slice(a.value.ast,a.value.ast.length-3);
        let new_ast = [ast_tail];
        a.value.ast = new_ast;

        // console.log("+"+signal+"+"+repr(a));

        
    }
    return a;
}

let circumfix = (f : Function, signal? : string) => (x : TokenMatcheePair)=>{
    var a = f(x);
    if (a._tag == "Some"){
        let inner = a.value.ast[a.value.ast.length-2];
        let ast_middle : tkTree[] = [inner];
        let new_ast = [ast_middle];
        a.value.ast = new_ast;
    }
    return a;
}

/**
 * TODO: 12(13)(14) only parsed with only 12(13)
 */
/** single1 = tInt | "(" expr ")"*/
let single1 = circumfix((x : TokenMatcheePair) =>
    thenDo(thenDo(thenDo(tk.toSome(x), tLParen), expr), tRParen), "fac1");
let single2= tInt;
let single = orDo(single1, single2);

/** func = single | single "(" single ")" 
 * i.e.
 * 
 * func = single |  func_aux ( int )
 * 
*/


/** fac = single ["(" single ")"]?  | single
 * Issue1 to be fixed.
 */
let fac1Appliee = circumfix((x  : TokenMatcheePair) => thenDo(thenDo(thenDo(tk.toSome(x), tLParen), tInt), tRParen), "fac1");
let fac1 = (x : TokenMatcheePair) => 
    {
        let raw = thenDo(thenDo(toSome(x), single), OnceOrMoreDo(fac1Appliee));

        
        
        if (raw._tag == "Some"){


            var result : tkTree  = raw.value.ast[0];
            let applyToken : tk.Token = {text: '%apply', ln:0, col:0};
            for (var i=1; i<raw.value.ast.length; i++){
                result = [applyToken, result, raw.value.ast[i]];
            }

            if (!Array.isArray(result)){
                raw.value.ast = [result];
            }else{
                raw.value.ast = result;
            }
        }


        
    
        return raw;
    };
let fac2 = single;
let fac = orDo(fac1, fac2);



/**
 * 
 * term1 = fac (MUL | DIV) fac
 */

let term1 = midfix((x : TokenMatcheePair)=>
            thenDo(thenDo(thenDo(tk.toSome(x), fac), orDo(tMul,tDiv)), fac), "term1");

            
/**
 * 
 * term2 = int MUL int
 */
let term2 = fac;

/**
 * term = term1 | term2
 */
let term = orDo(term1, term2);
 

/**
 * 
 * expr1 = term ADD term
 */
let expr1 = midfix((x : TokenMatcheePair)=>
                thenDo(thenDo(thenDo(tk.toSome(x), term), orDo(tAdd,tSub)), term), "expr1");
/**
 * expr2 = term
 */
let expr2 = term;

/**
 * expr = expr1 | expr2
 */
let expr = orDo(expr1, expr2);



let tokens = tk.tokenize("1");
let tokens2 = tk.tokenize("1(2)");
let tokens3 = tk.tokenize("1(2)(3)");
let tokens4 = tk.tokenize("(3(2))*2+1");

//let tokens = tk.tokenize("(4-(3/4))");
//tk.tokenize(argv[2]);

let tokensFiltered = tokens4.filter(
    (x)=>{return (x.type != tk.TokenType.NL
            && x.type != tk.TokenType.SP)});



let beta = expr({
        matched : [] ,
        remained : tokensFiltered,
        ast : []});

if (beta._tag == "Some"){
    console.log(tkTreeToSExp(beta.value.ast));
}

console.log("RESULT="+repr(beta));

