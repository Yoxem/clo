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
let tComma = m1TType(tk.TokenType.COMMA);
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
 * Danger : Maybe it's not enough to work.
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
        // console.log("+"+signal+"+"+repr(a));
    }
    return a;
};
let circumfix = (f, signal) => (x) => {
    var a = f(x);
    if (a._tag == "Some") {
        console.log("$$$" + repr(a.value.ast));
        let inner = a.value.ast[a.value.ast.length - 2];
        var ast_middle;
        if (Array.isArray(inner)) {
            ast_middle = inner;
        }
        else {
            ast_middle = [inner];
        }
        let new_ast = [ast_middle];
        a.value.ast = new_ast;
    }
    return a;
};
/** single1 = tInt | "(" expr ")"*/
let single1 = circumfix((x) => thenDo(thenDo(thenDo(toSome(x), tLParen), expr), tRParen), "fac1");
let single2 = tInt;
let single = orDo(single1, single2);
/** args = single "," args | single */
let args1 = (x) => {
    var ret = thenDo(thenDo(thenDo(toSome(x), single), tComma), args);
    if (ret._tag == "Some") {
        let retLength = ret.value.ast.length;
        ret.value.ast = [[ret.value.ast[retLength - 3]].concat(ret.value.ast[retLength - 1])];
        console.log("$$" + repr(ret.value.ast));
    }
    return ret;
};
let args2 = single;
let args = orDo(args1, args2);
/** callees = "(" args ")" | "(" ")" */
let callees1 = circumfix((x) => thenDo(thenDo(thenDo(toSome(x), tLParen), args), tRParen), "callees1");
let callees2 = (x) => {
    let ret = thenDo(thenDo(toSome(x), tLParen), tRParen);
    if (ret._tag == "Some") {
        let new_ast = [[]];
        ret.value.ast = new_ast;
    }
    return ret;
};
let callees = orDo(callees1, callees2);
/** %apply R combinating token */
let applyToken = {
    text: "%apply",
    type: tk.TokenType.ID,
    col: 0,
    ln: 0,
};
/** facAux = callees facAux |  callees */
let facAux1 = (x) => {
    var ret = thenDo(thenDo(toSome(x), callees), facAux);
    if (ret._tag == "Some") {
        console.log("1232345" + repr(tkTreeToSExp(ret.value.ast[ret.value.ast.length - 1])));
        let last1 = ret.value.ast[ret.value.ast.length - 1];
        let last2 = ret.value.ast[ret.value.ast.length - 2];
        let b = [applyToken];
        ret.value.ast = [b.concat([last2, last1])];
        console.log("11111" + repr(tkTreeToSExp(ret.value.ast)));
    }
    ;
    return ret;
};
let facAux2 = callees;
let facAux = orDo(facAux1, facAux2);
/** fac = single facAux | single
 * Issue1 to be fixed.
 */
let fac1 = (x) => {
    var ret = thenDo(thenDo(toSome(x), single), facAux);
    if (ret._tag == "Some") {
        console.log("777" + repr(tkTreeToSExp(ret.value.ast)));
        ret.value.ast = [applyToken, ret.value.ast[ret.value.ast.length - 2],
            ret.value.ast[ret.value.ast.length - 1]];
        ret.value.ast;
        rearrangeTree(ret.value.ast);
        console.log("888" + repr(tkTreeToSExp(ret.value.ast)));
    }
    return ret;
};
let fac2 = single;
let fac = orDo(fac1, fac2);
/**
 * rearrangeTree : for applyToken subtree from right-combination to
 * left-combination
 * @input x a ast
 * @return another ast
 */
function rearrangeTree(x) {
    if (x !== undefined) {
        for (var i = 1; i < x.length; i++) {
            rearrangeTree(x[i]);
        }
        console.log("@@" + repr(x[0]));
        if (x[0] == applyToken) {
            if (Array.isArray(x[2]) && x[2][0] == applyToken) {
                let rl = rearrangeTree(x[2][1]);
                let rr = rearrangeTree(x[2][2]);
                let l = rearrangeTree(x[1]);
                x[0] = applyToken;
                x[1] = [applyToken, l, rl];
                x[2] = rr;
                console.log("@@==" + repr(x));
                return x;
            }
            else {
                x[0] = applyToken;
                x[1] = rearrangeTree(x[1]);
                x[2] = rearrangeTree(x[2]);
                console.log("@@==" + repr(x));
                return x;
            }
        }
        return x;
    }
}
/**
 *
 * term1 = fac (MUL | DIV) fac
 */
let term1 = midfix((x) => thenDo(thenDo(thenDo(toSome(x), fac), orDo(tMul, tDiv)), fac), "term1");
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
let expr1 = midfix((x) => thenDo(thenDo(thenDo(toSome(x), term), orDo(tAdd, tSub)), term), "expr1");
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
let tokens4 = tk.tokenize("2()(4)");
//let tokens = tk.tokenize("(4-(3/4))");
//tk.tokenize(argv[2]);
let tokensFiltered = tokens4.filter((x) => {
    return (x.type != tk.TokenType.NL
        && x.type != tk.TokenType.SP);
});
let beta = expr({
    matched: [],
    remained: tokensFiltered,
    ast: []
});
if (beta._tag == "Some") {
    beta.value.ast = rearrangeTree(beta.value.ast);
    console.log(tkTreeToSExp(beta.value.ast));
}
console.log("RESULT=" + repr(beta));
