import { readFileSync, writeFileSync } from "fs";
import { PDFDocument } from "pdf-lib";
var fontkit = require('@pdf-lib/fontkit');

export async function pdfGenerate(){

    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage()

    pdfDoc.registerFontkit(fontkit);
    const fontBytes = readFileSync("/usr/share/fonts/uming.ttf");
    const font2 = await pdfDoc.embedFont(fontBytes, {subset:true})

    const fontBytes2 = readFileSync("/usr/share/fonts/truetype/noto/NotoSansArabic-Light.ttf")

    const font3 = await pdfDoc.embedFont(fontBytes2, {subset:true})

    page.drawText("x=20, y=20", {x : 20, y : 20})
    page.drawText("x:20, y:100 天地人", {x : 20, y : 100, font: font2})
    page.drawText("عربي", {x : 50, y : 150, font: font3})

    const pdfBytes = await pdfDoc.save();

    writeFileSync('/tmp/test2.pdf', pdfBytes);
}

pdfGenerate();