/**
 * Algorithms and functions for LineBreaking
 */
import { join } from "path";
import {BreakPoint, BoxesItem, HGlue} from "./index.js";
/** 
 * Algorithms in LATEX language
TotalCost(i) = min_{j}~TotalCost(j) + LineCost(j, i)~~~~j=0, 1, ..., i-1

LineCost(j, i)= \begin{cases} 
\infty ~~~ if~~LineWidth - \sum_{k=j+1}^{i-1} OrigWidth(item[k]) - newLineWidth(item[i]) < 0 \\
\infty~~if~~NOT~~breakable(item[i]) \\
(LineWidth - \sum_{k=j+1}^{i-1} OrigWidth(item[k]) - newLineWidth(item[i]))^3 ~~elsewhere
\end{cases} */

/**check if a boeitem is BreakPoint Type */
function isBreakPoint (item : any) : item is BreakPoint{
    return (item as BreakPoint).newLined !== undefined;
}

/**check if a boeitem is BreakPoint Type */
function isHGlue (item : any) : item is HGlue{
    return (item as HGlue).stretchFactor !== undefined;
}


/** measuring original advance width */
function origWidth(item : BoxesItem) : number{
    if (isBreakPoint(item)){
        console.log(item);
        return origWidth(item.original);
    }else if(Array.isArray(item)){
        return item.map((x)=>origWidth(x))
            .reduce((acc, current) => acc + current,
            0.0,)
    }else if(isHGlue(item)){
        return 0.0;
    }
    else{
        return item.width;
    }
}

/** measuring new-line triggered advance width */
function newLineWidth(item : BoxesItem) : number{
    if (isBreakPoint(item)){
        return origWidth(item.newLined);
    }else{
        // impossible to make a new line
        return Infinity;
    }
}

let lineCostStorage : any = new Object();

/**
 * check the total cost item[0..j].
 * @param items 
 * @param i 
 * @param lineWidth 
 */
export function totalCost(items : BoxesItem[], j : number, lineWidth: number){
    if (j in lineCostStorage){
        return lineCostStorage[j];
    }
    var returnCost = Infinity;
    
    for(var i=-1; i<=j; i++){
        // lineCost
        let lCost = lineCost(items, i, j, lineWidth);

        if (returnCost > lCost){
            returnCost = lCost;
        }
    }

    lineCostStorage[j] = returnCost;
    return returnCost;

}



/**
 * check the line cost of a line containing items[i+1..j]
 * @param items items of box
 * @param i beginning (excluded)
 * @param j end of the line 
 * @param lineWidth line width
 */
function lineCost(items : BoxesItem[], i : number, j : number, lineWidth: number){
    if (!isBreakPoint(items[j])){
        return Infinity;
    }else{
        var tmpItemWidth = 0;
        for (var k = i+1; k<j; k++){
            tmpItemWidth += origWidth(items[k]);
        }

        tmpItemWidth += newLineWidth(items[j]);

        if (tmpItemWidth > lineWidth){
            return Infinity;
        }else{
            return (lineWidth - tmpItemWidth)**3.0;
        }
    }

}