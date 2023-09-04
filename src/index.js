"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.thenDo = exports.charToCodepoint = exports.matchRange = exports.match1Char = void 0;
var fs = require('fs');
/**
 * @description
 * it returns a function which test if the first char of the `remained` part of
 *  the argument of the function is `c`, if it's true, update the `MatchedPair` wrapped
 * in `Some`. Otherwise, it returns `None`.
 *  * @param c : the char to be test.
 * @returns the updated `MatchedPair` wrapped in `Some(x)` or `None`.
 */
function match1Char(c) {
    return (m) => {
        const charToBeMatched = m.remained[0];
        if (charToBeMatched === c) {
            return { _tag: "Some", value: {
                    matched: m.matched + charToBeMatched,
                    remained: m.remained.substring(1)
                } };
        }
        else {
            return { _tag: "None" };
        }
    };
}
exports.match1Char = match1Char;
;
/**
 * @description
 * it returns a function which test if the first char of the `remained` part of
 *  the argument of the function is between `l` and `u`, if it's true, update the `MatchedPair` wrapped
 * in `Some`. Otherwise, it returns `None`.
 *  * @param l : lower bound char, 1-char string
 *  * @param u : upper bound char, 1-char string
 * @returns the updated `MatchedPair` wrapped in `Some(x)` or `None`.
 */
function matchRange(l, u) {
    let lCodepoint = charToCodepoint(l);
    let uCodepoint = charToCodepoint(u);
    if (l > u) {
        throw new Error("Error: the codepoint of `" + l + "` is not smaller than `" + u + "`)");
    }
    return (m) => {
        const charToBeMatched = m.remained[0];
        const codePointToBeMatched = charToCodepoint(charToBeMatched);
        if (codePointToBeMatched >= lCodepoint && codePointToBeMatched <= uCodepoint) {
            return { _tag: "Some", value: {
                    matched: m.matched + charToBeMatched,
                    remained: m.remained.substring(1)
                } };
        }
        else {
            return { _tag: "None" };
        }
    };
}
exports.matchRange = matchRange;
;
/**
 * convert the one-char string to codepoint.
 * @param s : the string to code point.
 * @returns if `s.length > 1` return error; otherwise, return the codepoint of `s`.
 */
function charToCodepoint(s) {
    if (s.length > 1) {
        throw new Error("Error: the length of input string for " + s + "is " + s.length + `,
        however, it should be 1.`);
    }
    else {
        return s.charCodeAt(0);
    }
}
exports.charToCodepoint = charToCodepoint;
/**
 *  @description thendo(input, f, ...) like
 * a ==> f
 */
function thenDo(input, f) {
    if (input._tag == "None") {
        return input;
    }
    else {
        let inner = input.value;
        return f(inner);
    }
}
exports.thenDo = thenDo;
