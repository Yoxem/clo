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
                    remained: m.remained.slice(1)
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
let toSome = tk.toSome;
let thenDo = tk.thenDo;
let zeroOrOnceDo = tk.zeroOrOnceDo;
let orDo = tk.orDo;
let zeroOrMoreDo = tk.zeroOrMoreDo;
node_process_1.argv.forEach((val, index) => {
    console.log(`${index}=${val}`);
});
let commandInput = "int a str b"; //argv[2];
let commandInputTokenized = tk.tokenize(commandInput);
let commandInputTokenizedFiltered = commandInputTokenized.filter((x) => {
    return x.type != tk.TokenType.SP &&
        x.type != tk.TokenType.NL;
});
console.log("aaa: " + util.inspect(commandInputTokenizedFiltered, { showHidden: true, depth: null }));
/**
 * matchee pair of commandInputTokenized
 */
let commandTPair = { matched: [],
    remained: commandInputTokenizedFiltered };
let tInt = m1TType(tk.TokenType.INT);
let tFlo = m1TType(tk.TokenType.FLO);
let tStr = m1TType(tk.TokenType.STR);
let tId = m1TType(tk.TokenType.ID);
let tApos = m1TType(tk.TokenType.APOS);
function tBool(x) {
    let text = x.remained[0].text;
    if (text == "true" || text == "false") {
        return thenDo(toSome(x), m1TType(tk.TokenType.ID));
    }
    else {
        return { _tag: "None" };
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
function gramRHS(process, arrange) {
    return (m) => {
        let middle = process(m);
        console.log("Middle" + util.inspect(middle, { showHidden: true, depth: null }));
        if (middle._tag == "None") {
            return middle;
        }
        else {
            let matched = middle.value.matched;
            let arrLength = arrange.length;
            let returnRrray = Array(arrange.length);
            arrange.forEach((val, index) => {
                returnRrray[arrange[index]] = matched[index];
            });
            let matchedTmp1Length = matched.length - arrLength;
            console.log(matchedTmp1Length);
            var matchedTmp1 = matched
                .slice(0, matchedTmp1Length);
            console.log("matchedTmp1" + util.inspect(matchedTmp1, { showHidden: true, depth: null }));
            console.log("returnRrray" + util.inspect(returnRrray, { showHidden: true, depth: null }));
            matchedTmp1.push(returnRrray);
            let result = { _tag: "Some",
                value: { matched: matchedTmp1,
                    remained: middle.value.remained } };
            return result;
        }
    };
}
/**
 * typeABS ::= "'" ID
 */
var typeABS = (x) => {
    var result = thenDo(thenDo(toSome(x), tApos), tId);
    if (result._tag == "Some" && "text" in result.value.matched[1]) {
        var realToken = result.value.matched[1];
        realToken.text = "'" + realToken.text;
        result.value.matched = [realToken];
    }
    return result;
};
/**
 * TypeId ::=  typeABS | ID
 */
var typeName = (x) => {
    return thenDo(toSome(x), orDo(typeABS, tId));
};
/**
 *  CONST ::= INT | STR | FLO | BOOL
 */
/**
 * TODO: 要用 debugger 檢查分析問題
 */
var constParser = gramRHS((x) => { return thenDo(toSome(x), orDo(orDo(orDo(tInt, tFlo), tStr), tBool)); }, [0]);
/**
 * storing the tree
 */
var astTree = [];
/**
 * TYPE_PAIR ::= TYP_ID ID
 */
var typePair = (x) => {
    let a = thenDo(thenDo(x.maybeTokens, typeName), tId);
    if (a._tag == "Some") {
        let matched = a.value.matched;
        let slice = matched.slice(matched.length - 2);
        console.log("slice" + slice);
        let b = { maybeTokens: a, ast: slice };
        return b;
    }
    else {
        let b = { maybeTokens: a, ast: [] };
        return b;
    }
};
/**
 * function's arguments
 * FN_ARGS = TYPE_PAIR ("," TYPE_PAIR)+
 */
var fnArgs = (x) => {
    let wrapper = { maybeTokens: toSome(x), ast: [] };
    let a = typePair(wrapper);
    console.log("AAAAA" + util.inspect(a, { showHidden: true, depth: null }));
    let abanibi = typePair(a);
    console.log("ABNB" + util.inspect(abanibi, { showHidden: true, depth: null }));
    return { maybeTokens: abanibi.maybeTokens, ast: [a.ast, abanibi.ast] };
};
let tree = fnArgs(commandTPair);
console.log("CHRANN" + util.inspect(tree, { showHidden: true, depth: null }));
