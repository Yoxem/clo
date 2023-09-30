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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchAny = exports.tkTreeToSExp = void 0;
var fs = require('fs');
const js_tokens_1 = __importDefault(require("js-tokens"));
const util = __importStar(require("util"));
/**
 *
 * # REPRESENTATION
 */
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
            str = t.value;
        }
    }
    return str;
}
exports.tkTreeToSExp = tkTreeToSExp;
/**inspect the inner of the representation. */
let repr = (x) => { return util.inspect(x, { depth: null }); };
/**
 *
 * # PARSER UNITS
 */
function toSome(x) {
    return { _tag: "Some", value: x };
}
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
 * like regex [^c]
 * @param f input token function. one token only.
 * @returns combined finction
 */
function notDo(f) {
    return (x) => {
        let res1 = f(x);
        if (res1._tag == "Some") {
            return { _tag: "None" };
        }
        else {
            let res2 = matchAny(x);
            return res2;
        }
    };
}
function matchToken(typeName, value) {
    return (t) => {
        let headToken = t.remained[0];
        if (headToken.type != typeName) {
            return { _tag: "None" };
        }
        else {
            if (value === undefined || value == headToken.value) {
                let newTokenPair = {
                    matched: t.matched.concat(headToken),
                    remained: t.remained.slice(1),
                    ast: [headToken]
                };
                return { _tag: "Some", value: newTokenPair };
            }
            else {
                return { _tag: "None" };
            }
        }
        ;
    };
}
;
/**
 *
 * # TEST
 */
const tokens = Array.from((0, js_tokens_1.default)(`import; foo from\t 'bar';
import * as util  from 'util';


花非花，霧\\{非霧 。{{foo();}}下
一句`));
console.log("RESULT=" + repr(tokens));
var mainTokenPair = {
    matched: [],
    remained: tokens,
    ast: []
};
let a = thenDo(thenDo(toSome(mainTokenPair), matchToken('IdentifierName')), notDo(matchToken('Punctuator', ';')));
console.log("RESULT=" + repr(a));
if (a._tag == "Some") {
    console.log("SEXP=" + tkTreeToSExp(a.value.ast));
}
