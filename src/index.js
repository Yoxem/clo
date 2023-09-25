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
exports.OnceOrMoreDo = exports.matchAny = exports.m1TType = exports.tkTreeToSExp = void 0;
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
 * convert a `tkTree` AST to S-expr string
 * @param t the `tkTree`
 * @returns S-expr String
 */
function tkTreeToSExp(t) {
    var str = "";
    if (Array.isArray(t)) {
        let strArray = t.map((x) => tkTreeToSExp(x));
        str = "(" + strArray.join(" ") + ")";
    }
    else {
        if (t === undefined) {
            str = "%undefined";
        }
        else {
            str = t.text;
        }
    }
    return str;
}
exports.tkTreeToSExp = tkTreeToSExp;
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
let tId = m1TType(tk.TokenType.ID);
let tAdd = m1TType(tk.TokenType.I_ADD);
let tSub = m1TType(tk.TokenType.I_SUB);
let tMul = m1TType(tk.TokenType.I_MUL);
let tDiv = m1TType(tk.TokenType.I_DIV);
let tLParen = m1TType(tk.TokenType.L_PAREN);
let tRParen = m1TType(tk.TokenType.R_PAREN);
let toSome = tk.toSome;
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
/**
 *
 * @param m : the `MatcheePair` to be consumed.
 * @returns if the length of `m.remained` >= 1; consumes the matchee by 1 token
 *  and wraps it in `Some`,
 * otherwise, returns `None`.
 */
function matchAny(m) {
    if (m.remained.length >= 1) {
        return {
            _tag: "Some", value: {
                matched: m.matched.concat(m.remained[0]),
                remained: m.remained.slice(1),
                ast: [m.remained[0]],
            }
        };
    }
    else {
        return { _tag: "None" };
    }
}
exports.matchAny = matchAny;
/**
* @description repeating matching function `f`
* zero or more times, like the asterisk `*` in regex `f*` .
* @param f : the function to be repeated 0+ times.
* @returns:the combined function
*/
function OnceOrMoreDo(f) {
    return (x) => {
        var wrappedOldX = { _tag: "Some", value: x };
        var wrappedNewX = wrappedOldX;
        var counter = -1;
        while (wrappedNewX._tag != "None") {
            wrappedOldX = wrappedNewX;
            wrappedNewX = thenDo(wrappedOldX, f);
            counter += 1;
        }
        ;
        if (counter <= 0) {
            return { _tag: "None" };
        }
        let ast = wrappedOldX.value.ast;
        wrappedOldX.value.ast = ast.slice(ast.length - counter);
        console.log(repr(wrappedOldX.value.ast));
        return wrappedOldX;
    };
}
exports.OnceOrMoreDo = OnceOrMoreDo;
/**
 * aux function for midfix operator
 * @param f function
 * @param signal the rule name
 * @returns
 */
let midfix = (f, signal) => (x) => {
    var a = f(x);
    if (a._tag == "Some") {
        let ast_tail = slice(a.value.ast, a.value.ast.length - 3);
        let new_ast = [ast_tail];
        a.value.ast = new_ast;
        console.log("+" + signal + "+" + repr(a));
    }
    return a;
};
let circumfix = (f, signal) => (x) => {
    var a = f(x);
    if (a._tag == "Some") {
        let inner = a.value.ast[a.value.ast.length - 2];
        let ast_middle = [inner];
        let new_ast = [ast_middle];
        a.value.ast = new_ast;
    }
    return a;
};
/**
 * TODO: 12(13)(14) only parsed with only 12(13)
 */
/** single1 = tInt | "(" expr ")"*/
let single1 = circumfix((x) => thenDo(thenDo(thenDo(tk.toSome(x), tLParen), expr), tRParen), "fac1");
let single2 = tInt;
let single = orDo(single1, single2);
/** func = single | single "(" single ")"
 * i.e.
 *
 * func = single |  func_aux ( int )
 *
*/
/** fac = single ["(" single ")"]?  | single */
let fac1Appliee = circumfix((x) => thenDo(thenDo(thenDo(tk.toSome(x), tLParen), tInt), tRParen), "fac1");
let fac1 = (x) => {
    let raw = thenDo(thenDo(toSome(x), single), OnceOrMoreDo(fac1Appliee));
    console.log("+" + "火鳥" + "+" + repr(raw));
    if (raw._tag == "Some") {
        var result = raw.value.ast[0];
        let applyToken = { text: '%apply', ln: 0, col: 0 };
        for (var i = 1; i < raw.value.ast.length; i++) {
            result = [applyToken, result, raw.value.ast[i]];
        }
        console.log("+" + "hitori" + "+" + repr(result));
        if (!Array.isArray(result)) {
            raw.value.ast = [result];
        }
        else {
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
let term1 = midfix((x) => thenDo(thenDo(thenDo(tk.toSome(x), fac), orDo(tMul, tDiv)), fac), "term1");
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
let expr1 = midfix((x) => thenDo(thenDo(thenDo(tk.toSome(x), term), orDo(tAdd, tSub)), term), "expr1");
/**
 * expr2 = term
 */
let expr2 = term;
/**
 * expr = expr1 | expr2
 */
let expr = orDo(expr1, expr2);
let tokens = tk.tokenize("1");
//let tokens = tk.tokenize("(4-(3/4))");
//tk.tokenize(argv[2]);
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
if (beta._tag == "Some") {
    console.log(tkTreeToSExp(beta.value.ast));
}
console.log("RESULT=" + repr(beta));
