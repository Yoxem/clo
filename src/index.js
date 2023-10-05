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
    TokenKind[TokenKind["Paren"] = 5] = "Paren";
    TokenKind[TokenKind["SpaceNL"] = 6] = "SpaceNL";
    TokenKind[TokenKind["Id"] = 7] = "Id";
    TokenKind[TokenKind["Str"] = 8] = "Str";
})(TokenKind || (TokenKind = {}));
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
const inputTxt = `import ast;
---
122`;
const PROG = p.rule();
const UNIT = p.rule();
const IMPORTS = p.rule();
const SEMICOLON = p.rule();
let doubleMinus = { type: 'Punctuator', value: '--' };
let doubleMinus2 = p.str('--');
const TERM = p.rule();
function applyUnit(value) {
    return value.text;
}
function applySemiColon(value) {
    return value.text;
}
function applyParts(first, second) {
    return ["%clo", first, second[1]];
}
PROG.setPattern(p.lrec_sc(IMPORTS, p.seq(p.str('---'), UNIT), applyParts));
function applyImports(input) {
    let importTail = input[1].map(x => x.text);
    return ["import"].concat(importTail);
}
;
IMPORTS.setPattern(p.apply(p.seq(p.str('import'), p.rep_sc(p.tok(TokenKind.Id)), SEMICOLON), applyImports));
SEMICOLON.setPattern(p.apply(p.tok(TokenKind.Semicolon), applySemiColon));
UNIT.setPattern(p.apply(p.tok(TokenKind.Number), applyUnit));
let tree = p.expectSingleResult(p.expectEOF(PROG.parse(lexer.parse(inputTxt))));
console.log("RESULT=" + tkTreeToSExp(tree));
