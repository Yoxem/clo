"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BreakLineAlgorithm = void 0;
/**
 * Algorithms in LATEX-like language
 */
class BreakLineAlgorithm {
    constructor() {
        this.prevNodes = [];
        this.totalCostAuxStorage = [];
        this.lineCostStorage = [[]];
    }
    /**check if a boeitem is BreakPoint Type */
    isBreakPoint(item) {
        return item.newLined !== undefined;
    }
    /**check if a boeitem is HGlue Type */
    isHGlue(item) {
        return item.stretchFactor !== undefined;
    }
    /** measuring original advance width */
    origWidth(item) {
        if (this.isBreakPoint(item)) {
            return this.origWidth(item.original);
        }
        else if (Array.isArray(item)) {
            return item.map((x) => this.origWidth(x))
                .reduce((acc, current) => acc + current, 0.0);
        }
        else if (this.isHGlue(item)) {
            return 0.0;
        }
        else {
            return item.width;
        }
    }
    segmentedNodes(items, lineWidth) {
        this.totalCost(items, lineWidth);
        let nodeList = this.generateBreakLineNodeList();
        console.log("~~~", nodeList);
        let res = [];
        let low = -1;
        let up = nodeList[0];
        for (var i = 0; i < nodeList.length; i++) {
            res.push(items.slice(low + 1, up + 1));
            low = nodeList[i];
            up = nodeList[i + 1];
        }
        return res;
    }
    /**genrate the list of point of breaking line. it returns a correct list ascending*/
    generateBreakLineNodeList() {
        let res = [];
        var pointer = this.prevNodes.length - 1;
        while (this.prevNodes[pointer] !== undefined) {
            res.push(pointer);
            pointer = this.prevNodes[pointer];
        }
        return res.reverse();
    }
    /** measuring new-line triggered advance width */
    newLineWidth(item) {
        if (this.isBreakPoint(item)) {
            return this.origWidth(item.newLined);
        }
        else {
            // impossible to make a new line
            return Infinity;
        }
    }
    /**
     * check all the total cost of paragraphes of the segnemt
     */
    totalCost(items, lineWidth) {
        let itemsLength = items.length;
        this.lineCostStorage = Array(itemsLength);
        this.prevNodes = Array(itemsLength).fill(null);
        for (var i = 0; i < itemsLength; i++) {
            this.lineCostStorage[i] = Array(itemsLength).fill(undefined);
        }
        this.totalCostAuxStorage = Array(itemsLength).fill(undefined);
        console.log("===", itemsLength);
        let a = this.totalCostAux(items, itemsLength - 1, lineWidth);
        console.log(this.lineCostStorage);
        return a;
    }
    /**
     * check the total cost item[0..j].
     * @param items
     * @param i
     * @param lineWidth
     */
    totalCostAux(items, j, lineWidth) {
        if (this.totalCostAuxStorage[j] !== undefined) {
            return this.totalCostAuxStorage[j];
        }
        let rawLineCost = this.lineCost(items, 0, j, lineWidth);
        if (rawLineCost != Infinity) {
            this.totalCostAuxStorage[j] = rawLineCost;
            return rawLineCost;
        }
        else {
            var returnCost = Infinity;
            for (var k = 0; k < j; k++) {
                let tmp = this.totalCostAux(items, k, lineWidth) + this.lineCost(items, k + 1, j, lineWidth);
                if (returnCost > tmp) {
                    this.prevNodes[j] = k;
                    returnCost = tmp;
                }
            }
            this.totalCostAuxStorage[j] = returnCost;
            return returnCost;
        }
        return returnCost;
    }
    /**
     * check the line cost of a line containing items[i..j]
     * @param items items of box
     * @param i beginning (excluded)
     * @param j end of the line
     * @param lineWidth line width
     */
    lineCost(items, i, j, lineWidth) {
        if (this.lineCostStorage[i] !== undefined && this.lineCostStorage[i][j] !== undefined) {
            return this.lineCostStorage[i][j];
        }
        if (!this.isBreakPoint(items[j])) {
            this.lineCostStorage[i][j] = Infinity;
            return Infinity;
        }
        else {
            var tmpItemWidth = 0;
            for (var k = i; k < j; k++) {
                tmpItemWidth += this.origWidth(items[k]);
            }
            tmpItemWidth += this.newLineWidth(items[j]);
            if (tmpItemWidth > lineWidth) {
                this.lineCostStorage[i][j] = Infinity;
                return Infinity;
            }
            else {
                let returnValue = (lineWidth - tmpItemWidth) ** 3.0;
                this.lineCostStorage[i][j] = returnValue;
                return returnValue;
            }
        }
    }
}
exports.BreakLineAlgorithm = BreakLineAlgorithm;