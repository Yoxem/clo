/**
 * parser.ts - parser and js generator of clo.
 */
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

type tkTree = string | tkTree[];

enum TokenKind {
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
const lexer = p.buildLexer([
    [true, /^\d+(\.\d+)?/g, TokenKind.Number],
    [true, /^[\\][\\]/g, TokenKind.Op],
    [true, /^\\\@/g, TokenKind.ExcapeAt],
    [true, /^\/\*([^/]|\/[^*])*\*\//g, TokenKind.Comment],
    [true, /^\;/g, TokenKind.Semicolon],
    [true, /^[-][-][-]/g, TokenKind.Seperator],
    [true, /^[\+\-\*\/\&\|\!\^\<\>\~\=\?]+/g, TokenKind.Op],
    [true, /^\@/g, TokenKind.ExprMark],
    [true, /^[()\[\]{}]/g, TokenKind.Paren],
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



const PROG = p.rule<TokenKind, tkTree>();
const SEGMENT = p.rule<TokenKind, tkTree>();
const IMPORT = p.rule<TokenKind, tkTree>();
const IMPORTS = p.rule<TokenKind, tkTree>();
const SEMICOLON = p.rule<TokenKind, tkTree>();
const NOT_AT_TEXT = p.rule<TokenKind, tkTree>();
const CONTENT = p.rule<TokenKind, tkTree>();


function applySegment(input: [Token<TokenKind>, Token<TokenKind>[],
        Token<TokenKind>]): tkTree[]{
    let unpackedInnerExprs = input[1].map((x)=>{return x.text});
    return ["%exprs", unpackedInnerExprs];
}

function applySemiColon(value: Token<TokenKind.Semicolon>): tkTree{
    return value.text;
}

function applyParts(first: tkTree,
                    second: [Token<TokenKind>, tkTree]):tkTree {
    return ["%clo", first , second[1]];
}


function applyComment(value: Token<TokenKind.Comment>): tkTree[]{
    return [value.text];
}


function applyImport(input: [Token<TokenKind>,Token<TokenKind>[], tkTree]) : tkTree{
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

function applyImports(input : [tkTree, tkTree[]]): tkTree{
    let resultBody = [input[0]].concat(input[1]);
    let resultWrapper = ["%import", resultBody];
    return resultWrapper;
};




function applyNotAtText(value : Token<TokenKind>): tkTree{
    if (value.text == "\\\@"){
        return '@';
    }
    else{return value.text;}
};

function applyText (input : tkTree): tkTree[]{
    return ["%text", input];
};

function applyContent(input : tkTree[]): tkTree[]{
    return ["%content", input];
};

function applySpaceNL(value : Token<TokenKind.SpaceNL>): tkTree{
    return value.text;
}

/**
 * IMPORTEE:  Number, Op, Paren, Id, Str, Comment,
 */
let IMPORTEE = p.alt(p.tok(TokenKind.Number),
    p.tok(TokenKind.Op),
    p.tok(TokenKind.Paren),
    p.tok(TokenKind.Id),
    p.tok(TokenKind.Str),
    p.tok(TokenKind.SpaceNL),
    p.tok(TokenKind.Comment));

let NOT_AT = p.alt(p.tok(TokenKind.Seperator),
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
 * PROG : IMPORTS '---' CONTENT;
 */
PROG.setPattern(
    p.lrec_sc(IMPORTS, p.seq(p.str('---'), CONTENT), applyParts)

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
let outputHead = `
/* clo, a typesetting engine, generated JS file*/
/* CLO:  beginning of head*/
import * as clo from "clo";

cl = clo.initClo();
/* CLO:  end of head*/\n`

/**
 * the middle part of the output JS code : between import part and content part
 */
let outputMiddle =`
/* CLO:  beginning of middle part*/
cl.mainText = /* CLO: end of middle part*/
`
let outputEnd =`
/* CLO: beginning of end part*/
cl.generatePdf();
/*CLO : end of end part*/
`

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
                return treeToJS(tail);
            }
            let tailStrings = tail.map((x)=>treeToJS(x));
            return "(" + tailStrings.join(').concat(') + ");";
        }else{
            return tail;
        }
    }
    if (head == "%text"){
        let textContents = tree[1];
        if (Array.isArray(textContents)){
            let decoratedArray = textContents
                                .flatMap(x=>String(x))
                                .map(x=>x.replace("\`","\\\`"));

            return "[`" + decoratedArray.join("\`, \`") + "`]";
        }else{
            let decorated = textContents.replace("\`","\\\`");

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
return p.expectSingleResult(
    p.expectEOF(PROG.parse(lexer.parse(inputText))));
}