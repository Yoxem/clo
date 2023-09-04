var assert = require("assert");
var cloMain = require("../src");
var a = cloMain.match1Char("我");
var example1 = a({ matched: "", remained: "我的" });
assert(example1._tag == "Some");
assert(example1.value.matched == "我");
assert(example1.value.remained == "的");
var example2 = a({ matched: "", remained: "妳的" });
assert(example2._tag == "None");
var thenDo = cloMain.thenDo;
// composed part x
var compPart1 = cloMain.match1Char("我");
var compPart2 = cloMain.match1Char("的");
var doThenTestee1 = { _tag: "Some", value: { matched: "", remained: "我的貓" } };
var doTestRes1 = thenDo(thenDo(doThenTestee1, compPart1), compPart2);
assert(doTestRes1._tag == "Some");
assert(doTestRes1.value.matched == "我的");
assert(doTestRes1.value.remained == "貓");
var doThenTestee2 = { _tag: "Some", value: { matched: "", remained: "我們" } };
var doTestRes2 = thenDo(thenDo(doThenTestee2, compPart1), compPart2);
assert(doTestRes2._tag == "None");
// harfbuzz test
var harfbuzz = require("../src/harfbuzz.js");
harfbuzz.harfbuzzTest("123.abc");
// pdf test
var pdfManipulate = require("../src/pdfManipulate.js");
pdfManipulate.pdfGenerate("123.abc");
console.log("/tmp/test.pdf產出ah");
