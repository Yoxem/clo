const { execSync } = require('child_process');
import { PDFDocument, RGB, ColorTypes } from "pdf-lib";
import { readFileSync, writeFileSync } from "fs";
import fontkit from '@pdf-lib/fontkit';


export interface CloCommand {
    cmdName : string,
    args : TextStreamUnit[], 
}

export type TextStreamUnit = string | CloCommand;

/**
 * a clo document
 */
export interface Clo{
    mainText : TextStreamUnit[],
    mainFontStyle? : FontStyle,
    PDFCanvas : PDFDocument,

}

/**
 * Font Style Interface
 * name : eg. "FreeSans"
 * size : in px, not in pt.
 * textWeight : TextWeight.REGULAR ,etc
 * textWeight : TextStyle.ITALIC ,etc
 */
export interface FontStyle{
    name : string,
    size : number, 
    textWeight : TextWeight,
    textStyle : TextStyle,
    color? : string,
};

export enum TextWeight {
    REGULAR,
    BOLD,
  };

export enum TextStyle{
    NORMAL,
    ITALIC,
    OBLIQUE,
};

/**
 * guess the font path of a font style with fontconfig's commands
 * @param style the font style
 * @returns the font path in string, if found none or .ttc, return a empty string.
 */
export function fontStyleTofontPath(style : FontStyle) : string{
    try {
        let fcMatchOut = execSync(
            `fc-match "${style.name}":${TextWeight[style.textWeight]}:`+
            `${TextStyle[style.textStyle]}`);
        
        let fontFileName : string = fcMatchOut.toString().match(/^[^:]+/g)[0];

        if (fontFileName.match(/[.]ttc$/g)){
            console.log("WARNING: the program doesn't support .ttc font format!\n"+
                "Font file name: "+
                fontFileName);
            return "";
        }

        let fcListOut = execSync(
            `fc-list | grep ${fontFileName}`);
        let fontPath : string = fcListOut.toString().match(/^[^:]+/g)[0];
        return fontPath;
    } catch (error) {
        console.log("WARNING: You should install `fontconfig` to select the font.");
        return "";
    }
};

export function hexToRGB(hex : string) : RGB{
    let matched = hex.match(/^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/);

    var result : RGB ;
    if (!matched){
        console.log("WARNING: the hex color code is not valid. set to #000000")
        result = {
            type : ColorTypes.RGB,
            red: 0,
            green: 0,
            blue: 0, 
        }
    }else{
        result = {
            type : ColorTypes.RGB,
            red: parseInt(matched[1], 16),
            green: parseInt(matched[2], 16),
            blue: parseInt(matched[3], 16)
      };
    }

    return result;
}

/**
 * put text in a clo canva.
 * @param clo : the clo object
 * @param str input string
 * @param sty input fontstyle
 * @param PageNo : the input page, 0-indexed.
 * @param x base x-point from left
 * @param y base y-point from top
 * @returns a new updated clo object
 */
export async function putText(clo : Clo, str : string, sty : FontStyle,
    pageNo : number, x : number, y : number): Promise<Clo>{
    
    clo.PDFCanvas.registerFontkit(fontkit);
    let canvaPage =  clo.PDFCanvas.getPage(pageNo);


    const fontBytes = readFileSync(fontStyleTofontPath(sty));
    const fontEmbed =  await clo.PDFCanvas.embedFont(fontBytes);

    var textColor : RGB;
    if (sty.color === undefined){
        textColor =  hexToRGB("#000000");
    }else{
        textColor =  hexToRGB(sty.color);
    }

    let drawTextOptions = {
        x : x,
        y : canvaPage.getHeight() - y,
        font : fontEmbed,
        size : sty.size,
        color : textColor};

    canvaPage.drawText(str, drawTextOptions);

    return clo;
};