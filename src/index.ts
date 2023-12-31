var fs = require('fs');
var argv : any = require('minimist')(process.argv.slice(2));

import * as parser from "./parser.js";

/**
 * help for inputing `--help` parameter.
 */
export let helpDesc =
`
clo: clo INPUT_FILE --output-js OUTPUT_JS_FILE

\ta little typesetter powered by TypeScript/Javascript.

## Arguments
INPUT_FILE\tan input .clo file

## Parameters
---
--output-js\tgenerated the output middle JS file


Report bugs to: clo@kianting.info
clo home page: <https://kianting.info/wiki/w/Project:Clo>
`

processArgv(argv, helpDesc);

/**
 * processing the passed `argv` (arguments)
 */

export function processArgv(argv : any, helpDesc : string){
    let inputFile : string[] = argv['_'];
    let outputJSFile : string | true = argv['output-js'];

    let NoInputFile : boolean = (inputFile.length == 0);
    let NoOutputJSFile : boolean = (outputJSFile === undefined || outputJSFile == true);
    let helpTriggered : boolean = argv['help'];

    if (inputFile.length > 1){
        console.log("Sorry, the input file should be only one.");
    }

    /** output --help */
    if (helpTriggered || NoInputFile || NoOutputJSFile){
        console.log(helpDesc);
    }else{
        fs.readFile(inputFile[0], 'utf8', (err : Error, inputText : string) => {
            if (err) throw err;

            let tree = parser.inputTextToTree(inputText);

            let output = parser.treeToJS(tree);

            fs.writeFile(outputJSFile, output , (err : Error) => {
                if (err) throw err;
              });

          }); 
    }

}





