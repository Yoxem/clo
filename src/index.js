"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenize = exports.zeroOrOnceDo = exports.notDo = exports.zeroOrMoreDo = exports.orDo = exports.thenDo = exports.charToCodepoint = exports.matchRange = exports.matchAny = exports.match1Char = exports.TokenType = void 0;
var fs = require('fs');
/**
 * wrap a x in a `Some(T)`
 * @param x : variable to be wrapped.
 * @returns wrapped `x`.
 */
function toSome(x) {
    return { _tag: "Some", value: x };
}
/**
 * The types of Token
 *    NL, // newline
 *
 *   SP, // half-width space and tab
 *
 * ID, // identifier
 *
 * STR, // string
 *
 * OP, // operator or something like it
 *
 * FLO, // float num
 *
 * INT, // Integer
 */
var TokenType;
(function (TokenType) {
    TokenType[TokenType["NL"] = 0] = "NL";
    TokenType[TokenType["SP"] = 1] = "SP";
    TokenType[TokenType["ID"] = 2] = "ID";
    TokenType[TokenType["STR"] = 3] = "STR";
    TokenType[TokenType["OP"] = 4] = "OP";
    TokenType[TokenType["FLO"] = 5] = "FLO";
    TokenType[TokenType["INT"] = 6] = "INT";
})(TokenType || (exports.TokenType = TokenType = {}));
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
        if (m.remained.length == 0) {
            return { _tag: "None" };
        }
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
 *
 * @param m : the `MatcheePair` to be consumed.
 * @returns if the length of `m.remained` >= 1; consumes the matchee by 1 char and wraps it in `Some`,
 * otherwise, returns `None`.
 */
function matchAny(m) {
    if (m.remained.length >= 1) {
        return { _tag: "Some", value: {
                matched: m.matched + m.remained[0],
                remained: m.remained.substring(1)
            } };
    }
    else {
        return { _tag: "None" };
    }
}
exports.matchAny = matchAny;
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
        if (m.remained.length < 1) {
            return { _tag: "None" };
        }
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
 * @param input: the wrapped input.
 * @param f: the function to be applied.
 *
 * @returns:the applied wrapped result `MatcheePair`.
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
/**
 * @description "or", like the regex `( f1 | f2 )` .
 * It returns a function `f` of which the argument is`x`.
 * if `f1(x)` is None, then `f` returns `f2(x)`. Otherwise,
 * `F` returns `f1(x)`.
 * @param f1 : 1st function to be compared
 * @param f2 : 2nd function to be compared
 * @returns:the combined function
 */
function orDo(f1, f2) {
    return (x) => {
        let f1x = (f1(x));
        {
            if (f1x._tag == "None") {
                return f2(x);
            }
            else {
                return f1x;
            }
        }
    };
}
exports.orDo = orDo;
/**
* @description repeating matching function `f`
* zero or more times, like the asterisk `*` in regex `f*` .
* @param f : the function to be repeated 0+ times.
* @returns:the combined function
*/
function zeroOrMoreDo(f) {
    return (x) => {
        var wrapped_old_x = { _tag: "Some", value: x };
        var wrapped_new_x = wrapped_old_x;
        while (wrapped_new_x._tag != "None") {
            wrapped_old_x = wrapped_new_x;
            wrapped_new_x = thenDo(wrapped_old_x, f);
        }
        ;
        return wrapped_old_x;
    };
}
exports.zeroOrMoreDo = zeroOrMoreDo;
/**
* @description Not. like the `^` inside regex of [^f].
* returns a function `F(x)` such that if  `f(x)` is `None`,
* returns the x consuming a char; if `f(x)` is not None, F(x)
* returns `None`.
* @param f: the function forbidden to be matched.
* @returns: combined function `F`.
*/
function notDo(f) {
    return (x) => {
        let wrapped_x = {
            _tag: "Some",
            value: x
        };
        let f_x = thenDo(wrapped_x, f);
        if (f_x._tag != "None") {
            return { _tag: "None" };
        }
        else {
            return thenDo(wrapped_x, matchAny);
        }
    };
}
exports.notDo = notDo;
/**
 * if `x` is matched by `f` once, returns `f(x)`. Otherwise,
 * returns x
 * similar to `?` in regex `f?`.
 * @param f : the function to be matched
 * @returns return wrapped f(x)
 */
function zeroOrOnceDo(f) {
    return (x) => {
        var wrapped_old_x = { _tag: "Some", value: x };
        var wrapped_new_x = thenDo(wrapped_old_x, f);
        if (wrapped_new_x._tag != "None") {
            return wrapped_new_x;
        }
        else {
            return wrapped_old_x;
        }
    };
}
exports.zeroOrOnceDo = zeroOrOnceDo;
function tokenize(input) {
    var input_matchee_pair = toSome({ matched: "",
        remained: input });
    // integer = ([+]|[-])?\d\d*
    let integer = (x) => {
        let wrapped_x = toSome(x);
        let plusMinus = orDo(match1Char('+'), match1Char('-')); // ([+]|[-])
        let d = matchRange('0', '9'); // \d
        var result = thenDo(thenDo(thenDo(wrapped_x, zeroOrOnceDo(plusMinus)), d), zeroOrMoreDo(d));
        if (result._tag == "Some") {
            result.value.matched_type = TokenType.INT;
        }
        return result;
    };
    let space = (x) => {
        let wrapped_x = toSome(x);
        let s_aux = orDo(match1Char(' '), match1Char('\t')); // (" " | "\t")
        var result = thenDo(thenDo(wrapped_x, s_aux), zeroOrMoreDo(s_aux));
        if (result._tag == "Some") {
            result.value.matched_type = TokenType.SP;
        }
        return result;
    };
    let newline = (x) => {
        let wrapped_x = toSome(x);
        // nl = \r?\n
        let result = thenDo(thenDo(wrapped_x, zeroOrOnceDo(match1Char('\r'))), match1Char('\n'));
        if (result._tag == "Some") {
            result.value.matched_type = TokenType.NL;
        }
        return result;
    };
    let term = (token_list, x) => {
        var ln = 1;
        var col = 0;
        var old_x = x;
        let term_list = [newline, space, integer];
        let term_aux = term_list.reduce((x, y) => orDo(x, y));
        var new_x = thenDo(old_x, term_aux);
        while (new_x._tag != "None") {
            if (new_x.value.matched_type != TokenType.NL) {
                col += new_x.value.matched.length;
                token_list.push({ text: new_x.value.matched,
                    type: new_x.value.matched_type,
                    ln: ln,
                    col: col });
            }
            else {
                col = 0;
                ln += 1;
                token_list.push({ text: new_x.value.matched,
                    type: new_x.value.matched_type,
                    ln: ln,
                    col: col });
            }
            old_x = toSome({ matched: "",
                remained: new_x.value.remained });
            new_x = thenDo(old_x, term_aux);
        }
        if (old_x.value.remained.length) {
            console.log(token_list);
            throw new Error("the code can't be tokenized is near Ln. " + ln + ", Col." + col
                + ", starting with " + old_x.value.remained.substring(0, 10));
        }
        return token_list;
    };
    console.log(term([], input_matchee_pair));
    // TODO: id, string, space, basic operator, 3 marks: @, {, }.
}
exports.tokenize = tokenize;
