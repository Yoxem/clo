import { isKeyObject, isStringObject } from "util/types";
import {tkTree} from "../parser";
import {TextStyle, FontStyle, TextWeight} from "../canva";
import { isString } from "util";

/**
 * TYPES
 */

/**
 * text direction
 * LTR - left to right
 * TTB - top to bottom
 * etc.
 */
enum Direction{
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
interface FrameBox extends Box{
    directionInsideLine : Direction,
    baseLineskip : number | null,
}

/**
 * a basic Box
 */
interface Box{
    x : number | null,
    y : number | null,
    fontStyle : FontStyle | null,
    direction : Direction,
    width : number,
    height : number,
    content : string | Box[] | null,
}


/**
 * DEFAULT CONST PART
 */
const A4_IN_PX = {"width" : 793.7,
                  "height" : 1122.5};

const defaultTextStyle : FontStyle = {
        family : "FreeSans",
        size : 12,
        textWeight : TextWeight.REGULAR,
        textStyle : TextStyle.ITALIC,
}

const defaultFrameStyle : FrameBox = {
    directionInsideLine : Direction.LTR,
    direction : Direction.TTB,
    baseLineskip : ptToPx(15),
    fontStyle : defaultTextStyle,
    x : A4_IN_PX.width * 0.10,
    y : A4_IN_PX.height * 0.10,
    width : A4_IN_PX.width * 0.80,
    height : A4_IN_PX.height * 0.80,
    content : null,
};

const cjkvBlocksInRegex = ["Hani"];

const cjkvRegexPattern = new RegExp("((?:" +
    cjkvBlocksInRegex.map((x)=>"\\p{Script_Extensions="+x+"}").join("|") + ")+)", "gu");
/**
 * FUNCTION PART
 */
/**
 * convert from ptToPx
 * @param pt pt size value
 * @returns the corresponding px value
 */
function ptToPx(pt : number) : number{
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
function splitCJKV(arr : tkTree): tkTree{
    var result : tkTree = [];
    for (let i = 0; i < arr.length; i++) {
        var item = arr[i];
        if (!Array.isArray(item)){
            console.log(item.split(cjkvRegexPattern));
            result = result.concat(item.split(cjkvRegexPattern));
        }
        else{
            result.push(item);
        }
    }

    return result;
}

export class Clo{
    mainStream : Array<string>;
    preprocessors : Array<Function>;
    attributes: {[index: string]:any} ; // a4 size(x,y)

    
    constructor(){
        this.preprocessors = [];
        this.mainStream = [];
        this.attributes = {"page" : A4_IN_PX};

        

        // register the precessor functions
        this.preprocessorRegister(splitCJKV);
    }

    public setAttr(attr : string, val : any):void{
        Object.assign(this.attributes, attr, val);
    }

    public getAttr(attr:string) : any{
        if (Object.keys(this.attributes).length === 0){
            return this.attributes[attr];
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
        var prepro = this.mainStream;
        for (var i = 0; i<this.preprocessors.length; i++){
            prepro = this.preprocessors[i](prepro);
        }
        // TODO
        console.log("test"+prepro);
    }

    
}

export let a = new Clo();
export default a;