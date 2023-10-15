"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require('fs');
var argv = require('minimist')(process.argv.slice(2));
const parser = __importStar(require("./parser.js"));
let helpDesc = `
clo: clo INPUT_FILE --output-js OUTPUT_JS_FILE

\ta little typesetter powered by TypeScript/Javascript.

## Arguments
INPUT_FILE\tan input .clo file

## Parameters
---
--output-js\tgenerated the output middle JS file


Report bugs to: clo@kianting.info
clo home page: <https://kianting.info/wiki/w/Project:Clo>
`;
processArgv(argv, helpDesc);
/**
 * processing the passed `argv` (arguments)
 */
function processArgv(argv, helpDesc) {
    let inputFile = argv['_'];
    let outputJSFile = argv['output-js'];
    let NoInputFile = (inputFile.length == 0);
    let NoOutputJSFile = (outputJSFile === undefined || outputJSFile == true);
    let helpTriggered = argv['help'];
    if (inputFile.length > 1) {
        console.log("Sorry, the input file should be only one.");
    }
    /** output --help */
    if (helpTriggered || NoInputFile || NoOutputJSFile) {
        console.log(helpDesc);
    }
    else {
        fs.readFile(inputFile[0], 'utf8', (err, inputText) => {
            if (err)
                throw err;
            let tree = parser.inputTextToTree(inputText);
            let output = parser.treeToJS(tree);
            fs.writeFile(outputJSFile, output, (err) => {
                if (err)
                    throw err;
            });
        });
    }
}
