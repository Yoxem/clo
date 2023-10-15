import * as canva from "../src/canva.js";
import { PDFDocument } from "pdf-lib";
var fontkit = require('@pdf-lib/fontkit');
import {writeFileSync} from 'fs';

let hanziFont = {
    name : "思源黑體",
    size : 12,
    textWeight : canva.TextWeight.BOLD,
    textStyle : canva.TextStyle.ITALIC,
}


async function foo (){

let c = await  PDFDocument.create();

let clo =  await {
    mainText : ["123"],
    mainFontStyle : hanziFont,
    PDFCanvas : c,

}

clo.PDFCanvas.registerFontkit(fontkit);
const page =  clo.PDFCanvas.addPage();

await canva.putText(clo, clo.mainText[0],hanziFont, 0, 100, 200);

const pdfBytes = await clo.PDFCanvas.save();

writeFileSync('/tmp/test.pdf', pdfBytes);

};

foo();