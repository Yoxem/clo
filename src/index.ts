var fs = require('fs');
import { argv } from 'node:process';
import * as tk from './tokenize.js';
import * as util from 'util';

/**
 * token tree type.
 */
type tkTree = tk.Token[] | tk.Token

export interface TokenMatcheePair {
    matched: tkTree[]
    remained: tk.Token[]
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
            m.matched.push(ttbm);
            return {
                _tag: "Some", value: {
                    matched: m.matched,
                    remained: m.remained.slice(1)
                }
            };
        }
        else {
            return { _tag: "None" };
        }
    }
};

let toSome = tk.toSome;
let thenDo = tk.thenDo;
let orDo = tk.orDo;


argv.forEach((val, index) => {
    console.log(`${index}=${val}`);
});

let commandInput = argv[2];
let commandInputTokenized = tk.tokenize(commandInput);
console.log(commandInputTokenized);

/**
 * matchee pair of commandInputTokenized
 */
let commandTPair : TokenMatcheePair = {matched:[],
                                remained: commandInputTokenized};


let tInt = m1TType(tk.TokenType.INT);
let tFlo = m1TType(tk.TokenType.FLO);
let tStr = m1TType(tk.TokenType.STR);
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

    let result : tk.Maybe<TokenMatcheePair> = process(m);
    console.log(`result ${result}`)
    if (result._tag == "None"){
        return result;
    }
    else{
        let matched = result.value.matched;
        let return_array : tkTree[] = Array(arrange.length);

        arrange.forEach((val, index) => {
            return_array[arrange[index]] = matched[index];
        });

        return return_array;
    }
    }
}

/**
 *  CONST ::= INT | STR | FLO | BOOL
 */
var constParser = gramRHS((x : TokenMatcheePair)=>
    {return thenDo(toSome(x),orDo(orDo(orDo(tInt,tFlo),tStr),tBool))}, [0]);

let tree = constParser(commandTPair);
console.log(util.inspect(tree, { showHidden: true, depth: null })); 
