var fs = require('fs');

type Some<T> = { _tag: "Some"; value: T };
type None = {_tag: "None"};

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
 * @param matched : string have been matched
 * @param remained : string will be tested whether it'll be matched.
 */
export type MatcheePair = {matched : string; remained : string};

/**
 * @description
 * it returns a function which test if the first char of the `remained` part of
 *  the argument of the function is `c`, if it's true, update the `MatchedPair` wrapped
 * in `Some`. Otherwise, it returns `None`.
 *  * @param c : the char to be test.
 * @returns the updated `MatchedPair` wrapped in `Some(x)` or `None`.
 */
export function match1Char(c : string) : (m: MatcheePair) => Maybe<MatcheePair> {
    return (m : MatcheePair)=>{
        const charToBeMatched = m.remained[0];
        if (charToBeMatched === c){
            return {_tag: "Some", value :{
                    matched : m.matched + charToBeMatched,
                    remained : m.remained.substring(1)}};
        }
        else{
            return {_tag: "None"};
        }
    }
};

/**
 * convert the one-char string to codepoint.
 * @param s : the string to code point.
 * @returns if `s.length > 1` return error; otherwise, return the codepoint of `s`.
 */
export function charToCodepoint(s : string): number{
    if (s.length > 1){
        throw new Error("Error: the length of input string for "+s+ "is "+s.length+`,
        however, it should be 1.`);
    }else{
        return s.charCodeAt(0);
    }
}

/**
 *  @description thendo(input, f, ...) like
 * a ==> f
 */
export function thenDo<T>(input : Maybe<T>, f : Function) : Maybe<T>{
    if (input._tag == "None"){
        return input;
    }
    else{
        let inner = input.value;
        return f(inner);
    }
}
