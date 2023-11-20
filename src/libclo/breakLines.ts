/**
 * Algorithms and functions for LineBreaking
 */
import { join } from "path";
import {BreakPoint, BoxesItem, HGlue, CharBox} from "./index.js";
import { listenerCount } from "process";
import { unwatchFile } from "fs";
/** 
 * Algorithms in LATEX-like language
 */

export class BreakLineAlgorithm {

    lineCostStorage : number[][];
    totalCostAuxStorage : number[];
    prevNodes : number[];
    

    
    constructor(){
        this.prevNodes = [];
        this.totalCostAuxStorage = [];
        this.lineCostStorage = [[]];
    }

    /**check if a boeitem is BreakPoint Type */
    isBreakPoint (item : any) : item is BreakPoint{
        return (item as BreakPoint).newLined !== undefined;
    }

    /**check if a boeitem is HGlue Type */
    isHGlue (item : any) : item is HGlue{
        return (item as HGlue).stretchFactor !== undefined;
    }


    /** measuring original advance width */
    origWidth(item : BoxesItem) : number{
        if (this.isBreakPoint(item)){
            return this.origWidth(item.original);
        }else if(Array.isArray(item)){
            return item.map((x)=>this.origWidth(x))
                .reduce((acc, current) => acc + current,
                0.0,)
        }else if(this.isHGlue(item)){
            return 0.0;
        }
        else{
            return item.width;
        }
    }

    segmentedNodes(items : BoxesItem[], lineWidth : number) : BoxesItem[][]{

        let lineWidthFixed = lineWidth;
        this.totalCost(items ,lineWidthFixed);
        let nodeList = this.generateBreakLineNodeList();
        let res = [];
        let low = -1;
        let up = nodeList[0];

        for(var i=0; i<nodeList.length; i++){
            res.push(items.slice(low+1, up+1));
            low = nodeList[i];
            up = nodeList[i+1];

        }


        return res;
    }

    /**genrate the list of point of breaking line. it returns a correct list ascending*/
    generateBreakLineNodeList() : number[]{
        let res : number[] = [];
        var pointer = this.prevNodes.length-1;
        while (this.prevNodes[pointer] !== undefined){
            res.push(pointer);
            pointer = this.prevNodes[pointer];
        }
        return res.reverse();
    }

    /** measuring new-line triggered advance width */
    newLineWidth(item : BoxesItem) : number{
        if (this.isBreakPoint(item)){
            return this.origWidth(item.newLined);
        }else{
            // impossible to make a new line
            return Infinity;
        }
    }
    /**
     * check all the total cost of paragraphes of the segnemt
     */
    totalCost(items : BoxesItem[], lineWidth: number) : number{
        let lineWidthFixed = lineWidth * 0.75;
        let itemsLength = items.length;
        this.lineCostStorage = Array(itemsLength);
        this.prevNodes = Array(itemsLength).fill(null);


        for (var i=0; i<itemsLength; i++){
            this.lineCostStorage[i] = Array(itemsLength).fill(null);
        }

        this.totalCostAuxStorage = Array(itemsLength).fill(null);

        let a = Infinity;
        for(var k=itemsLength-2; this.lineCost(items, k+1,itemsLength-1, lineWidthFixed) < Infinity; k--){
            
            let tmp = this.totalCostAux(items, k, lineWidthFixed);
            
            if (a > tmp){
                this.prevNodes[itemsLength-1] = k
                a = tmp;
            }
            
        }
        return a;

    }

    /**
     * check the total cost item[0..j].
     * @param items 
     * @param i 
     * @param lineWidth 
     */
    totalCostAux(items : BoxesItem[], j : number, lineWidth: number): number{
        
        if (this.totalCostAuxStorage[j] !== null){
            return this.totalCostAuxStorage[j];
        }

        let rawLineCost = this.lineCost(items, 0, j, lineWidth);
        if (rawLineCost != Infinity){
            this.totalCostAuxStorage[j] = rawLineCost**3.0;
            return rawLineCost**3.0;
        }else{
            var returnCost = Infinity;
            for(var k=0; k<j; k++){
                let tmp = this.totalCostAux(items, k, lineWidth) + this.lineCost(items, k+1,j, lineWidth)**3.0;
                if (returnCost > tmp){
                    this.prevNodes[j] = k;
                    returnCost = tmp;
                }
            }
            this.totalCostAuxStorage[j] = returnCost;
            return returnCost;

        }
        


    }



    /**
     * check the line cost of a line containing items[i..j]
     * @param items items of box
     * @param i beginning (excluded)
     * @param j end of the line 
     * @param lineWidth line width
     */
    lineCost(items : BoxesItem[], i : number, j : number, lineWidth: number) : number{
        if (this.lineCostStorage[i][j] !== null){
            console.log("AA")
            return this.lineCostStorage[i][j];
        }

        if (!this.isBreakPoint(items[j])){
            this.lineCostStorage[i][j] = Infinity;
            return Infinity;
        }else{
            var tmpItemWidth = 0;
            for (var k = i; k<j; k++){
                tmpItemWidth += this.origWidth(items[k]);
            }

            tmpItemWidth += this.newLineWidth(items[j]);

            if (tmpItemWidth > lineWidth){
                this.lineCostStorage[i][j] = Infinity;
                return Infinity;
            }else{
                let returnValue = (lineWidth - tmpItemWidth);
                this.lineCostStorage[i][j] = returnValue;
                return returnValue;
            }
        }

    }

}