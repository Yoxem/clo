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
    };
}
exports.m1TType = m1TType;
;
let toSome = tk.toSome;
let thenDo = tk.thenDo;
let orDo = tk.orDo;
node_process_1.argv.forEach((val, index) => {
    console.log(`${index}=${val}`);
});
let commandInput = node_process_1.argv[2];
let commandInputTokenized = tk.tokenize(commandInput);
console.log(commandInputTokenized);
/**
 * matchee pair of commandInputTokenized
 */
let commandTPair = { matched: [],
    remained: commandInputTokenized };
let tInt = m1TType(tk.TokenType.INT);
let tFlo = m1TType(tk.TokenType.FLO);
let tStr = m1TType(tk.TokenType.STR);
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
        let result = process(m);
        console.log(`result ${result}`);
        if (result._tag == "None") {
            return result;
        }
        else {
            let matched = result.value.matched;
            let return_array = Array(arrange.length);
            arrange.forEach((val, index) => {
                return_array[arrange[index]] = matched[index];
            });
            return return_array;
        }
    };
}
var constParser = gramRHS((x) => { return thenDo(toSome(x), orDo(orDo(orDo(tInt, tFlo), tStr), tBool)); }, [0]);
let tree = constParser(commandTPair);
console.log(util.inspect(tree, { showHidden: true, depth: null }));
