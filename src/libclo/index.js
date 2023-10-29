"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Clo = exports.calculateTextWidthHeight = exports.hyphenTkTree = exports.filterEmptyString = exports.spacesToBreakpoint = exports.hyphenForClo = exports.splitCJKV = exports.twoReturnsToNewline = exports.ptToPx = exports.cjkvRegexPattern = exports.cjkvBlocksInRegex = exports.defaultFrameStyle = exports.defaultTextStyle = exports.A4_IN_PX = exports.Direction = void 0;
const canva_1 = require("../canva");
const jsdom_1 = require("jsdom");
/**
 * TYPES
 */
/**
 * text direction
 * LTR - left to right
 * TTB - top to bottom
 * etc.
 */
var Direction;
(function (Direction) {
    Direction[Direction["LTR"] = 0] = "LTR";
    Direction[Direction["RTL"] = 1] = "RTL";
    Direction[Direction["TTB"] = 2] = "TTB";
    Direction[Direction["BTT"] = 3] = "BTT";
})(Direction || (exports.Direction = Direction = {}));
/**
 * DEFAULT CONST PART
 */
exports.A4_IN_PX = { "width": 793.7,
    "height": 1122.5 };
exports.defaultTextStyle = {
    family: "FreeSerif",
    size: ptToPx(12),
    textWeight: canva_1.TextWeight.REGULAR,
    fontStyle: canva_1.FontStyle.ITALIC,
};
exports.defaultFrameStyle = {
    directionInsideLine: Direction.LTR,
    direction: Direction.TTB,
    baseLineskip: ptToPx(15),
    textStyle: exports.defaultTextStyle,
    x: exports.A4_IN_PX.width * 0.10,
    y: exports.A4_IN_PX.height * 0.10,
    width: exports.A4_IN_PX.width * 0.80,
    height: exports.A4_IN_PX.height * 0.80,
    content: null,
};
/**
 * definition for cjk scripts
 *  - Hani : Han Character
 *  - Hang : Hangul
 *  - Bopo : Bopomofo
 *  - Kana : Katakana
 *  - Hira : Hiragana
*/
exports.cjkvBlocksInRegex = ["Hani", "Hang", "Bopo", "Kana", "Hira"];
exports.cjkvRegexPattern = new RegExp("((?:" +
    exports.cjkvBlocksInRegex.map((x) => "\\p{Script_Extensions=" + x + "}").join("|") + ")+)", "gu");
/**
 * FUNCTION PART
 */
/**
 * convert from ptToPx
 * @param pt pt size value
 * @returns the corresponding px value
 */
function ptToPx(pt) {
    return pt * 4.0 / 3.0;
}
exports.ptToPx = ptToPx;
/**
 *  REGISTER PART
 */
/**
 * convert '\n\n' to newline command ["nl"]
 * @param arr the input `tkTree`
 * @param clo the `Clo` object
 * @returns the input tktree
 */
function twoReturnsToNewline(arr, clo) {
    var middle = [];
    for (let i = 0; i < arr.length; i++) {
        var item = arr[i];
        if (!Array.isArray(item)) {
            middle = middle.concat(item.split(/(\n\n)/g));
        }
        else {
            middle.push(item);
        }
    }
    var result = [];
    for (let j = 0; j < middle.length; j++) {
        var item = middle[j];
        if (!Array.isArray(item) && item == "\n\n") {
            result.push(["nl"]); // push a newline command to the result `tkTree`
        }
        else {
            result.push(middle[j]);
        }
    }
    return result;
}
exports.twoReturnsToNewline = twoReturnsToNewline;
/**
 * split CJKV and non-CJKV
 *
 * @param arr : input tkTree
 * @returns a splitted tkTree (by CJK and NonCJK)
 * - Examples:
 *  ```
 *  [`many臺中daylight`] => [`many`, `臺中`, `dahylight`]
 *  ```
 */
function splitCJKV(arr, clo) {
    var result = [];
    for (let i = 0; i < arr.length; i++) {
        var item = arr[i];
        if (!Array.isArray(item)) {
            result = result.concat(item.split(exports.cjkvRegexPattern));
        }
        else {
            result.push(item);
        }
    }
    return result;
}
exports.splitCJKV = splitCJKV;
/**
 * hyphenation for a clo document
 * @param arr the array for a `tkTree`
 * @param clo the Clo object
 */
function hyphenForClo(arr, clo) {
    let hyphenLanguage = clo.attrs["hyphenLanguage"];
    let res = hyphenTkTree(arr, hyphenLanguage);
    return res;
}
exports.hyphenForClo = hyphenForClo;
/**
 * convert spaces to Breakpoint
 * \s+ => ["bp" [\s+] ""]
 * @param arr the tkTree input text stream
 * @param clo the Clo object
 * @returns the converted object
 */
