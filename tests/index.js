"use strict";
let assert = require("assert");
let tokenize = require("../src/tokenize");
let a = tokenize.match1Char("我");
let example1 = a({ matched: "", remained: "我的" });
assert(example1._tag == "Some");
assert(example1.value.matched == "我");
assert(example1.value.remained == "的");
let example2 = a({ matched: "", remained: "妳的" });
assert(example2._tag == "None");
let thenDo = tokenize.thenDo;
let orDo = tokenize.orDo;
let zeroOrMoreDo = tokenize.zeroOrMoreDo;
let notDo = tokenize.notDo;
let matchAny = tokenize.matchAny;
// composed part x
let compPart1 = tokenize.match1Char("我");
let compPart2 = tokenize.match1Char("的");
let doThenTestee1 = { _tag: "Some", value: { matched: "", remained: "我的貓" } };
let doTestRes1 = thenDo(thenDo(doThenTestee1, compPart1), compPart2);
assert(doTestRes1._tag == "Some");
assert(doTestRes1.value.matched == "我的");
assert(doTestRes1.value.remained == "貓");
let doThenTestee2 = { _tag: "Some", value: { matched: "", remained: "我們" } };
let doTestRes2 = thenDo(thenDo(doThenTestee2, compPart1), compPart2);
assert(doTestRes2._tag == "None");
let doThenTestee3 = { _tag: "Some", value: { matched: "", remained: "我的貓" } };
let doTestRes3 = thenDo(thenDo(doThenTestee3, orDo(compPart1, compPart2)), compPart2);
assert(doTestRes3._tag == "Some");
assert(doTestRes3.value.matched == "我的");
assert(doTestRes3.value.remained == "貓");
let doThenTestee4 = { _tag: "Some", value: { matched: "", remained: "的的貓" } };
let doTestRes4 = thenDo(thenDo(doThenTestee4, orDo(compPart1, compPart2)), compPart2);
assert(doTestRes4._tag == "Some");
assert(doTestRes4.value.matched == "的的");
assert(doTestRes4.value.remained == "貓");
let doThenTestee5 = { _tag: "Some", value: { matched: "", remained: "的貓" } };
let doTestRes5 = thenDo(thenDo(doThenTestee5, zeroOrMoreDo(compPart1)), compPart2);
assert(doTestRes5._tag == "Some");
assert(doTestRes5.value.matched == "的");
assert(doTestRes5.value.remained == "貓");
let doThenTestee6 = { _tag: "Some", value: { matched: "", remained: "我我我的貓" } };
let doTestRes6 = thenDo(thenDo(doThenTestee6, zeroOrMoreDo(compPart1)), compPart2);
assert(doTestRes6._tag == "Some");
assert(doTestRes6.value.matched == "我我我的");
assert(doTestRes6.value.remained == "貓");
let doThenTestee7 = { _tag: "Some", value: { matched: "", remained: "我的" } };
let doTestRes7 = thenDo(thenDo(doThenTestee7, notDo(compPart1)), compPart2);
assert(doTestRes7._tag == "None");
let doThenTestee8 = { _tag: "Some", value: { matched: "", remained: "妳的" } };
let doTestRes8 = thenDo(thenDo(doThenTestee8, notDo(compPart1)), compPart2);
assert(doTestRes8._tag == "Some");
assert(doTestRes8.value.matched == "妳的");
let doThenTestee9 = { _tag: "Some", value: { matched: "", remained: "妳的" } };
let doTestRes9 = thenDo(doThenTestee9, matchAny);
assert(doTestRes9._tag == "Some");
assert(doTestRes9.value.matched == "妳");
assert(doTestRes9.value.remained == "的");
tokenize.tokenize("+123");
tokenize.tokenize("123");
tokenize.tokenize("-123");
tokenize.tokenize(" 123");
try {
    tokenize.tokenize("c123");
}
catch (error) {
    console.log(error);
}
tokenize.tokenize("  ");
tokenize.tokenize(" ");
tokenize.tokenize(" \t");
tokenize.tokenize(" \t123");
try {
    tokenize.tokenize(" \t123aaa456");
}
catch (error) {
    console.log(error);
}
tokenize.tokenize(" \t123\n456");
tokenize.tokenize("\"\"");
tokenize.tokenize("\"123\"");
tokenize.tokenize("\"1\\\"23\"");
tokenize.tokenize("\"1\\\"23\"  abc123");
tokenize.tokenize("+0.012");
tokenize.tokenize("0.0");
tokenize.tokenize("-222.0");
tokenize.tokenize("1+1 ==2; 3+8 foo(12)");
console.log(tokenize.tokenize("2+2"));
// harfbuzz test
let harfbuzz = require("../src/harfbuzz.js");
harfbuzz.harfbuzzTest("123.abc");
// pdf test
let pdfManipulate = require("../src/pdfManipulate.js");
pdfManipulate.pdfGenerate("123.abc");
console.log("/tmp/test.pdf產出ah");
