var fs = require('fs');

export type Some<T> = { _tag: "Some"; value: T };
export type None = {_tag: "None"};


/**
 * wrap a x in a `Some(T)`
 * @param x : variable to be wrapped.
 * @returns wrapped `x`.
 */
function toSome<T>(x: T): Some<T>{
    return  { _tag: "Some", value: x};  
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
        if (m.remained.length == 0){
            return { _tag: "None" };
        }
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
 * 
 * @param m : the `MatcheePair` to be consumed.
 * @returns if the length of `m.remained` >= 1; consumes the matchee by 1 char and wraps it in `Some`,
 * otherwise, returns `None`.
 */
export function matchAny(m : MatcheePair) : Maybe<MatcheePair>{
    if (m.remained.length >= 1){
        return {_tag: "Some", value :{
            matched : m.matched + m.remained[0],
            remained : m.remained.substring(1)}};
    }else{
        return {_tag: "None"};
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
export function matchRange(l : string, u : string) : (m: MatcheePair) => Maybe<MatcheePair> {
    let lCodepoint = charToCodepoint(l);
    let uCodepoint = charToCodepoint(u);
    if (l > u){
        throw new Error("Error: the codepoint of `"+l+"` is not smaller than `"+u+"`)");
    }
    return (m : MatcheePair)=>{
        if (m.remained.length < 1){
            return {_tag : "None"};
        }
        const charToBeMatched = m.remained[0];
        const codePointToBeMatched = charToCodepoint(charToBeMatched);
        if (codePointToBeMatched >= lCodepoint && codePointToBeMatched <= uCodepoint){
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
 * @param input: the wrapped input. 
 * @param f: the function to be applied.
 * 
 * @returns:the applied wrapped result `MatcheePair`.
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

/**
 * @description "or", like the regex `( f1 | f2 )` . 
 * It returns a function `f` of which the argument is`x`.
 * if `f1(x)` is None, then `f` returns `f2(x)`. Otherwise, 
 * `F` returns `f1(x)`.
 * @param f1 : 1st function to be compared
 * @param f2 : 2nd function to be compared
 * @returns:the combined function
 */
export function orDo<T>(f1 : Function, f2: Function) : (x : T ) => Maybe<T>{
    return (x) => {
        let f1x : Maybe<T> = (f1(x));
        {
            if (f1x._tag == "None"){
                return f2(x);
            }
            else{
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
export function zeroOrMoreDo<T>(f : Function): (x : T) => Maybe<T>{
    return (x)=>{
        var wrapped_old_x : Maybe<T> = {_tag: "Some", value : x};
        var wrapped_new_x : Maybe<T> = wrapped_old_x;

        while (wrapped_new_x._tag != "None"){
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
export function notDo<T>(f : Function): (x : T) => Maybe<T>{
    return (x)=>{
        let wrapped_x : Maybe<T> = {
            _tag : "Some",
            value : x
        };
        let f_x = thenDo(wrapped_x, f);
        
        if (f_x._tag != "None"){
            return {_tag:"None"};
        }else{
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
export function zeroOrOnceDo<T>(f : Function): (x : T) => Maybe<T>{
    return (x)=>{
        var wrapped_old_x : Maybe<T> = {_tag: "Some", value : x};
        var wrapped_new_x = thenDo(wrapped_old_x, f);

        if (wrapped_new_x._tag != "None"){
            return wrapped_new_x;
        }else{
        return wrapped_old_x;
        }
    };
}


export function tokenize(input : string){
    var input_matchee_pair : Maybe<MatcheePair> = toSome(
        {matched:"",
        remained: input});

    // integer = ([+]|[-])?\d\d*
    let integer = (x : MatcheePair) => 
    { let wrapped_x = toSome(x);
        let plusMinus = orDo(match1Char('+'), match1Char('-')); // ([+]|[-])
        let d = matchRange('0','9'); // \d
        return thenDo(thenDo(thenDo(wrapped_x, 
            zeroOrOnceDo(plusMinus)),d),
            zeroOrMoreDo(d));
    }
    console.log(input+", result: ");
    console.log(thenDo(input_matchee_pair, integer));
    // TODO: id, string, space, basic operator, 3 marks: @, {, }.

}

tokenize("+123");
tokenize("123");
tokenize("-123");
tokenize(" 123");
tokenize("c123");
