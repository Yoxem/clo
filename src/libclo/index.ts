import {tkTree} from "../parser";


function foo(arr : tkTree): tkTree{
    for (let i = 0; i < arr.length; i++) {
        
    }
    if (Array.isArray(arr)){
        arr.push("balabala");
    }
    return arr;
}

export class Clo{
    mainStream : Array<string>;
    preprocessors : Array<Function>;
    attributes: object ; // a4 size(x,y)

    
    constructor(){
        this.preprocessors = [];
        this.mainStream = [];
        this.attributes = {"page" : [793.7, 1122.5]};
        this.preprocessorRegister(foo);
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