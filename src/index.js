"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.m1TType = void 0;
var fs = require('fs');
const node_process_1 = require("node:process");
const tk = __importStar(require("./tokenize.js"));
const util = __importStar(require("util"));
/**
 * debug reprensenting
 */
let repr = (x) => { return util.inspect(x, { depth: null }); };
/**
 * concated 2 `tkTree`s
 * @param x the array to be concated
 * @param y the item or array to ve concated
 * @returns concated tkTree array, or thrown error if can't be concated.
 */
function concat(x, y) {
    if (Array.isArray(x)) {
        return x.concat(y);
    }
    else {
        throw new Error("the tkTree can't be concated, because it's not an array.");
    }
}
function slice(x, index, end) {
    if (Array.isArray(x)) {
        return x.slice(index, end);
    }
    else {
        throw new Error("the tkTree can't be concated, because it's not an array.");
    }
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
function m1TType(typ) {
    return (m) => {
        if (m.remained.length == 0) {
            return { _tag: "None" };
        }
        /**
         * token to be matched
         * */
        const ttbm = m.remained[0];
        if (ttbm.type == typ) {
            let new_matched = m.matched.concat(ttbm);
            let result = {
                _tag: "Some", value: {
                    matched: new_matched,
                    remained: m.remained.slice(1),
                    ast: ([ttbm]),
                }
            };
            return result;
        }
        else {
            return { _tag: "None" };
        }
    };
}
exports.m1TType = m1TType;
;
/**
 * type int
 */
let tInt = m1TType(tk.TokenType.INT);
let tAdd = m1TType(tk.TokenType.I_ADD);
let tMul = m1TType(tk.TokenType.I_MUL);
node_process_1.argv.forEach((val, index) => {
    console.log(`${index}=${val}`);
});
/**
 * like `m ==> f` in ocaml
 * @param m matchee wrapped
 * @param f matching function
 * @returns wrapped result
 */
function thenDo(m, f) {
    if (m._tag == "None") {
        return m;
    }
    else {
        var a = f(m.value);
        if (a._tag == "Some") {
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
function orDo(f1, f2) {
    return (x) => {
        let res1 = f1(x);
        if (res1._tag == "Some") {
            return res1;
        }
        else {
            let res2 = f2(x);
            return res2;
        }
    };
}
let midfix = (f, signal) => (x) => {
    var a = f(x);
    if (a._tag == "Some") {
        let ast_head = slice(a.value.ast, 0, a.value.ast.length - 3);
        let ast_tail = slice(a.value.ast, a.value.ast.length - 3);
        let new_ast = [ast_tail];
        a.value.ast = new_ast;
        console.log("+" + signal + "+" + repr(a));
    }
    return a;
};
/**
 *
 * fac1 = int MUL int
 */
//let fac1 = midfix((x : TokenMatcheePair)=>
//            thenDo(thenDo(thenDo(tk.toSome(x), tInt), tMul), tInt));
let fac1 = (x) => {
    let a = midfix((x) => thenDo(thenDo(thenDo(tk.toSome(x), tInt), tMul), tInt), "fac1")(x);
    return a;
};
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
let expr1 = midfix((x) => thenDo(thenDo(thenDo(tk.toSome(x), fac), tAdd), fac), "expr1");
/**
 * expr2 = fac
 */
let expr2 = fac;
/**
 * expr = expr1 | expr2
 */
let expr = orDo(expr1, expr2);
let tokens = tk.tokenize("2+3"); //tk.tokenize(argv[2]);
let tokensFiltered = tokens.filter((x) => {
    return (x.type != tk.TokenType.NL
        && x.type != tk.TokenType.SP);
});
let wrappedTokens = tk.toSome({
    matched: [],
    remained: tokensFiltered,
    ast: []
});
let beta = expr({
    matched: [],
    remained: tokensFiltered,
    ast: []
});
console.log(repr(wrappedTokens));
console.log(repr(beta));
