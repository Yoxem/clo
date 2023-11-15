import { isBoxedPrimitive, isKeyObject, isStringObject } from "util/types";
import {tkTree} from "../parser";
import {FontStyle, TextStyle, TextWeight, fontStyleTofont} from "../canva";
import { JSDOM } from "jsdom";
import * as fontkit from "fontkit";
import * as util from "node:util";
import * as breakLines from "./breakLines";
import "pdfkit";
import PDFKitPage from "pdfkit/js/page";
import { ColorTypes, PDFDocument, rgb } from "pdf-lib";
import * as fs from "fs";

/**
 * TYPES
 */

/**
 * text direction
 * LTR - left to right
 * TTB - top to bottom
 * etc.
 */
export enum Direction{
    LTR,
    RTL,
    TTB,
    BTT,
}

/**
 * Horizonal glue.
 * - stretchFactor : the stretch factor in float
 */
export interface HGlue{
    stretchFactor: number
}

export interface BreakPoint{
    original : BoxesItem,
    newLined : BoxesItem  
}

export type BoxesItem = HGlue | Box | BreakPoint | BoxesItem[] ;

/**
 * frame box is a subclass of box
 * - directionInsideLine : text direction inside a line
 * - baselineskip : the distance between baselines in px
 */
export interface FrameBox extends Box{
    directionInsideLine : Direction,
    baseLineskip : number | null,
}

export interface CharBox extends Box{
    minX: number,
    maxX: number,
    minY: number,
    maxY: number,

}

/**
 * a basic Box
 * - x :
 * - y : 
 * - textStyle :
 * - direction :
 * - width : x_advance
 * - content :
 */
export interface Box{
    x : number | null,
    y : number | null,
    textStyle : TextStyle | null,
    direction : Direction,
    width : number,
    height : number,
    content : string | Box[] | null,
}


/**
 * DEFAULT CONST PART
 */
export const A4_IN_PX = {"width" : 793.7,
                  "height" : 1122.5};

export const defaultTextStyle : TextStyle = {
        family : "FreeSerif",
        size : ptToPx(12),
        textWeight : TextWeight.REGULAR,
        fontStyle : FontStyle.ITALIC,
}

export const defaultFrameStyle : FrameBox = {
    directionInsideLine : Direction.LTR,
    direction : Direction.TTB,
    baseLineskip : ptToPx(15),
    textStyle : defaultTextStyle,
    x : A4_IN_PX.width * 0.10,
    y : A4_IN_PX.height * 0.10,
    width : A4_IN_PX.width * 0.80,
    height : A4_IN_PX.height * 0.80,
    content : null,
};

/**
 * definition for cjk scripts
 *  - Hani : Han Character
 *  - Hang : Hangul
 *  - Bopo : Bopomofo
 *  - Kana : Katakana
 *  - Hira : Hiragana
*/
export const cjkvBlocksInRegex = ["Hani", "Hang", "Bopo", "Kana", "Hira"];

export const cjkvRegexPattern = new RegExp("((?:" +
    cjkvBlocksInRegex.map((x)=>"\\p{Script_Extensions="+x+"}").join("|") + ")+)", "gu");
/**
 * FUNCTION PART
 */
/**
 * convert from ptToPx
 * @param pt pt size value
 * @returns the corresponding px value
 */
export function ptToPx(pt : number) : number{
    return pt * 4.0 / 3.0;
}



/**
 *  REGISTER PART
 */

/**
 * convert '\n\n' to newline command ["nl"]
 * @param arr the input `tkTree`
 * @param clo the `Clo` object
 * @returns the input tktree
 */
export function twoReturnsToNewline(arr : tkTree, clo : Clo): tkTree{
    var middle : tkTree = [];

    for (let i = 0; i < arr.length; i++) {
        var item = arr[i];
        if (!Array.isArray(item)){
            middle = middle.concat(item.split(/(\n\n)/g));
        }
        else{
            middle.push(item);
        }
    }

    var result : tkTree = [];
    for (let j = 0; j < middle.length; j++){
        var item = middle[j];
        if (!Array.isArray(item) && item == "\n\n"){
            result.push(["nl"]); // push a newline command to the result `tkTree`
        }
        else{
            result.push(middle[j]);
        }
    }

    return result;
}

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
export function splitCJKV(arr : tkTree, clo : Clo): tkTree{
    var result : tkTree = [];
    for (let i = 0; i < arr.length; i++) {
        var item = arr[i];
        if (!Array.isArray(item)){
            result = result.concat(item.split(cjkvRegexPattern));
        }
        else{
            result.push(item);
        }
    }

    return result;
}

