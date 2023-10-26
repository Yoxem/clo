"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.a = exports.Clo = void 0;
function foo(arr) {
    for (let i = 0; i < arr.length; i++) {
    }
    if (Array.isArray(arr)) {
        arr.push("balabala");
    }
    return arr;
}
class Clo {
    constructor() {
        this.preprocessors = [];
        this.mainStream = [];
        this.attributes = { "page": [793.7, 1122.5] };
        this.preprocessorRegister(foo);
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
