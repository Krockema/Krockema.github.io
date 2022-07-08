"use strict"

import {
    GridSpaceTuple
} from './world.js';

let graph = [];
let que = [];

/**
 * Must be called before Dijkstra. It creates the weight matrix. 
 * @param {GridSpaceTuple[][]} raster 
 */
export function prepareDjkstra(raster) {
    graph = [];
    que = [];
    for (let i = 0; i < raster.length; i++) {
        let arr = [];
        graph.push(arr);
        for (let j = 0; j < raster[0].length; j++) {
            if (raster[i][j].getCellType() == 1)
                graph[i].push(new Node(raster[i][j], 1));
            else {
                graph[i].push(new Node(raster[i][j], 1000)); //Starke Vereinfachung des Algorithmus
            }
        }
    }

    let suroundingX = [0, 0, -1, +1]
    let suroundingZ = [+1, -1, 0, 0]

    for (let i = 0; i < graph.length; i++) {
        for (let j = 0; j < graph[i].length; j++) {

            for (let k = 0; k < suroundingX.length; k++) {
                let sX = i + suroundingX[k];
                let sZ = j + suroundingZ[k];

                if (sX < 0 || sZ < 0 || sX >= graph.length || sZ >= graph[sX].length)
                    continue;
                if (graph[sX][sZ] != undefined) {
                    graph[i][j].addNext(graph[sX][sZ]);
                }
            }
        }
    }
}

/**
 * This is the implementation of the dijkstra algorithm. 
 * 
 * On first call, it will calculate and return the solution. 
 * After that only the results will be returned without further calculation. 
 * 
 * Please read the definition of the dijkstra algorithm, to understand what is going on.
 * This is my interpretation of it to the specific problem of this project, and might not be 
 * 100% compatible with the original.
 * 
 * And it tends to do some chaotic stuff, but its working. :)  
 * 
 * @param {number} startX
 * @param {number} startY
 * @param {number} targetX
 * @param {number} targetY
 */
export function dijkstra(startX, startY, targetX, targetY) {
    let start = graph[startX][startY];
    let end = graph[targetX][targetY];
    start.setStartPoint();

    que.push(start);
    while (que.length > 0) {
        let selected = que.shift();
        if (selected.visited) {
            continue;
        }

        for (let i = 0; i < selected.getNext().length; i++) {
            let child_leave = selected.getNext()[i];
            let child = child_leave;
            let cost_to_child = child_leave.getCost();

            if (child.isStartPoint())
                continue;

            let lastCostNode = child.getLastCostNode();

            if (lastCostNode[1] > cost_to_child + selected.getCost()) {
                if (child != selected.getLastCostNode()[0]) {
                    child.addCostLast(selected, cost_to_child + selected.getCost());
                } else {
                    console.error("If you see this, you found a bug in the dijkstra implementation. Good luck to find it. Movements will eventually not work.");
                    //never happened since it was stable, but still possible and a great problem if it happens.  
                }
            }
            if (!child.isVisited())
                que.push(child_leave);
        }
        selected.setVisited();
    }

    let way = [end.getGridSpaceTuple()];
    let selectedReturn = end;

    while (!selectedReturn.isStartPoint()) {
        selectedReturn = selectedReturn.getLastCostNode()[0];
        way.push(selectedReturn.getGridSpaceTuple())
    }
    way = way.reverse();
    return way;
}

/**
 * Support class for the dijkstra algorithm. 
 */
class Node {

    /**
     * @param {GridSpaceTuple} gridSpaceTuple
     * @param {number} cost
     */
    constructor(gridSpaceTuple, cost) {
        this.next = [];
        this.cost = cost;
        this.gridSpaceTuple = gridSpaceTuple;
        this.visited = false;
        this.startPoint = false;
        this.lastCostNode = [undefined, 2000000];
    }

    /**
     * @param {Node} child_leave
     */
    addNext(child_leave) {
        this.next.push(child_leave);
    }
    /**
     * @param {Node} lastNode
     * @param {number} cost
     */
    addCostLast(lastNode, cost) {
        this.lastCostNode = [lastNode, cost];
    }

    setVisited() {
        this.visited = true;
    }
    setStartPoint() {
        this.startPoint = true;
        this.cost = 0;
    }
    getCost() {
        return this.cost;
    }
    getGridSpaceTuple() {
        return this.gridSpaceTuple;
    }
    getNext() {
        return this.next;
    }
    getLastCostNode() {
        return this.lastCostNode;
    }
    isVisited() {
        return this.visited;
    }
    isStartPoint() {
        return this.startPoint;
    }

}