/**
 * hyphenation for a clo document
 * @param arr the array for a `tkTree`
 * @param clo the Clo object
 */
export function hyphenForClo(arr : tkTree, clo : Clo): tkTree{
    let hyphenLanguage : string = clo.attrs["hyphenLanguage"];
    let res =  hyphenTkTree(arr, hyphenLanguage);
    return res;

}

/**
 * convert spaces to Breakpoint
 * \s+ => ["bp" [\s+] ""]
 * @param arr the tkTree input text stream
 * @param clo the Clo object 
 * @returns the converted object
 */
export function spacesToBreakpoint(arr : tkTree, clo : Clo) : tkTree{
    let spacePattern = /^([ \t]+)$/g;
    var result : tkTree = [];
    for (let i = 0; i < arr.length; i++){
        var item = arr[i];
        if (!Array.isArray(item) && item.match(spacePattern)){
            // push a breakpoint command to the result `tkTree`
            result.push([ 'bp', [["hglue", "0.1"], item] , "" ]); 
        }
        else{
            result.push(item);
        }
    }

    return result;
}

/**
 * remove all the `` (empty string) in the arr
 * @param arr the tkTree to be filtered
 * @param clo the Clo file 
 */
export function filterEmptyString(arr : tkTree, clo : Clo) : tkTree{
    if (Array.isArray(arr)){
        arr.filter((x)=>{return x != ``;});
    }

    return arr;
}


/**
 * OTHER FUNCTIONS
 */

/**
 * hyphenate for a tkTree
 *  - hyphenation => ["bp", "", "-"]
 * @param arr the tkTree array
 * @param lang ISO 639 code for the language
 */
export function hyphenTkTree(arr : tkTree, lang: string) : tkTree{
    // import corresponding hyphen language data and function
    let hyphen = require("hyphen/"+lang);

    let result :tkTree[] = [];
    for (let i = 0; i < arr.length; i++) {
        let element = arr[i];
        let splitter = "分"; // a CJKV
        if (!Array.isArray(element)){
            let hyphenatedElement : string = hyphen.hyphenateSync(element, {hyphenChar :splitter});
            let hyphenatedSplitted : tkTree = hyphenatedElement.split(splitter);
            var newSplitted : tkTree = [];
            for (var j=0; j<hyphenatedSplitted.length-1;j++){
                newSplitted.push(hyphenatedSplitted[j]);
                // "bp" for breakpoint
                newSplitted.push(["bp", "", "-"]); //insert a breakable point (bp) mark
            }
            newSplitted.push(hyphenatedSplitted[hyphenatedSplitted.length-1]);

            result = result.concat(newSplitted);

        }else{
            result.push(element);
        }
        
    }

    return result;
}

/**
 * calculate the text width and Height with a given `TextStyle` 
 * @param preprocessed 
 * @param defaultFontStyle 
 */
export async function calculateTextWidthHeight(element : tkTree, style : TextStyle): Promise<BoxesItem[]> {
    var res = [];
    
    for (var i=0; i<element.length; i++){
        res.push(await calculateTextWidthHeightAux(element[i], style));
    }

    res = res.flat();

    return res;
}


/**
 * calculate the text width and Height with a given `TextStyle` 
 * @param preprocessed 
 * @param defaultFontStyle 
 */
