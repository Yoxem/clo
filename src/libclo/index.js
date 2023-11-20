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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Clo = exports.calculateTextWidthHeightAux = exports.calculateTextWidthHeight = exports.hyphenTkTree = exports.filterEmptyString = exports.spacesToBreakpoint = exports.hyphenForClo = exports.splitCJKV = exports.twoReturnsToNewline = exports.ptToPx = exports.cjkvRegexPattern = exports.cjkvBlocksInRegex = exports.defaultFrameStyle = exports.defaultTextStyle = exports.A4_IN_PX = exports.Direction = void 0;
const canva_1 = require("../canva");
const fontkit = __importStar(require("fontkit"));
const breakLines = __importStar(require("./breakLines"));
const PDFDocument = require('pdfkit');
const fs = __importStar(require("fs"));
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
            // push a breakpoint command to the result `tkTree`
            result.push(['bp', [["hglue", "0.1"], item], ""]);
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
function calculateTextWidthHeight(element, style) {
    return __awaiter(this, void 0, void 0, function* () {
        var res = [];
        var styleCache = {};
        var fontCache = {};
        for (var i = 0; i < element.length; i++) {
            let item = yield calculateTextWidthHeightAux(element[i], style, styleCache, fontCache);
            styleCache = item[1];
            fontCache = item[2];
            res.push(item[0]);
        }
        res = res.flat();
        return res;
    });
}
exports.calculateTextWidthHeight = calculateTextWidthHeight;
/**
 * calculate the text width and Height with a given `TextStyle`
 * @param preprocessed
 * @param defaultFontStyle
 */
