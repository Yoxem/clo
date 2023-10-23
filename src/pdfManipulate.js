"use strict";
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
exports.pdfGenerate = void 0;
const fs_1 = require("fs");
const pdf_lib_1 = require("pdf-lib");
var fontkit = require('pdf-fontkit');
function pdfGenerate() {
    return __awaiter(this, void 0, void 0, function* () {
        const pdfDoc = yield pdf_lib_1.PDFDocument.create();
        const page = pdfDoc.addPage();
        pdfDoc.registerFontkit(fontkit);
        const fontBytes = (0, fs_1.readFileSync)("/usr/share/fonts/uming.ttf");
        const font2 = yield pdfDoc.embedFont(fontBytes, { subset: true });
        const fontBytes2 = (0, fs_1.readFileSync)("/usr/share/fonts/truetype/noto/NotoSansArabic-Light.ttf");
        const font3 = yield pdfDoc.embedFont(fontBytes2, { subset: true });
        page.drawText("x=20, y=20", { x: 20, y: 20 });
        page.drawText("x:20, y:100 天地人", { x: 20, y: 100, font: font2 });
        page.drawText("عربي", { x: 50, y: 150, font: font3 });
        const pdfBytes = yield pdfDoc.save();
        (0, fs_1.writeFileSync)('/tmp/test2.pdf', pdfBytes);
    });
}
exports.pdfGenerate = pdfGenerate;
pdfGenerate();