export async function calculateTextWidthHeightAux(element : tkTree, style : TextStyle): Promise<BoxesItem> {
    var result : BoxesItem = [];
    


    let fontPair = fontStyleTofont(style);
    if (fontPair.path.match(/\.ttc$/)){
        var font = await fontkit.openSync(fontPair.path, fontPair.psName);
    }
    else{
        var font = await fontkit.openSync(fontPair.path);
    }
    if (!Array.isArray(element)){
        var run = font.layout(element, undefined, undefined, undefined, "ltr");

        

        for (var j=0;j<run.glyphs.length;j++){
            let runGlyphsItem = run.glyphs[j];


            let item : CharBox = {
                x : null,
                y : null,
                textStyle : style,
                direction : Direction.LTR,
                width : (runGlyphsItem.advanceWidth)*(style.size)/1000,
                height : (runGlyphsItem.bbox.maxY - runGlyphsItem.bbox.minY)*(style.size)/1000,
                content : element[j],
                minX : runGlyphsItem.bbox.minX,
                maxX : runGlyphsItem.bbox.maxX,
                minY : runGlyphsItem.bbox.minY,
                maxY : runGlyphsItem.bbox.maxY
            }

            result.push(item);

        }
    return result;


        

    }else if(element[0] == "bp"){

        var beforeNewLine = await calculateTextWidthHeightAux(element[1], style);
        if (Array.isArray(beforeNewLine)){
            beforeNewLine = beforeNewLine.flat();
        }

        let afterNewLine = await calculateTextWidthHeightAux(element[2], style);
        if (Array.isArray(afterNewLine)){
            afterNewLine = afterNewLine.flat();
        }

        let breakPointNode : BreakPoint = {
            original : beforeNewLine,
            newLined : afterNewLine,
        }

        return breakPointNode;
    }else if(element[0] == "hglue" && !Array.isArray(element[1])){
        let hGlue : HGlue = {stretchFactor : parseFloat(element[1])}
        return hGlue;
    }
    else{
        return calculateTextWidthHeight(element, style);
    }
}




/**
 * whole document-representing class
 */
export class Clo{
    /** storing the text string into the main frame */
    mainStream : Array<string>;
    /** array of preprocessor functions to preprocess the `mainStream` */
    preprocessors : Array<Function>;
    /** the attributes for the Clo */
    attrs: {[index: string]:any} ; // a4 size(x,y)

    
    constructor(){
        this.preprocessors = [];
        this.mainStream = [];
        this.attrs = {
            "page" : A4_IN_PX, // default for a4. in px of [x, y]
            "defaultFrameStyle" : defaultFrameStyle, // defaultFrameStyle
            "hyphenLanguage" : 'en' // hyphenated in the language (in ISO 639)
        };

        

        // register the precessor functions
        this.preprocessorRegister(splitCJKV);
        this.preprocessorRegister(hyphenForClo);
        this.preprocessorRegister(twoReturnsToNewline);
        this.preprocessorRegister(spacesToBreakpoint);
        this.preprocessorRegister(filterEmptyString);
    }

    public setAttr(attr : string, val : any):void{
        Object.assign(this.attrs, attr, val);
    }

    public getAttr(attr:string) : any{
        if (Object.keys(this.attrs).length === 0){
            return this.attrs[attr];
        }else{
            return undefined;
        }
        
    }

    /**
     * register a function of preprocessor
     * @param f a function
     */
    public preprocessorRegister(f : Function){
        this.preprocessors.push(f);
    }

    public async generatePdf(){
        // preprocessed
        var preprocessed = this.mainStream;
        for (var i = 0; i<this.preprocessors.length; i++){
            preprocessed = this.preprocessors[i](preprocessed, this);
        }
        // generate the width and height of the stream

        let defaultFontStyle : TextStyle = this.attrs["defaultFrameStyle"].textStyle;
        let a = await calculateTextWidthHeight(preprocessed, defaultFontStyle);

        let breakLineAlgorithms = new breakLines.BreakLineAlgorithm();
        // TODO
        //console.log(breakLineAlgorithms.totalCost(a,70));
        let segmentedNodes = breakLineAlgorithms.segmentedNodes(a, 70);

        console.log(
            this.segmentedNodesToFrameBox(segmentedNodes, <FrameBox>this.attrs["defaultFrameStyle"]));

        // generate pdf
        const pdfDoc = await PDFDocument.create();
        var page = pdfDoc.addPage();
        page.drawText('You can create PDFs!');

        for (var j = 0; j<1000; j+=5){
            if (j %50 == 0){
                page.drawText(j.toString(), {x: 50, y: j});
            }

            page.drawLine({
                start: { x: 0, y: j },
                end: { x: 1000, y: j },
                thickness: 0.5,
                color: rgb(0.75, 0.2, 0.2),
                opacity: 0.20,
              });
        }

        for (var i = 0; i<1000; i+=5){
        if (i % 50 == 0){
            page.drawText(i.toString(), {x: i, y: 50});
        }
        page.drawLine({
            start: { x: i, y: 0 },
            end: { x: i, y: 1000 },
            thickness: 0.5,
            color: rgb(0.75, 0.2, 0.2),
            opacity: 0.20,
          });
        }
        pdfDoc.save();

        const pdfBytes = await pdfDoc.save();
        fs.writeFileSync("blank.pdf", pdfBytes);
    }

