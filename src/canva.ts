const { execSync } = require('child_process');
import { readFileSync, writeFileSync } from "fs";
import "pdfkit";


export interface CloCommand {
    cmdName : string,
    args : TextStreamUnit[], 
}


export type TextStreamUnit = string | CloCommand;
export type PDFDocument = PDFKit.PDFDocument;
/**
 * a clo document
 */
export interface Clo{
    mainText : TextStreamUnit[],
    mainFontStyle? : FontStyle,
    PDFCanvas : PDFDocument;

}

/**
 * Font Style Interface
 * - family : eg. "FreeSans"
 * - size : in px, not in pt.
 * - textWeight : TextWeight.REGULAR ,etc
 * - fontStyle : FontStyle.ITALIC ,etc
 */
export interface TextStyle{
    family : string,
    size : number, 
    textWeight : TextWeight,
    fontStyle : FontStyle,
    color? : string,
};

export enum TextWeight {
    REGULAR,
    BOLD,
  };

export enum FontStyle{
    NORMAL,
    ITALIC,
    OBLIQUE,
};

export interface fontPathPSNamePair{
    path : string,
    psName : string,
}

/**
 * guess the font path and postscript name of a font style with fontconfig's commands
 * @param style the font style
 * @returns pair of the font path and postscript name.
 */
export function fontStyleTofont(style : TextStyle) : fontPathPSNamePair{
    try {
        let fcMatchCommand = `fc-match "${style.family}":${TextWeight[style.textWeight]}:`+
        `${FontStyle[style.fontStyle]}` +` postscriptname file`;

        let fcMatchOut = execSync(fcMatchCommand);
        let matched = fcMatchOut
                            .toString()
                            .match(/\:file=(.+):postscriptname=(.+)\n/);

        let fontPath : string = matched[1];
        let psName : string = matched[2];

        return {path: fontPath, psName : psName};


    } catch (error) {
        console.log(`WARNING: You should install "fontconfig" to select the font.
         Detail of the error:` + error);
    
        return {path: "", psName : ""};
    }
};



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
export async function putText(clo : Clo, str : string, sty : TextStyle,
    pageNo : number, x : number, y : number): Promise<Clo>{

    let fontInfo = fontStyleTofont(sty);

    if (fontInfo.path.match(/\.ttc$/g)){
        var middle = clo.PDFCanvas
        .font(fontInfo.path, fontInfo.psName)
        .fontSize(sty.size);}
    else{
        var middle = clo.PDFCanvas
        .font(fontInfo.path)
        .fontSize(sty.size);  
    }

    if (sty.color !== undefined){
        middle.fill(sty.color);
    }
    
    middle.text(str,  x, y);

    clo.PDFCanvas = middle;

    return clo;
};