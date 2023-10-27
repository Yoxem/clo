"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.a = exports.Clo = void 0;
const canva_1 = require("../canva");
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
})(Direction || (Direction = {}));
/**
 * DEFAULT CONST PART
 */
const A4_IN_PX = { "width": 793.7,
    "height": 1122.5 };
const defaultTextStyle = {
    family: "FreeSans",
    size: 12,
    textWeight: canva_1.TextWeight.REGULAR,
    textStyle: canva_1.TextStyle.ITALIC,
};
const defaultFrameStyle = {
    directionInsideLine: Direction.LTR,
    direction: Direction.TTB,
    baseLineskip: ptToPx(15),
    fontStyle: defaultTextStyle,
    x: A4_IN_PX.width * 0.10,
    y: A4_IN_PX.height * 0.10,
    width: A4_IN_PX.width * 0.80,
    height: A4_IN_PX.height * 0.80,
    content: null,
};
const cjkvBlocksInRegex = ["Hani"];
const cjkvRegexPattern = new RegExp("((?:" +
    cjkvBlocksInRegex.map((x) => "\\p{Script_Extensions=" + x + "}").join("|") + ")+)", "gu");
/**
 * FUNCTION PART
 */
/**
 * convert from ptToPx
 * @param pt pt size value
 * @returns the corresponding px value
 */
function ptToPx(pt) {
    return pt * 4 / 3.0;
}
/**
 *  REGISTER PART
 */
/**
 * split CJKV and non-CJKV
 *
 * @param arr : input tkTree
 * @returns
 */
function splitCJKV(arr) {
    console.log(arr);
    var result = [];
    for (let i = 0; i < arr.length; i++) {
        var item = arr[i];
        if (!Array.isArray(item)) {
            console.log(item.split(cjkvRegexPattern));
            result = result.concat(item.split(cjkvRegexPattern));
        }
        else {
            result.push(item);
        }
    }
    console.log(result);
    return result;
}
class Clo {
    constructor() {
        this.preprocessors = [];
        this.mainStream = [];
        this.attributes = { "page": A4_IN_PX };
        // register the precessor functions
        this.preprocessorRegister(splitCJKV);
    }
    setAttr(attr, val) {
        Object.assign(this.attributes, attr, val);
    }
    getAttr(attr) {
        if (Object.keys(this.attributes).length === 0) {
            return this.attributes[attr];
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
        var prepro = this.mainStream;
        for (var i = 0; i < this.preprocessors.length; i++) {
            prepro = this.preprocessors[i](prepro);
        }
        // TODO
        console.log("test" + prepro);
    }
}
exports.Clo = Clo;
exports.a = new Clo();
exports.default = exports.a;
