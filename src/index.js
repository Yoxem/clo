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
exports.match1token = void 0;
var fs = require('fs');
const tk = __importStar(require("./tokenize.js"));
let b = tk.tokenize("2+2");
/**
 * @description
 * it returns a function which test if the first char of the `remained` part of
 *  the argument of the function is `c`, if it's true, update the `MatchedPair` wrapped
 * in `Some`. Otherwise, it returns `None`.
 *  * @param t : the char to be test.
 * @returns the updated `MatchedPair` wrapped in `Some(x)` or `None`.
 */
function match1token(t) {
    return (m) => {
        if (m.remained.length == 0) {
            return { _tag: "None" };
        }
        const tokenToBeMatched = m.remained[0];
        if (tokenToBeMatched === t) {
            m.matched.push(tokenToBeMatched);
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
exports.match1token = match1token;
;
let c = tk.toSome(b);
console.log(thenDo(c, match1token(tk.tokenize("+")[0])));
