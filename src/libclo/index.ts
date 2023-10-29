import { isKeyObject, isStringObject } from "util/types";
import {tkTree} from "../parser";
import {FontStyle, TextStyle, TextWeight} from "../canva";
import { JSDOM } from "jsdom";

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
 * frame box is a subclass of box
 * - directionInsideLine : text direction inside a line
 * - baselineskip : the distance between baselines in px
 */
export interface FrameBox extends Box{
    directionInsideLine : Direction,
    baseLineskip : number | null,
}

/**
 * a basic Box
 * - x :
 * - y : 
 * - textStyle :
 * - direction :
 * - width :
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
            result.push([ 'bp', item, "" ]); // push a newline command to the result `tkTree`
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
export function calculateTextWidthHeight(preprocessed : tkTree, style : TextStyle): void {
    var dom = new JSDOM(`<!DOCTYPE html><html><head></head>
    <body><canvas id="canvas"></canvas></body></html>`);
    
    try {
        let canvas  = dom.window.document.getElementById("canvas");
        console.log(canvas);

        /*if (!(canvas instanceof HTMLElement)){
            throw new Error('the <canvas="canvas"> in the jsdom\'s DOM is not found.');
            
        }*/

        let context = (<HTMLCanvasElement>canvas).getContext("2d");
        console.log(context);
        if (context == null){
            throw new Error('`canvas.getContext("2d");` can\'t be executed.');
            
        }

        context.font = `normal normal ${style.size}px ${style.family}`;
        console.log(context.font);
        let txt = `Hello john`;
        console.log(txt);
        let measured = context.measureText(txt);
        let width = measured.width;
        let height = measured.actualBoundingBoxAscent;
        let depth = measured.actualBoundingBoxDescent;

        console.log("width: "+width);
        console.log("height: "+height);
        console.log("depth: "+depth);


    } catch (error) {
        console.log("Exception "+error);
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

    public generatePdf(){
        // preprocessed
        var preprocessed = this.mainStream;
        for (var i = 0; i<this.preprocessors.length; i++){
            preprocessed = this.preprocessors[i](preprocessed, this);
        }
        // generate the width and height of the stream

        let defaultFontStyle : TextStyle = this.attrs["defaultFrameStyle"].textStyle;
        calculateTextWidthHeight(preprocessed, defaultFontStyle);

        // TODO
        console.log(preprocessed);
    }

    
}

/*
export let a = new Clo();
export default a; */