function calculateTextWidthHeightAux(element, style, styleCache, fontCache) {
    return __awaiter(this, void 0, void 0, function* () {
        var result = [];
        var font;
        if (style === styleCache) {
            font = fontCache;
        }
        else {
            let fontPair = (0, canva_1.fontStyleTofont)(style);
            if (fontPair.path.match(/\.ttc$/)) {
                font = yield fontkit.openSync(fontPair.path, fontPair.psName);
                styleCache = style;
                fontCache = font;
            }
            else {
                font = yield fontkit.openSync(fontPair.path);
                styleCache = style;
                fontCache = font;
            }
        }
        if (!Array.isArray(element)) {
            var run = font.layout(element, undefined, undefined, undefined, "ltr");
            for (var j = 0; j < run.glyphs.length; j++) {
                let runGlyphsItem = run.glyphs[j];
                let item = {
                    x: null,
                    y: null,
                    textStyle: style,
                    direction: Direction.LTR,
                    width: (runGlyphsItem.advanceWidth) * (style.size) / 1000 * 0.75,
                    height: (runGlyphsItem.bbox.maxY - runGlyphsItem.bbox.minY) * (style.size) / 1000 * 0.75,
                    content: element[j],
                    minX: runGlyphsItem.bbox.minX,
                    maxX: runGlyphsItem.bbox.maxX,
                    minY: runGlyphsItem.bbox.minY,
                    maxY: runGlyphsItem.bbox.maxY
                };
                result.push(item);
            }
            return [result, styleCache, fontCache];
        }
        else if (element[0] == "bp") {
            var beforeNewLine = (yield calculateTextWidthHeightAux(element[1], style, styleCache, fontCache))[0];
            if (Array.isArray(beforeNewLine)) {
                beforeNewLine = beforeNewLine.flat();
            }
            let afterNewLine = (yield calculateTextWidthHeightAux(element[2], style, styleCache, fontCache))[0];
            if (Array.isArray(afterNewLine)) {
                afterNewLine = afterNewLine.flat();
            }
            let breakPointNode = {
                original: beforeNewLine,
                newLined: afterNewLine,
            };
            return [breakPointNode, styleCache, fontCache];
        }
        else if (element[0] == "hglue" && !Array.isArray(element[1])) {
            let hGlue = { stretchFactor: parseFloat(element[1]) };
            return [hGlue, styleCache, fontCache];
        }
        else {
            return [yield calculateTextWidthHeight(element, style), styleCache, fontCache];
        }
    });
}
exports.calculateTextWidthHeightAux = calculateTextWidthHeightAux;
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
        return __awaiter(this, void 0, void 0, function* () {
            // preprocessed
            var preprocessed = this.mainStream;
            for (var i = 0; i < this.preprocessors.length; i++) {
                preprocessed = this.preprocessors[i](preprocessed, this);
            }
            // generate the width and height of the stream
            let defaultFontStyle = this.attrs.defaultFrameStyle.textStyle;
            let a = yield calculateTextWidthHeight(preprocessed, defaultFontStyle);
            let breakLineAlgorithms = new breakLines.BreakLineAlgorithm();
            let segmentedNodes = breakLineAlgorithms.segmentedNodes(a, this.attrs.defaultFrameStyle.width);
            let segmentedNodesToBox = this.segmentedNodesToFrameBox(segmentedNodes, this.attrs.defaultFrameStyle);
            let boxesFixed = this.fixenBoxesPosition(segmentedNodesToBox);
            // generate pdf
            const doc = new PDFDocument({ size: 'A4' });
            doc.pipe(fs.createWriteStream('output.pdf'));
            this.grid(doc);
            let styleCache = {};
            let fontPairCache = { path: "", psName: "" };
            yield this.putText(doc, boxesFixed, styleCache, fontPairCache);
            // putChar
            doc.end();
        });
    }
    putText(doc, box, styleCache, fontPairCache) {
        return __awaiter(this, void 0, void 0, function* () {
            var fontPair;
            if (box.textStyle !== null) {
                if (box.textStyle == styleCache) {
                    fontPair = fontPairCache;
                }
                else {
                    fontPair = (0, canva_1.fontStyleTofont)(box.textStyle);
                    styleCache = box.textStyle;
                    fontPairCache = fontPair;
                    if (fontPair.path.match(/\.ttc$/g)) {
                        doc
                            .font(fontPair.path, fontPair.psName)
                            .fontSize(box.textStyle.size * 0.75);
                    }
                    else {
                        doc
                            .font(fontPair.path)
                            .fontSize(box.textStyle.size * 0.75); // 0.75 must added!  
                    }
                }
                if (box.textStyle.color !== undefined) {
                    doc.fill(box.textStyle.color);
                }
                if (Array.isArray(box.content)) {
                    for (var k = 0; k < box.content.length; k++) {
                        let tmp = yield this.putText(doc, box.content[k], styleCache, fontPairCache);
                        doc = tmp[0];
                        styleCache = tmp[1];
                        fontPairCache = tmp[2];
                    }
                }
                else if (box.content !== null) {
                    yield doc.text(box.content, (box.x !== null ? box.x : undefined), (box.y !== null ? box.y : undefined));
                }
            }
            return [doc, styleCache, fontPairCache];
        });
    }
    ;
    grid(doc) {
        for (var j = 0; j < exports.A4_IN_PX.width; j += 5) {
            if (j % 50 == 0) {
                doc.save().fill('#000000')
                    .fontSize(8).text(j.toString(), j * 0.75, 50);
                doc
                    .save()
                    .lineWidth(0.4)
                    .strokeColor("#dddddd")
                    .moveTo(j * 0.75, 0)
                    .lineTo(j * 0.75, 1000)
                    .stroke();
            }
            doc
                .save()
                .lineWidth(0.2)
                .strokeColor("#dddddd")
                .moveTo(j * 0.75, 0)
                .lineTo(j * 0.75, 1000)
                .stroke();
        }
        for (var i = 0; i < 1050; i += 5) {
            if (i % 50 == 0) {
                doc.save()
                    .fontSize(8).text(i.toString(), 50, i * 0.75);
                doc
                    .save()
                    .lineWidth(0.4)
                    .strokeColor("#bbbbbb")
                    .moveTo(0, i * 0.75)
                    .lineTo(1000, i * 0.75)
                    .stroke();
            }
            doc
                .save()
                .lineWidth(0.2)
                .strokeColor("#bbbbbb")
                .moveTo(0, i * 0.75)
                .lineTo(1000, i * 0.75)
                .stroke();
        }
        doc
            .save()
            .moveTo(0, 200)
            .lineTo(1000, 200)
            .fill('#FF3300');
    }
    /**
     * make all the nest boxes's position fixed
     * @param box the main boxes
     * @returns the fixed boxes
     */
    fixenBoxesPosition(box) {
        var currX = (box.x !== null ? box.x : 0); // current x
        var currY = (box.y !== null ? box.y : 0); // current y
        if (Array.isArray(box.content)) {
            for (var i = 0; i < box.content.length; i++) {
                if (box.direction == Direction.LTR) {
                    box.content[i].x = currX;
                    box.content[i].y = currY;
                    let elementWidth = box.content[i].width;
                    if (elementWidth !== null) {
                        currX += elementWidth;
                    }
                }
                if (box.direction == Direction.TTB) {
                    box.content[i].x = currX;
                    box.content[i].y = currY;
                    let elementHeight = box.content[i].height;
                    if (elementHeight !== null) {
                        currY += elementHeight;
                    }
                }
                box.content[i] = this.fixenBoxesPosition(box.content[i]);
            }
        }
        return box;
    }
    /**
     * input a `segmentedNodes` and a layed `frame`, return a big `Box` that nodes is put in.
     * @param segmentedNodes the segmentnodes to be input
     * @param frame the frame to be layed out.
     * @returns the big `Box`.
     */
    segmentedNodesToFrameBox(segmentedNodes, frame) {
        let baseLineskip = frame.baseLineskip;
        let boxArrayEmpty = [];
        let bigBox = {
            x: (frame.x !== null ? frame.x * 0.75 : null),
            y: (frame.y !== null ? frame.y * 0.75 : null),
            textStyle: frame.textStyle,
            direction: frame.direction,
            width: frame.width,
            height: frame.height,
            content: boxArrayEmpty,
        };
        var bigBoxContent = boxArrayEmpty;
        let segmentedNodesFixed = segmentedNodes.map((x) => this.removeBreakPoints(x).flat());
        let segmentedNodeUnglue = segmentedNodesFixed.map((x) => this.removeGlue(x, frame).flat());
        for (var i = 0; i < segmentedNodeUnglue.length; i++) {
            var currentLineSkip = baseLineskip;
            var glyphMaxHeight = this.getGlyphMaxHeight(segmentedNodesFixed[i]);
            if (currentLineSkip === null || glyphMaxHeight > currentLineSkip) {
                currentLineSkip = glyphMaxHeight;
            }
            var currentLineBox = {
                x: null,
                y: null,
                textStyle: exports.defaultTextStyle,
                direction: frame.directionInsideLine,
                width: frame.width,
                height: currentLineSkip,
                content: segmentedNodeUnglue[i],
            };
            bigBoxContent.push(currentLineBox);
        }
        bigBox.content = bigBoxContent;
        return bigBox;
    }
    /**
     * get the max height of the glyph`[a, b, c]`
     * @param nodeLine the node line [a, b, c, ...]
     * @returns
     */
    getGlyphMaxHeight(nodeLine) {
        let segmentedNodeLineHeight = nodeLine.map((x) => { if ("height" in x && x.height > 0.0) {
            return x.height;
        }
        else {
            return 0.0;
        } });
        let maxHeight = Math.max(...segmentedNodeLineHeight);
        return maxHeight;
    }
    removeGlue(nodeLine, frame) {
        let breakLineAlgorithms = new breakLines.BreakLineAlgorithm();
        let glueRemoved = nodeLine.filter((x) => !breakLineAlgorithms.isHGlue(x));
        let onlyGlue = nodeLine.filter((x) => breakLineAlgorithms.isHGlue(x));
        let sumStretchFactor = onlyGlue.map((x) => { if ("stretchFactor" in x) {
            return x.stretchFactor;
        }
        else {
            return 0;
        } })
            .reduce((acc, cur) => acc + cur, 0);
        let glueRemovedWidth = glueRemoved.map((x) => { if ("width" in x) {
            return x.width;
        }
        else {
            return 0;
        } })
            .reduce((acc, cur) => acc + cur, 0);
        let offset = frame.width * 0.75 - glueRemovedWidth;
        var res = [];
        for (var i = 0; i < nodeLine.length; i++) {
            var ele = nodeLine[i];
            if (breakLineAlgorithms.isHGlue(ele)) {
                let tmp = {
                    x: null,
                    y: null,
                    textStyle: null,
                    direction: frame.directionInsideLine,
                    //width : 0, // ragged
                    width: ele.stretchFactor / sumStretchFactor * offset,
                    height: 0,
                    content: "",
                };
                res.push(tmp);
            }
            else {
                res.push(ele);
            }
        }
        return res;
    }
    /**
     * remove breakpoints
     * @param boxitemline boxitem in a line with a breakpoint
     * @returns boxitemline with break points removed
     */
    removeBreakPoints(boxitemline) {
        var res = [];
        let breakLineAlgorithms = new breakLines.BreakLineAlgorithm();
        for (var i = 0; i < boxitemline.length; i++) {
            let ele = boxitemline[i];
            if (breakLineAlgorithms.isBreakPoint(ele)) {
                if (i == boxitemline.length - 1) {
                    res.push(ele.newLined);
                }
                else {
                    res.push(ele.original);
                }
            }
            else {
                res.push(ele);
            }
        }
        return res;
    }
}
exports.Clo = Clo;
/*
export let a = new Clo();
export default a; */ 
