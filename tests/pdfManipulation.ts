import * as canva from "../src/canva.js";
import {createWriteStream} from 'fs';
import PDFDocument from 'pdfkit';

let hanziFont = {
    family : "Noto Sans CJK TC",
    size : 12,
    textWeight : canva.TextWeight.REGULAR,
    fontStyle : canva.FontStyle.ITALIC,
}

let romanFont = {
    family : "FreeSans",
    size : 15,
    textWeight : canva.TextWeight.BOLD,
    fontStyle : canva.FontStyle.ITALIC,
}

let arabicFont = {
    family : "noto sans arabic",
    size : 16,
    textWeight : canva.TextWeight.REGULAR,
    fontStyle : canva.FontStyle.NORMAL,
}



async function foo (){

    const doc = new PDFDocument();


    let clo =  await {
        mainText : ["123 一隻貓跑過來"],
        mainTextStyle : hanziFont,
        PDFCanvas : doc,

    }
    clo.PDFCanvas.pipe(createWriteStream('/tmp/output.pdf'));



    await canva.putText(clo, clo.mainText[0],hanziFont, 0, 100, 200);
    await canva.putText(clo, "ag téastáil" ,romanFont, 0, 100, 300);
    await canva.putText(clo, "اَلْعَرَبِيَّةُ‎" ,arabicFont, 0, 100, 350);


    doc.end();

};

foo();