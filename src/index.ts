var fs = require('fs');
import jsTokens from "js-tokens";
import * as util from 'util';

/**
 * 
 * # REPRESENTATION
 */
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
            str = t.value;
        }
    }

    return str;
}

/**inspect the inner of the representation. */
let repr = (x : any)=>{return util.inspect(x, {depth: null})};
/**
 * 
 * # TYPES
 */

/**
 * TokenPair for tokens' parser combinator
 *
 * matched: the matched (now and before) tokens
 * 
 * remained: tokens to be matched
 * 
 * ast: abstract syntax tree
 */
export interface TokenPair {
    matched: jsTokens.Token[]
    remained: jsTokens.Token[]
    ast : tkTree[]
}
export type Some<T> = { _tag: "Some"; value: T };
export type None = { _tag: "None" };
export type Maybe<T> = Some<T> | None;

type Token = jsTokens.Token;
type tkTree = Token | tkTree[];

/**
 * 
 * # PARSER UNITS
 */
function toSome<T>(x:T): Maybe<T>{
    return {_tag: "Some", value: x};
}

/**
 * like `m ==> f` in ocaml
 * @param m matchee wrapped
 * @param f matching function
 * @returns wrapped result
 */
function thenDo(m : Maybe<TokenPair>, f : Function){
    if (m._tag == "None"){
        return m;
    }else{
        var a : Maybe<TokenPair> = f(m.value);
        if (a._tag == "Some"){
            a.value.ast = m.value.ast.concat(a.value.ast);
        }

        return a;
    }
}
/**
 * 
 * @param m : the `TokenPair` to be consumed.
 * @returns if the length of `m.remained` >= 1; consumes the matchee by 1 token
 *  and wraps it in `Some`,
 * otherwise, returns `None`.
 */
export function matchAny(m: TokenPair): Maybe<TokenPair> {
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
 * like `f1 | f2` in regex
 * @param f1 the first tried function
 * @param f2 the second tried function
 * @returns wrapped result
 */
function orDo(f1 : Function, f2 : Function){
    return (x : TokenPair) =>{
        let res1 : Maybe<TokenPair> = f1(x);
        if (res1._tag == "Some"){
            return res1;
        }else{
            let res2 : Maybe<TokenPair> = f2(x);
            return res2;
        }
    } 
}

/**
 * like regex [^c]
 * @param f input token function. one token only.
 * @returns combined finction
 */
function notDo(f : Function){
    return (x : TokenPair) =>{
        let res1 : Maybe<TokenPair> = f(x);
        if (res1._tag == "Some"){
            return {_tag:"None"};
        }else{
            let res2 = matchAny(x);
            return res2;
        }
    } 
}

function matchToken(typeName : string, value? : string):
 (t : TokenPair) => Maybe<TokenPair>{
    return (t)=>{
        let headToken = t.remained[0];
        if (headToken.type != typeName){
            return {_tag:"None"};
        }else{
            if (value === undefined || value == headToken.value){
                let newTokenPair = {
                    matched: t.matched.concat(headToken),
                    remained: t.remained.slice(1),
                    ast : [headToken]
                };
                return {_tag : "Some", value : newTokenPair};
            }else{
                return {_tag:"None"};
            }
        };
    }
};


/**
 * 
 * # TEST
 */
const tokens = Array.from(jsTokens(
`import foo from\t 'bar';
import * as util  from 'util';


花非花，霧\\{非霧 。{{foo();}}下
一句`));

console.log("RESULT="+repr(tokens));


var mainTokenPair : TokenPair = {
    matched : [] ,
    remained : tokens,
    ast : []};

let a = thenDo(thenDo(toSome(mainTokenPair), matchToken('IdentifierName')),
        notDo(matchToken('Punctuator', ';')));


console.log("RESULT="+repr(a));
if (a._tag == "Some"){
    console.log("SEXP="+tkTreeToSExp(a.value.ast));
}
