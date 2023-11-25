/**
 * parser.ts - parser and js generator of clo.
 */
import { text } from 'pdfkit';
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
 *
export function tkTreeToSExp(t: tkTree): string{
    var str = "";

    if (Array.isArray(t)){
        let strArray = t.map((x)=>tkTreeToSExp(x));
        str = "(" + strArray.join("◎") + ")";
    }else{
        if (t=== undefined){
            str = "%undefined"
        }else{
            str = t;
        }
    }

    return str;
}*/

export type tkTree = string | tkTree[];

export enum TokenKind {
    Seperator, // ---
    Semicolon, // ;
    Number,
    Op,
    ExprMark, // @
    ExcapeAt, // \@
    Paren,
    SpaceNL, // \s\t\n\r
    Id,
    Str,
    Comment, // /* ooo */
}

/**
 * Parsing
 */
export const lexer = p.buildLexer([
    [true, /^\d+(\.\d+)?/g, TokenKind.Number],
    [true, /^[\\][\\]/g, TokenKind.Op],
    [true, /^\\\@/g, TokenKind.ExcapeAt],
    [true, /^\/\*([^/]|\/[^*])*\*\//g, TokenKind.Comment],
    [true, /^\;/g, TokenKind.Semicolon],
    [true, /^[-][-][-]/g, TokenKind.Seperator],
    [true, /^[\+\-\*\/\&\|\!\^\<\>\~\=\?]+/g, TokenKind.Op],
    [true, /^\@/g, TokenKind.ExprMark],
    [true, /^[()\[\]{}]/g, TokenKind.Paren],
    [true, /^[\`]([^\`]|[\\].)*[\`]/g, TokenKind.Str],
    [true, /^[\"]([^\"]|[\\].)*[\"]/g, TokenKind.Str],
    [true, /^[\']([^\']|[\\].)*[\']/g, TokenKind.Str],
    [true, /^[()\[\]{}]/g, TokenKind.Paren],
    [true, /^[^\/\\\@\s\n\t\r;]+/g, TokenKind.Id],
    [true, /^(\s|\n|\r|\t)+/g, TokenKind.SpaceNL],

]);

/**
 * 
 * # TEST
 */



export const PROG = p.rule<TokenKind, tkTree>();
export const SEGMENT = p.rule<TokenKind, tkTree>();
export const IMPORT = p.rule<TokenKind, tkTree>();
export const IMPORTS = p.rule<TokenKind, tkTree>();
export const SEMICOLON = p.rule<TokenKind, tkTree>();
export const NOT_AT_TEXT = p.rule<TokenKind, tkTree>();
export const CONTENT = p.rule<TokenKind, tkTree>();


export function applySegment(input: [Token<TokenKind>, Token<TokenKind>[],
        Token<TokenKind>]): tkTree[]{
    let unpackedInnerExprs = input[1].map((x)=>{return x.text});
    return ["%exprs", unpackedInnerExprs];
}

export function applySemiColon(value: Token<TokenKind.Semicolon>): tkTree{
    return value.text;
}

export function applyParts(first: tkTree, 
                    second: [Token<TokenKind>, Token<TokenKind>, tkTree]):tkTree {
    return ["%clo", first , second[2]];
}

export function applyPartsWithoutImport(
        parsed: [Token<TokenKind>, Token<TokenKind>, tkTree]):tkTree {
return ["%clo", "" , parsed[2]];
}


export function applyComment(value: Token<TokenKind.Comment>): tkTree[]{
    return [value.text];
}


export function applyImport(input: [Token<TokenKind>,Token<TokenKind>[], tkTree]) : tkTree{
    let importTail = input[1].map(x=>x.text);
    return ["import"].concat(importTail);
};


/*
function applyImportComment(input: [Token<TokenKind>,Token<TokenKind>[],
    tkTree, Token<TokenKind.Comment>]) : tkTree{
    let importTail = input[1].map(x=>x.text);
    let comment = [input[3].text];
    return ["import"].concat(importTail).concat(comment);
};*/

export function applyImports(input : [tkTree, tkTree[]]): tkTree{
    let resultBody = [input[0]].concat(input[1]);
    let resultWrapper = ["%import", resultBody];
    return resultWrapper;
};




export function applyNotAtText(value : Token<TokenKind>): tkTree{
    if (value.text == "\\\@"){
        return '@';
    }
    else{return value.text;}
};

export function applyText (input : tkTree): tkTree[]{

    return ["%text", input];
};



export function applyContent(input : tkTree[]): tkTree[]{
    return ["%content", input];
};

export function applySpaceNL(value : Token<TokenKind.SpaceNL>): tkTree{
    return value.text;
}

/**
 * IMPORTEE:  Number, Op, Paren, Id, Str, Comment,
 */
export let IMPORTEE = p.alt(p.tok(TokenKind.Number),
    p.tok(TokenKind.Op),
    p.tok(TokenKind.Paren),
    p.tok(TokenKind.Id),
    p.tok(TokenKind.Str),
    p.tok(TokenKind.SpaceNL),
    p.tok(TokenKind.Comment));

export let NOT_AT = p.alt(p.tok(TokenKind.Seperator),
    p.tok(TokenKind.Semicolon),
    p.tok(TokenKind.Number),
    p.tok(TokenKind.ExcapeAt),
    p.tok(TokenKind.Op),
    p.tok(TokenKind.Paren),
    p.tok(TokenKind.SpaceNL),
    p.tok(TokenKind.Id),
    p.tok(TokenKind.Str),
    p.tok(TokenKind.Comment),
    );

/**
 * PROG : IMPORTS '---' NEWLINE CONTENT | '---' NEWLINE CONTNENT
 */
PROG.setPattern(
    p.alt(
        p.lrec_sc(IMPORTS, p.seq(p.str('---'), p.str("\n"), CONTENT), applyParts),
        p.apply(p.seq(p.str('---'), p.str("\n"), CONTENT), applyPartsWithoutImport))

)

/**
 * NOT_AT_TEXT : NOT_AT
 */
NOT_AT_TEXT.setPattern(
    p.apply(NOT_AT, applyNotAtText)
);

IMPORTS.setPattern(
    p.apply( p.seq(IMPORT, p.rep(IMPORT)), applyImports)
);

/**
 * IMPORT :
 * 'import' IMPORTEE* SEMICOLON |
 * COMMENT |
 */
IMPORT.setPattern(
    p.alt(
        p.apply(p.seq(p.str('import'), p.rep_sc(IMPORTEE), SEMICOLON),
            applyImport),
        p.apply(p.tok(TokenKind.Comment), applyComment),
        p.apply(p.tok(TokenKind.SpaceNL), applySpaceNL)

    )
);

/**
 * SEMICOLON : ';';
 */
SEMICOLON.setPattern(
    p.apply(p.tok(TokenKind.Semicolon), applySemiColon)
);



/**
 * SEGMENT : '@' NOT_AT* '@' |
 * (NOT_AT_TEXT | EXCAPE_AT)*
 */
SEGMENT.setPattern(
    p.alt(
        p.apply(p.rep_sc(NOT_AT_TEXT), applyText),
        p.apply(p.seq(p.str('@'), p.rep(NOT_AT), p.str('@')), applySegment),
    )
);

/**
 * CONTENT : SEGMENT*
 */
CONTENT.setPattern(
    p.apply(p.rep(SEGMENT), applyContent)
);



/**
 * the head part of the output JS code : before import
 */
export let outputHead = `
/* clo, a typesetting engine, generated JS file*/
/* CLO:  beginning of head*/

let cloLib = require("./src/libclo/index.js");
let clo = new cloLib.Clo();

/* CLO:  end of head*/\n`

/**
 * the middle part of the output JS code : between import part and content part
 */
export let outputMiddle =`
/* CLO:  beginning of middle part*/
clo.mainStream = /* CLO: end of middle part*/
`

/**
 * the end part of the output JS code : after content part
 */
export let outputEnd =`
/* CLO: beginning of end part*/
clo.generatePdf();
/*CLO : end of end part*/
`

export function splitText(input : tkTree): tkTree{
    var ret;
    if (!Array.isArray(input)){
        ret = input.split(/(\s+)/);
    }else{
        ret = input.map((x)=>splitText(x));
    }
    return ret;
}

/**
 * Convert `tree` (ASTTree; `tkTree`) to JS Code.
 */
export function treeToJS(tree : tkTree): string{

    let head = tree[0];
    if (head == "%clo"){
        let totalResult = outputHead + treeToJS(tree[1]) +
            outputMiddle + treeToJS(tree[2]) + outputEnd;
        return totalResult;
    }
    if (head == "%import"){
        let imports = tree[1];
        if (Array.isArray(imports)){
            let importsText = imports.map(
                (x)=>{
                    if (Array.isArray(x)){
                        return x.join('') + ';';
                    }
                    else{
                        return x;
                    }
                });
            let importTextCombined = importsText.join('');
            return importTextCombined;
        }
        else{
            return imports; 
        }
    }
    if (head == "%content"){
        let tail = tree[1];
        if (Array.isArray(tail)){
            if (tail.length == 1){
                return tail.map((x)=>treeToJS(x)).join("').concat('")+ ";";
            }
            let tailStrings = tail.map((x)=>treeToJS(x));
            return "(" + tailStrings.join(').concat(') + ");";
        }else{
            return tail;
        }
    }
    if (head == "%text"){
        var textContents = splitText(tree[1]);
        if (Array.isArray(textContents)){
            textContents = textContents.flat().filter((x)=>{return x !== ""});
            let decoratedArray = textContents
                                .flatMap(x=>String(x))
                                .map(x=>x.replace("\'",  "\\\'"))
                                .map(x=>x.replace("\`","\\\`"));
            
            return "[`" + decoratedArray.join("\`, \`") + "`]";
        }else{
            let decorated = textContents.replace("\`","\\\`").replace("\'", "\\\'");

            return "[`" + decorated + "`]";
        }
    }

    if (head == "%exprs"){
        let content = tree[1];
        if (Array.isArray(content)){
            let flattenContent = content.flat();
            return flattenContent.join('');
        }
        else{
            return content;
        }

    }
    else{
        if (Array.isArray(tree)){
            return tree.join('');
        }else{
            return tree;
        }
    }
}


/**
 * `inputText` to `tkTree` (ASTTree) 
 */
export function inputTextToTree(inputText : string){
    // force convert Windows newline to Linux newline
    inputText = inputText.replace("\r\n", "\n");

    return p.expectSingleResult(
        p.expectEOF(PROG.parse(lexer.parse(inputText))));
}