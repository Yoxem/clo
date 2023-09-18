import * as util from 'util';

var fs = require('fs');

export type Some<T> = { _tag: "Some"; value: T };
export type None = { _tag: "None" };
/**
 * part for tokenize the input string
 */

/**
 * wrap a x in a `Some(T)`
 * @param x : variable to be wrapped.
 * @returns wrapped `x`.
 */
export function toSome<T>(x: T): Some<T> {
    return { _tag: "Some", value: x };
}
/**
 * @description Like the `Some(a)` and `None` in Rust.
 *
 * @example
 * ```ts
 * let exam1 : Maybe<Number> = { _tag: "Some", value: 12 };
 * let exam2 : Maybe<Number> = None;
 * ```
 */
export type Maybe<T> = Some<T> | None;


/**
 * @description
 * the pair of the string to be matched later and the string that have been matched
 * @var matched : have been matched
 * @var remained : will be tested whether it'll be matched.
 * @var matched_type (optional): the type of the matched string
*/
export interface MatcheePair {
    matched: string
    remained: string
    matched_type?: TokenType
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
 * INT, // integer
 * 
 * I_* // integer manipulation
 * 
 * F_* // float manipulation
 * 
 * SEMI_C// semi-colon
 */
export enum TokenType {
    NL, // newline
    SP, // half-width space and tab
    ID, // identifier
    STR, // string
    FLO, // float num
    INT, // integer
    F_ADD,
    F_SUB,
    F_MUL,
    F_DIV,
    I_ADD,
    I_SUB,
    I_MUL,
    I_DIV,
    L_PAREN, // (
    R_PAREN, // )
    L_BRACK, // [
    R_BRACK, // ]
    L_BRACE, // {
    R_BRACE, // }
    COMMA, // ,
    DOT, // .
    COLON, // :
    SEMI_C, // ;
    AT, // @
    HASH, // #
    EQ, // ==
    SET, // =
    GT, // > greater than
    LT, // <less than
    GE, // >=
    LE, // <=
    NE, // <>
    APOS, // '
    R_ARROW, // ->
    TRUE, // true
    FALSE, // false
    IF, // if
}

/**
 * tokenized token.
 * @var text : the content text
 * @var type (optional): the type of the token
 * @var col : the column number
 * @var ln : the line number
 */
export interface Token {
    text: string,
    type?: TokenType,
    col: number,
    ln: number,
}

/**
 * @description
 * it returns a function which test if the first char of the `remained` part of
 *  the argument of the function is `c`, if it's true, update the `MatchedPair` wrapped
 * in `Some`. Otherwise, it returns `None`.
 *  * @param c : the char to be test.
 * @returns the updated `MatchedPair` wrapped in `Some(x)` or `None`.
 */
export function match1Char(c: string): (m: MatcheePair) => Maybe<MatcheePair> {
    return (m: MatcheePair) => {
        if (m.remained.length == 0) {
            return { _tag: "None" };
        }
        const charToBeMatched = m.remained[0];
        if (charToBeMatched === c) {
            return {
                _tag: "Some", value: {
                    matched: m.matched + charToBeMatched,
                    remained: m.remained.substring(1)
                }
            };
        }
        else {
            return { _tag: "None" };
        }
    }
};

/**
 * 
 * @param m : the `MatcheePair` to be consumed.
 * @returns if the length of `m.remained` >= 1; consumes the matchee by 1 char and wraps it in `Some`,
 * otherwise, returns `None`.
 */
export function matchAny(m: MatcheePair): Maybe<MatcheePair> {
    if (m.remained.length >= 1) {
        return {
            _tag: "Some", value: {
                matched: m.matched + m.remained[0],
                remained: m.remained.substring(1)
            }
        };
    } else {
        return { _tag: "None" };
    }
}

/**
 * @description
 * it returns a function which test if the first char of the `remained` part of
 *  the argument of the function is between `l` and `u`, if it's true, update the `MatchedPair` wrapped
 * in `Some`. Otherwise, it returns `None`.
 *  * @param l : lower bound char, 1-char string
 *  * @param u : upper bound char, 1-char string
 * @returns the updated `MatchedPair` wrapped in `Some(x)` or `None`.
 */
export function matchRange(l: string, u: string): (m: MatcheePair) => Maybe<MatcheePair> {
    let lCodepoint = charToCodepoint(l);
    let uCodepoint = charToCodepoint(u);
    if (l > u) {
        throw new Error("Error: the codepoint of `" + l + "` is not smaller than `" + u + "`)");
    }
    return (m: MatcheePair) => {
        if (m.remained.length < 1) {
            return { _tag: "None" };
        }
        const charToBeMatched = m.remained[0];
        const codePointToBeMatched = charToCodepoint(charToBeMatched);
        if (codePointToBeMatched >= lCodepoint && codePointToBeMatched <= uCodepoint) {
            return {
                _tag: "Some", value: {
                    matched: m.matched + charToBeMatched,
                    remained: m.remained.substring(1)
                }
            };
        }
        else {
            return { _tag: "None" };
        }
    }
};


/**
 * check if a matcheePair `m` matches a stringv `s`. 
 * @param s the checker string.
 * @returns `None` or matched pair wrapped in `Some`
 */
export function matchWord(s: string, ): (m: MatcheePair) => Maybe<MatcheePair> {
    return (m)=>{
        if (s.length==0){
            return { _tag: "None" };
        }
        var someM : Maybe<MatcheePair> = toSome(m);
        for (var idx : number=0; idx<s.length; idx++){
            someM = thenDo(someM, match1Char(s[idx]))
        }
        return someM;
    }
}

/**
 * convert the one-char string to codepoint.
 * @param s : the string to code point.
 * @returns if `s.length > 1` return error; otherwise, return the codepoint of `s`.
 */
export function charToCodepoint(s: string): number {
    if (s.length > 1) {
        throw new Error("Error: the length of input string for " + s + "is " + s.length + `,
        however, it should be 1.`);
    } else {
        return s.charCodeAt(0);
    }
}

/**
 *  @description thendo(input, f, ...) like
 * a ==> f
 * @param input: the wrapped input. 
 * @param f: the function to be applied.
 * 
 * @returns:the applied wrapped result `MatcheePair`.
 */
export function thenDo<T>(input: Maybe<T>, f: Function): Maybe<T> {
    if (input._tag == "None") {
        return input;
    }
    else {
        let inner = input.value;
        return f(inner);
    }
}

/**
 * @description "or", like the regex `( f1 | f2 )` . 
 * It returns a function `f` of which the argument is`x`.
 * if `f1(x)` is None, then `f` returns `f2(x)`. Otherwise, 
 * `F` returns `f1(x)`.
 * @param f1 : 1st function to be compared
 * @param f2 : 2nd function to be compared
 * @returns:the combined function
 */
export function orDo<T>(f1: Function, f2: Function): (x: T) => Maybe<T> {
    return (x) => {
        let f1x: Maybe<T> = (f1(x));
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


/**
* @description repeating matching function `f` 
* zero or more times, like the asterisk `*` in regex `f*` . 
* @param f : the function to be repeated 0+ times.
* @returns:the combined function
*/
export function zeroOrMoreDo<T>(f: Function): (x: T) => Maybe<T> {
    return (x) => {
        var wrapped_old_x: Maybe<T> = { _tag: "Some", value: x };
        var wrapped_new_x: Maybe<T> = wrapped_old_x;

        while (wrapped_new_x._tag != "None") {
            wrapped_old_x = wrapped_new_x;
            wrapped_new_x = thenDo(wrapped_old_x, f);
        };

        return wrapped_old_x;
    };
}

/**
* @description Not. like the `^` inside regex of [^f].
* returns a function `F(x)` such that if  `f(x)` is `None`,
* returns the x consuming a char; if `f(x)` is not None, F(x)
* returns `None`.
* @param f: the function forbidden to be matched.
* @returns: combined function `F`.
*/
export function notDo<T>(f: Function): (x: T) => Maybe<T> {
    return (x) => {
        let wrapped_x: Maybe<T> = {
            _tag: "Some",
            value: x
        };
        let f_x = thenDo(wrapped_x, f);

        if (f_x._tag != "None") {
            return { _tag: "None" };
        } else {
            return thenDo(wrapped_x, matchAny);
        }
    };
}

/**
 * if `x` is matched by `f` once, returns `f(x)`. Otherwise, 
 * returns x
 * similar to `?` in regex `f?`.
 * @param f : the function to be matched
 * @returns return wrapped f(x)
 */
export function zeroOrOnceDo<T>(f: Function): (x: T) => Maybe<T> {
    return (x) => {
        var wrapped_old_x: Maybe<T> = { _tag: "Some", value: x };
        var wrapped_new_x = thenDo(wrapped_old_x, f);

        if (wrapped_new_x._tag != "None") {
            return wrapped_new_x;
        } else {
            return wrapped_old_x;
        }
    };
}


export function tokenize(input: string): Array<Token> {
    var input_matchee_pair: Maybe<MatcheePair> = toSome(
        {
            matched: "",
            remained: input
        });

    /**
     * generate a parser of a basic term (b_term)
     * @param pattern : the pattern parser
     * @param token_type : the returning token type
     * @returns a wrapped parser.
     */
    function bTerm(pattern: Function, token_type: TokenType) {
        return (x: MatcheePair) => {
            let wrapped_x = toSome(x);
            let result = pattern(wrapped_x);
            if (result._tag == "Some") {
                result.value.matched_type = token_type;
            }
            return result;
        }
    }

    let d = matchRange('0', '9'); // \d
    // [+-]
    let plusMinus = orDo(match1Char('+'), match1Char('-'));
    let s_aux = orDo(match1Char(' '), match1Char('\t')); // (" " | "\t")

    // integer = ([+]|[-])?\d\d*
    let integer = bTerm((x: Maybe<MatcheePair>) =>
        thenDo(thenDo(thenDo(x,
            zeroOrOnceDo(plusMinus)), d),
            zeroOrMoreDo(d)),
        TokenType.INT);
    // space = [ \t]+
    let space = bTerm((x: Maybe<MatcheePair>) =>
        thenDo(thenDo(x, s_aux), zeroOrMoreDo(s_aux)),
        TokenType.SP);

    // newline = \r?\n
    let newline = bTerm((x: Maybe<MatcheePair>) =>
        thenDo(thenDo(x,
            zeroOrOnceDo(match1Char('\r'))),
            match1Char('\n')),
        TokenType.NL);

    // [_A-Za-z]
    let idHead = orDo(orDo(matchRange('a', 'z'), matchRange('A', 'Z')), match1Char('_'));
    let idRemained = orDo(idHead, matchRange('0', '9')); // [_A-Za-z0-9]

    // id = [_A-Za-z][_A-Za-z0-9]*
    let id = bTerm((x: Maybe<MatcheePair>) =>
        thenDo(thenDo(x,
            idHead),
            zeroOrMoreDo(idRemained)),
        TokenType.ID);
    let doublequote = match1Char("\"");
    // [\\][\"]
    let escapeReverseSlash = (x: MatcheePair) =>
        thenDo(thenDo(toSome(x), match1Char("\\")), doublequote);
    // ([\\]["]|[^\"])*
    let stringInnerPattern = zeroOrMoreDo(
        orDo(escapeReverseSlash, notDo(match1Char("\""))));

    // str = ["]([\\]["]|[^"])*["]
    let str = bTerm((x: Maybe<MatcheePair>) =>
        thenDo(thenDo(thenDo(x, doublequote),
            stringInnerPattern), doublequote),
        TokenType.STR);

    // float = [+-]?\d+[.]\d+
    function floatPattern(x: Maybe<MatcheePair>) {
        return thenDo(thenDo(thenDo(thenDo(thenDo(thenDo(x,
            zeroOrOnceDo(plusMinus)), d),
            zeroOrMoreDo(d)),
            match1Char(".")), d),
            zeroOrMoreDo(d))
    };
    let float = bTerm(floatPattern, TokenType.FLO);

    // operators
    // +.
    let floatAdd = bTerm((x: Maybe<MatcheePair>) =>
        thenDo(thenDo(x, match1Char("+")), match1Char(".")),
        TokenType.F_ADD);
    // +.
    let floatSub = bTerm((x: Maybe<MatcheePair>) =>
        thenDo(thenDo(x, match1Char("-")), match1Char(".")),
        TokenType.F_SUB);

    // *.
    let floatMul = bTerm((x: Maybe<MatcheePair>) =>
        thenDo(thenDo(x, match1Char("*")), match1Char(".")),
        TokenType.F_MUL);

    // /.
    let floatDiv = bTerm((x: Maybe<MatcheePair>) =>
        thenDo(thenDo(x, match1Char("/")), match1Char(".")),
        TokenType.F_DIV);

    // ==
    let eq = bTerm((x: Maybe<MatcheePair>) =>
        thenDo(thenDo(x, match1Char("=")), match1Char("=")),
        TokenType.EQ);

    // >=
    let ge = bTerm((x: Maybe<MatcheePair>) =>
        thenDo(thenDo(x, match1Char(">")), match1Char("=")),
        TokenType.GE);

    // <=
    let le = bTerm((x: Maybe<MatcheePair>) =>
        thenDo(thenDo(x, match1Char("<")), match1Char("=")),
        TokenType.LE);

    // !=
    let ne = bTerm((x: Maybe<MatcheePair>) =>
        thenDo(thenDo(x, match1Char("!")), match1Char("=")),
        TokenType.NE);

    // ->
    let rightArrow = bTerm((x: Maybe<MatcheePair>) =>
        thenDo(thenDo(x, match1Char("-")), match1Char(">")),
        TokenType.R_ARROW);


    /**
     * unary operator : generating the pattern of basic unary operator
     * @param char : uniry char for the operator
     * @param token_type : the corresponding token_type
     */
    function unaryOp(char: string, token_type: TokenType) {
        return bTerm((x: Maybe<MatcheePair>) => thenDo(x, match1Char(char)),
            token_type);
    };

    let intAdd = unaryOp('+', TokenType.I_ADD);
    let intSub = unaryOp('-', TokenType.I_SUB);
    let intMul = unaryOp('*', TokenType.I_MUL);
    let intDiv = unaryOp('/', TokenType.I_DIV);
    let lParen = unaryOp('(', TokenType.L_PAREN);
    let rParen = unaryOp(')', TokenType.R_PAREN);
    let lBracket = unaryOp('[', TokenType.L_BRACK);
    let rBracket = unaryOp(']', TokenType.R_BRACK);
    let lBrace = unaryOp('{', TokenType.L_BRACE);
    let rBrace = unaryOp('}', TokenType.R_BRACE);
    let comma = unaryOp(',', TokenType.COMMA);
    let dot = unaryOp('.', TokenType.DOT);
    let colon = unaryOp(':', TokenType.COLON);
    let semicolon = unaryOp(';', TokenType.SEMI_C);
    let at = unaryOp('@', TokenType.AT);
    let hash = unaryOp('#', TokenType.HASH);
    let set = unaryOp('=', TokenType.SET);
    let greaterthan = unaryOp('>', TokenType.GT);
    let lessthan = unaryOp('<', TokenType.LE);
    let apos = unaryOp('\'', TokenType.APOS);



    let term = (token_list: Array<Token>, x: Some<MatcheePair>) => {
        var ln = 1;
        var col = 0;
        var old_x = x;
        let term_list = [
            floatAdd, floatSub, floatMul, floatDiv,
            intAdd, intSub, intMul, intDiv,
            eq, ge, le, ne, rightArrow,
            lParen, rParen, lBracket, rBracket, lBrace, rBrace,
            comma, dot, colon, semicolon, at, hash,
            set, greaterthan, lessthan, apos,
            float, newline, space,  id,  integer, str];
        let term_aux = term_list.reduce((x, y) => orDo(x, y));

        var new_x: Maybe<MatcheePair> = thenDo(old_x, term_aux);
        while (new_x._tag != "None") {
            if (new_x.value.matched_type != TokenType.NL) {
                col += new_x.value.matched.length;
                token_list.push({
                    text: new_x.value.matched,
                    type: new_x.value.matched_type,
                    ln: ln,
                    col: col
                });

            }
            else {
                col = 0;
                ln += 1;

                token_list.push({
                    text: new_x.value.matched,
                    type: new_x.value.matched_type,
                    ln: ln,
                    col: col
                });

            }


            old_x = toSome({
                matched: "",
                remained: new_x.value.remained
            });
            new_x = thenDo(old_x, term_aux);
        }

        if (old_x.value.remained.length) {
            console.log(token_list);
            throw new Error("the code can't be tokenized is near Ln. " + ln + ", Col." + col
                + ", starting with " + old_x.value.remained.substring(0, 10));
        }

        return token_list;
    }

    return term([], input_matchee_pair);

    // TODO: id, string, space, basic operator, 3 marks: @, {, }.

}


