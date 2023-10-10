"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tkTreeToSExp = void 0;
var fs = require('fs');
const util = __importStar(require("util"));
const p = __importStar(require("typescript-parsec"));
/**
 *
 * # REPRESENTATION
 */
/**
 * convert a `tkTree` AST to S-expr string
 * @param t the `tkTree`
 * @returns S-expr String
 */
function tkTreeToSExp(t) {
    var str = "";
    if (Array.isArray(t)) {
        let strArray = t.map((x) => tkTreeToSExp(x));
        str = "(" + strArray.join(" ") + ")";
    }
    else {
        if (t === undefined) {
            str = "%undefined";
        }
        else {
            str = t;
        }
    }
    return str;
}
exports.tkTreeToSExp = tkTreeToSExp;
/**inspect the inner of the representation. */
let repr = (x) => { return util.inspect(x, { depth: null }); };
var TokenKind;
(function (TokenKind) {
    TokenKind[TokenKind["Seperator"] = 0] = "Seperator";
    TokenKind[TokenKind["Semicolon"] = 1] = "Semicolon";
    TokenKind[TokenKind["Number"] = 2] = "Number";
    TokenKind[TokenKind["Op"] = 3] = "Op";
    TokenKind[TokenKind["ExprMark"] = 4] = "ExprMark";
    TokenKind[TokenKind["ExcapeAt"] = 5] = "ExcapeAt";
    TokenKind[TokenKind["Paren"] = 6] = "Paren";
    TokenKind[TokenKind["SpaceNL"] = 7] = "SpaceNL";
    TokenKind[TokenKind["Id"] = 8] = "Id";
    TokenKind[TokenKind["Str"] = 9] = "Str";
    TokenKind[TokenKind["Comment"] = 10] = "Comment";
})(TokenKind || (TokenKind = {}));
/**
 * Parsing
 */
const lexer = p.buildLexer([
    [true, /^\d+(\.\d+)?/g, TokenKind.Number],
    [true, /^\\\@/g, TokenKind.ExcapeAt],
    [true, /^\/\*([^/]|\/[^*])*\*\//g, TokenKind.Comment],
    [true, /^\;/g, TokenKind.Semicolon],
    [true, /^[-][-][-]/g, TokenKind.Seperator],
    [true, /^[\+\-\*\/\&\|\!\^\<\>\~\=\?]+/g, TokenKind.Op],
    [true, /^\@/g, TokenKind.ExprMark],
    [true, /^[()\[\]{}]/g, TokenKind.Paren],
    [true, /^["]([\"]|[\\].)*["]/g, TokenKind.Str],
    [true, /^[']([\']|[\\].)*[']/g, TokenKind.Str],
    [true, /^[()\[\]{}]/g, TokenKind.Paren],
    [true, /^[^\/\\\@\s\n\t\r;]+/g, TokenKind.Id],
    [true, /^(\s|\n|\r|\t)+/g, TokenKind.SpaceNL],
]);
/**
 *
 * # TEST
 */
const inputTxt = `import a as b; /*bacourt*/
/* ba choir 
ipsum lorem*/

import you as john;
---

臺中市\\\@

公園
@1+2==3;

console.log("122");@

山頂
`;
const PROG = p.rule();
const SEGMENT = p.rule();
const IMPORT = p.rule();
const IMPORTS = p.rule();
const SEMICOLON = p.rule();
const EXCAPE_AT = p.rule();
const NOT_AT_TEXT = p.rule();
const CONTENT = p.rule();
let doubleMinus = { type: 'Punctuator', value: '--' };
let doubleMinus2 = p.str('--');
const TERM = p.rule();
function applySegment(input) {
    let unpackedInnerExprs = input[1].map((x) => { return x.text; });
    return ["%exprs", unpackedInnerExprs];
}
function applySemiColon(value) {
    return value.text;
}
function applyParts(first, second) {
    return ["%clo", first, second[1]];
}
function applyComment(value) {
    return [value.text];
}
function applyImport(input) {
    let importTail = input[1].map(x => x.text);
    return ["import"].concat(importTail);
}
;
/*
function applyImportComment(input: [Token<TokenKind>,Token<TokenKind>[],
    tkTree, Token<TokenKind.Comment>]) : tkTree{
    let importTail = input[1].map(x=>x.text);
    let comment = [input[3].text];
    return ["import"].concat(importTail).concat(comment);
};*/
function applyImports(input) {
    let resultBody = [input[0]].concat(input[1]);
    let resultWrapper = ["%import", resultBody];
    return resultWrapper;
}
;
function applyNotAtText(value) {
    if (value.text == "\\\@") {
        return '@';
    }
    else {
        return value.text;
    }
}
;
function applyText(input) {
    return ["%text", input];
}
;
function applyContent(input) {
    return ["%content", input];
}
;
function applySpaceNL(value) {
    return value.text;
}
/**
 * IMPORTEE:  Number, Op, Paren, Id, Str, Comment,
 */
let IMPORTEE = p.alt(p.tok(TokenKind.Number), p.tok(TokenKind.Op), p.tok(TokenKind.Paren), p.tok(TokenKind.Id), p.tok(TokenKind.Str), p.tok(TokenKind.SpaceNL), p.tok(TokenKind.Comment));
let NOT_AT = p.alt(p.tok(TokenKind.Seperator), p.tok(TokenKind.Semicolon), p.tok(TokenKind.Number), p.tok(TokenKind.ExcapeAt), p.tok(TokenKind.Op), p.tok(TokenKind.Paren), p.tok(TokenKind.SpaceNL), p.tok(TokenKind.Id), p.tok(TokenKind.Str), p.tok(TokenKind.Comment));
/**
 * PROG : IMPORTS '---' CONTENT;
 */
PROG.setPattern(p.lrec_sc(IMPORTS, p.seq(p.str('---'), CONTENT), applyParts));
/**
 * NOT_AT_TEXT : NOT_AT
 */
NOT_AT_TEXT.setPattern(p.apply(NOT_AT, applyNotAtText));
IMPORTS.setPattern(p.apply(p.seq(IMPORT, p.rep(IMPORT)), applyImports));
/**
 * IMPORT :
 * 'import' IMPORTEE* SEMICOLON |
 * COMMENT |
 */
IMPORT.setPattern(p.alt(p.apply(p.seq(p.str('import'), p.rep_sc(IMPORTEE), SEMICOLON), applyImport), p.apply(p.tok(TokenKind.Comment), applyComment), p.apply(p.tok(TokenKind.SpaceNL), applySpaceNL)));
/**
 * SEMICOLON : ';';
 */
SEMICOLON.setPattern(p.apply(p.tok(TokenKind.Semicolon), applySemiColon));
/**
 * SEGMENT : '@' NOT_AT* '@' |
 * (NOT_AT_TEXT | EXCAPE_AT)*
 */
SEGMENT.setPattern(p.alt(p.apply(p.rep_sc(NOT_AT_TEXT), applyText), p.apply(p.seq(p.str('@'), p.rep(NOT_AT), p.str('@')), applySegment)));
/**
 * CONTENT : SEGMENT*
 */
CONTENT.setPattern(p.apply(p.rep(SEGMENT), applyContent));
let tree = p.expectSingleResult(p.expectEOF(PROG.parse(lexer.parse(inputTxt))));
console.log("RESULT=" + tkTreeToSExp(tree));
