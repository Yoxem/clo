var fs = require('fs');
import jsTokens from "js-tokens";
import * as util from 'util';

/**inspect the inner of the representation. */
let repr = (x : any)=>{return util.inspect(x, {depth: null})};

/**
 * like `m ==> f` in ocaml
 * @param m matchee wrapped
 * @param f matching function
 * @returns wrapped result
 */
function thenDo(m : tk.Maybe<TokenMatcheePair>, f : Function){
    if (m._tag == "None"){
        return m;
    }else{
        var a : tk.Maybe<TokenMatcheePair> = f(m.value);
        if (a._tag == "Some"){
            a.value.ast = concat(m.value.ast, a.value.ast);
        }

        return a;
    }
}

const tokens = Array.from(jsTokens(`
import foo from\t 'bar';
import * as util  from 'util';


花非花，霧\\{非霧 。{{foo();}}下
一句`));


console.log("RESULT="+repr(tokens));