function spacesToBreakpoint(arr, clo) {
    let spacePattern = /^([ \t]+)$/g;
    var result = [];
    for (let i = 0; i < arr.length; i++) {
        var item = arr[i];
        if (!Array.isArray(item) && item.match(spacePattern)) {
            result.push(['bp', item, ""]); // push a newline command to the result `tkTree`
        }
        else {
            result.push(item);
        }
    }
    return result;
}
exports.spacesToBreakpoint = spacesToBreakpoint;
/**
 * remove all the `` (empty string) in the arr
 * @param arr the tkTree to be filtered
 * @param clo the Clo file
 */
function filterEmptyString(arr, clo) {
    if (Array.isArray(arr)) {
        arr.filter((x) => { return x != ``; });
    }
    return arr;
}
exports.filterEmptyString = filterEmptyString;
/**
 * OTHER FUNCTIONS
 */
/**
 * hyphenate for a tkTree
 *  - hyphenation => ["bp", "", "-"]
 * @param arr the tkTree array
 * @param lang ISO 639 code for the language
 */
function hyphenTkTree(arr, lang) {
    // import corresponding hyphen language data and function
    let hyphen = require("hyphen/" + lang);
    let result = [];
    for (let i = 0; i < arr.length; i++) {
        let element = arr[i];
        let splitter = "分"; // a CJKV
        if (!Array.isArray(element)) {
            let hyphenatedElement = hyphen.hyphenateSync(element, { hyphenChar: splitter });
            let hyphenatedSplitted = hyphenatedElement.split(splitter);
            var newSplitted = [];
            for (var j = 0; j < hyphenatedSplitted.length - 1; j++) {
                newSplitted.push(hyphenatedSplitted[j]);
                // "bp" for breakpoint
                newSplitted.push(["bp", "", "-"]); //insert a breakable point (bp) mark
            }
            newSplitted.push(hyphenatedSplitted[hyphenatedSplitted.length - 1]);
            result = result.concat(newSplitted);
        }
        else {
            result.push(element);
        }
    }
    return result;
}
exports.hyphenTkTree = hyphenTkTree;
/**
 * calculate the text width and Height with a given `TextStyle`
 * @param preprocessed
 * @param defaultFontStyle
 */
function calculateTextWidthHeight(preprocessed, style) {
    var dom = new jsdom_1.JSDOM(`<!DOCTYPE html><html><head></head>
    <body><canvas id="canvas"></canvas></body></html>`);
    try {
        let canvas = dom.window.document.getElementById("canvas");
        console.log(canvas);
        /*if (!(canvas instanceof HTMLElement)){
            throw new Error('the <canvas="canvas"> in the jsdom\'s DOM is not found.');
            
        }*/
        let context = canvas.getContext("2d");
        console.log(context);
        if (context == null) {
            throw new Error('`canvas.getContext("2d");` can\'t be executed.');
        }
        context.font = `normal normal 10pt ${style.family}`;
        console.log(context.font);
        let txt = `Hello john`;
        console.log(txt);
        let measured = context.measureText(txt);
        let width = measured.width;
        let height = measured.actualBoundingBoxAscent;
        let depth = measured.actualBoundingBoxDescent;
        console.log("width: " + width);
        console.log("height: " + height);
        console.log("depth: " + depth);
    }
    catch (error) {
        console.log("Exception " + error);
    }
}
exports.calculateTextWidthHeight = calculateTextWidthHeight;
/**
 * whole document-representing class
 */
class Clo {
    constructor() {
        this.preprocessors = [];
        this.mainStream = [];
        this.attrs = {
            "page": exports.A4_IN_PX,
            "defaultFrameStyle": exports.defaultFrameStyle,
            "hyphenLanguage": 'en' // hyphenated in the language (in ISO 639)
        };
        // register the precessor functions
        this.preprocessorRegister(splitCJKV);
        this.preprocessorRegister(hyphenForClo);
        this.preprocessorRegister(twoReturnsToNewline);
        this.preprocessorRegister(spacesToBreakpoint);
        this.preprocessorRegister(filterEmptyString);
    }
    setAttr(attr, val) {
        Object.assign(this.attrs, attr, val);
    }
    getAttr(attr) {
        if (Object.keys(this.attrs).length === 0) {
            return this.attrs[attr];
        }
        else {
            return undefined;
        }
    }
    /**
     * register a function of preprocessor
     * @param f a function
     */
    preprocessorRegister(f) {
        this.preprocessors.push(f);
    }
    generatePdf() {
        // preprocessed
        var preprocessed = this.mainStream;
        for (var i = 0; i < this.preprocessors.length; i++) {
            preprocessed = this.preprocessors[i](preprocessed, this);
        }
        // generate the width and height of the stream
        let defaultFontStyle = this.attrs["defaultFrameStyle"].textStyle;
        calculateTextWidthHeight(preprocessed, defaultFontStyle);
        // TODO
        console.log(preprocessed);
    }
}
exports.Clo = Clo;
/*
export let a = new Clo();
export default a; */ 
