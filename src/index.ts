var fs = require('fs');

import * as tk from './tokenize.js';



let b : Array<tk.Token> = tk.tokenize("2+2");

export interface TokenMatcheePair {
    matched: tk.Token[]
    remained: tk.Token[]
}

/**
 * @description
 * it returns a function which test if the first char of the `remained` part of
 *  the argument of the function is `c`, if it's true, update the `MatchedPair` wrapped
 * in `Some`. Otherwise, it returns `None`.
 *  * @param t : the char to be test.
 * @returns the updated `MatchedPair` wrapped in `Some(x)` or `None`.
 */
export function match1token(t: tk.Token): (m: TokenMatcheePair) => tk.Maybe<TokenMatcheePair> {
    return (m: TokenMatcheePair) => {
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
    }
};



let c = tk.toSome(b);
console.log(thenDo(c,match1token(tk.tokenize("+")[0])));