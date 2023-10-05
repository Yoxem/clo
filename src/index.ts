var fs = require('fs');
import jsTokens from "js-tokens";
import * as util from 'util';
import * as p from 'typescript-parsec';
import { Token } from 'typescript-parsec';
/**
 * 
 * # REPRESENTATION
 */
/**
 * convert a `tkTree` AST to S-expr string
 * @param t the `tkTree`
 * @returns S-expr String
 */
export function tkTreeToSExp(t: tkTree): string{
    var str = "";

    if (Array.isArray(t)){
        let strArray = t.map((x)=>tkTreeToSExp(x));
        str = "(" + strArray.join(" ") + ")";
    }else{
        if (t=== undefined){
            str = "%undefined"
        }else{
            str = t;
        }
    }

    return str;
}

/**inspect the inner of the representation. */
let repr = (x : any)=>{return util.inspect(x, {depth: null})};
/**
 * 
 * # TYPES
 */


type tkTree = string | tkTree[];

enum TokenKind {
    Seperator,
    Semicolon,
    Number,
    Op,
    ExprMark,
    Paren,
    SpaceNL,
    Id,
    Str,
}

/**
 * Parsing
 */
const lexer = p.buildLexer([
    [true, /^\d+(\.\d+)?/g, TokenKind.Number],
    [true, /^\;/g, TokenKind.Semicolon],
    [true, /^[-][-][-]/g, TokenKind.Seperator],
    [true, /^[\+\-\*\/\&\|\!\^\<\>\~\=\?]+/g, TokenKind.Op],
    [true, /^\@+/g, TokenKind.ExprMark],
    [true, /^[()\[\]{}]/g, TokenKind.Paren],
    [true, /^["]([\"]|[\\].)*["]/g, TokenKind.Str],
    [true, /^[']([\']|[\\].)*[']/g, TokenKind.Str],
    [true, /^[()\[\]{}]/g, TokenKind.Paren],
    [true, /^[^\s\n\t\r;]+/g, TokenKind.Id],
    [false, /^(\s|\n|\r|\t)+/g, TokenKind.SpaceNL]
]);

/**
 * 
 * # TEST
 */
const inputTxt=
`import ast;
---
122`;


const PROG = p.rule<TokenKind, tkTree>();
const UNIT = p.rule<TokenKind, tkTree>();
const IMPORTS = p.rule<TokenKind, tkTree>();
const SEMICOLON = p.rule<TokenKind, tkTree>();


let doubleMinus = { type: 'Punctuator', value: '--' };
let doubleMinus2 = p.str('--');
const TERM = p.rule<TokenKind, tkTree>();

function applyUnit(value: Token<TokenKind.Number>): tkTree{
    return value.text;
}

function applySemiColon(value: Token<TokenKind.Semicolon>): tkTree{
    return value.text;
}

function applyParts(first: tkTree,
                    second: [Token<TokenKind>, tkTree]):tkTree {
    return ["%clo", first , second[1]];
}




function applyImports(input: [Token<TokenKind>,Token<TokenKind>[], tkTree]):tkTree{
    let importTail = input[1].map(x=>x.text);
    return ["import"].concat(importTail);
};

/**
 * PROG : IMPORTS '---' UNIT;
 */
PROG.setPattern(
    p.lrec_sc(IMPORTS, p.seq(p.str('---'), UNIT), applyParts)

)

/**
 * PROG : 'import' Id* SEMICOLON;
 */
IMPORTS.setPattern(
    p.apply(p.seq(p.str('import'), p.rep_sc(p.tok(TokenKind.Id)), SEMICOLON) , applyImports)
);

/**
 * SEMICOLON : ';';
 */
SEMICOLON.setPattern(
    p.apply(p.tok(TokenKind.Semicolon), applySemiColon)
);

/**
 * UNIT : Number;
 */
UNIT.setPattern(
    p.apply(p.tok(TokenKind.Number), applyUnit)
);

let tree = p.expectSingleResult(p.expectEOF(PROG.parse(lexer.parse(inputTxt))));



console.log("RESULT="+tkTreeToSExp(tree));