    segmentedNodesToFrameBox(segmentedNodes : BoxesItem[][], frame : FrameBox) : Box{
        let baseLineskip = frame.baseLineskip;
        let boxArrayEmpty  : Box[] = [];
        let bigBox : Box = {
            x : frame.x,
            y : frame.y,
            textStyle :  frame.textStyle,
            direction : frame.direction,
            width : frame.width,
            height : frame.height,
            content : boxArrayEmpty,
        }

        var bigBoxContent : Box[] = boxArrayEmpty;

        let segmentedNodesFixed = segmentedNodes.map((x)=>this.removeBreakPoints
(x).flat());
        let segmentedNodeUnglue = segmentedNodesFixed.map((x)=>this.removeGlue(x, frame).flat());
        
        for (var i=0; i<segmentedNodesFixed.length-1; i++){
            var currentLineSkip = baseLineskip;
            var glyphMaxHeight = this.getGlyphMaxHeight(segmentedNodesFixed[i]);
            if (currentLineSkip === null || glyphMaxHeight >currentLineSkip ){
                currentLineSkip = glyphMaxHeight;
            }

            var currentLineBox : Box = {
                x : null,
                y : null,
                textStyle : defaultTextStyle,
                direction : frame.directionInsideLine,
                width :  frame.width,
                height : currentLineSkip,
                content : <Box[]>segmentedNodeUnglue[i],
            }

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
    getGlyphMaxHeight(nodeLine : BoxesItem[]) : number{
        let segmentedNodeLineHeight = nodeLine.map((x : BoxesItem)=>{if ("height" in x && x.height > 0.0){return x.height}else{return 0.0}});
        let maxHeight = Math.max(...segmentedNodeLineHeight);
        return maxHeight;
    }

    removeGlue(nodeLine : BoxesItem[], frame : FrameBox) : BoxesItem[]{
        let breakLineAlgorithms = new breakLines.BreakLineAlgorithm();
        let glueRemoved = nodeLine.filter((x)=>!breakLineAlgorithms.isHGlue(x));
        let onlyGlue = nodeLine.filter((x)=>breakLineAlgorithms.isHGlue(x));
        let sumStretchFactor = onlyGlue.map((x)=>{if("stretchFactor" in x){ return x.stretchFactor} else{return 0;}})
            .reduce((acc, cur)=>acc+cur , 0);

        let glueRemovedWidth = glueRemoved.map((x)=>{if("width" in x){ return x.width} else{return 0;}})
            .reduce((acc, cur)=>acc+cur , 0);
        let offset = frame.width - glueRemovedWidth;
        var res = [];
        for (var i=0; i<nodeLine.length; i++){
            var ele = nodeLine[i];
            if (breakLineAlgorithms.isHGlue(ele)){
                let tmp : Box = {
                    x : null,
                    y : null,
                    textStyle : null,
                    direction : frame.directionInsideLine,
                    width : ele.stretchFactor / sumStretchFactor * offset,
                    height : 0,
                    content : "",

                }

                res.push(tmp);
            }else{
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
    removeBreakPoints(boxitemline : BoxesItem[]) : BoxesItem[]{
        var res : BoxesItem[]  = [];
        let breakLineAlgorithms = new breakLines.BreakLineAlgorithm();

        for (var i = 0; i<boxitemline.length; i++){
            let ele = boxitemline[i];
            if (breakLineAlgorithms.isBreakPoint(ele)){
                if (i == boxitemline.length-1){
                    res.push(ele.newLined);
                }else{
                    res.push(ele.original);
                }
            }else{
                res.push(ele);
            }
        }

        return res;
    }

    
}


/*
export let a = new Clo();
export default a; */