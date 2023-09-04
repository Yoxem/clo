let assert = require("assert");
let cloMain = require("../src");

let a = cloMain.match1Char("我");

let example1 = a({matched: "", remained: "我的"});
assert(example1._tag == "Some");
assert(example1.value.matched == "我");
assert(example1.value.remained == "的");

let example2 = a({matched: "", remained: "妳的"});
assert(example2._tag == "None");



let thenDo = cloMain.thenDo;
// composed part x
let compPart1 = cloMain.match1Char("我");
let compPart2 = cloMain.match1Char("的");

let doThenTestee1 = {_tag : "Some",value : {matched: "", remained: "我的貓"}};
let doTestRes1 = thenDo(thenDo(doThenTestee1, compPart1), compPart2);
assert(doTestRes1._tag == "Some");
assert(doTestRes1.value.matched == "我的");
assert(doTestRes1.value.remained == "貓");


let doThenTestee2 = {_tag : "Some",value : {matched: "", remained: "我們"}};
let doTestRes2 = thenDo(thenDo(doThenTestee2, compPart1), compPart2);
assert(doTestRes2._tag == "None");


// harfbuzz test
let harfbuzz = require("../src/harfbuzz.js");
harfbuzz.harfbuzzTest("123.abc");

// pdf test
let pdfManipulate = require("../src/pdfManipulate.js"); 
pdfManipulate.pdfGenerate("123.abc");
console.log("/tmp/test.pdf產出ah");

