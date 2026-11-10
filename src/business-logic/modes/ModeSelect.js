import * as d3 from "d3";
import AbstractMode from "./AbstractMode.js";

export default class ModeSelect extends AbstractMode {
    constructor({controller, svgHandler, selectionHandler}) {
        super();
        this._controller = controller;
        this._svgHandler = svgHandler;
        this._selectionHandler = selectionHandler;
    }

    enable() {
        d3.select("#select").classed("activeMode", true);
        this._selectionHandler.clear();
        this.enableButtons({move: false, rotate: false, copy: false, mirror: false, erase: false});
        this.data = {cursor: undefined, edge: undefined, node: undefined}
    }

    onMouseDown(point) {
        this.data.cursor = point;
        const focus = this._svgHandler.focus;
        if (focus.obj !== undefined) {
            if ((focus.type === "node")) {
                this._selectionHandler.selectNode(focus.obj);
                this.data.node = {
                    original: focus.obj,
                    pos: focus.obj.pos,
                    q: []
                };
                focus.obj.adjacent.forEach(adja => this.data.node.q.push(adja.q));
            } else if (focus.type === "edge") {
                this._selectionHandler.selectEdge(focus.obj);
            } else if (focus.type === "q") {
                this._selectionHandler.selectEdge(focus.obj);
                this.data.edge = {
                    original: focus.obj,
                    q: focus.obj.q
                };
                this._svgHandler.setQEdge(focus.obj);
                this._svgHandler.setQEdgeVisibility(true);
            }
        } else {
            this._selectionHandler.startRectSelection(point);
        }
    }

    onMouseMove(point) {
        if (this._selectionHandler.isRectActive())
            this._selectionHandler.moveRectSelection(point);
        else if (this.data.node !== undefined) {
            // move quick node
            const deltaX = point.x - this.data.cursor.x;
            const deltaY = point.y - this.data.cursor.y;
            const node = this.data.node.original;
            node.pos = {x: this.data.node.pos.x + deltaX, y: this.data.node.pos.y + deltaY};
            this._svgHandler.updateNode(node);
            for (let i = 0; i < node.adjacent.length; i++) {
                const q = this.data.node.q[i];
                const adja = node.adjacent[i];
                adja.q = {x: q.x + deltaX * 0.5, y: q.y + deltaY * 0.5};
                this._svgHandler.updateEdge(adja);
            }
        } else if (this.data.edge !== undefined) {
            //move bézier point of edge
            const deltaX = point.x - this.data.cursor.x;
            const deltaY = point.y - this.data.cursor.y;
            const edge = this.data.edge.original;
            edge.q = {x: this.data.edge.q.x + deltaX, y: this.data.edge.q.y + deltaY};
            this._svgHandler.updateEdge(edge);
            this._svgHandler.setQEdge(edge);
        }
        this._svgHandler.updateMessage();
    }

    onMouseUp() {
        if (this.data.edge !== undefined) {
            this.data.edge = undefined;
            this._svgHandler.setQEdgeVisibility(false);
            // SelectionHandler.instance.clear();
        } else if (this.data.node !== undefined) {
            this.data.node = undefined;
        } else if (this._selectionHandler.isRectActive()) {
            this._selectionHandler.endRectSelection();
        }
        if (this._selectionHandler.isAnySelected()) {
            this.enableButtons({
                move: true,
                rotate: true,
                copy: true,
                mirror: checkMirror(this._selectionHandler),
                erase: true
            });
        } else {
            this.enableButtons({move: false, rotate: false, copy: false, mirror: false, erase: false});
        }
    }

    onEscape() {
        this._selectionHandler.clear();
        this.enableButtons({move: false, rotate: false, copy: false, mirror: false, erase: false});
    }

    disable() {
        d3.select("#select").classed("activeMode", false);
        this._selectionHandler.cancelRectSelection();
    }
}

let checkMirror = (selh) => {
    const sNodes = Array.from(selh.selectedNodes);   // convert from Map/Set to array
    const sEdges = Array.from(selh.selectedEdges);

    let a1 = 0;
    const comp = {};
    for (let i = 0; i < sNodes.length; i++) {
        const sn = sNodes[i];
        if (sn.adjacent.length === 0) return false;
        else if (sn.adjacent.length === 1) {
            a1++;
        }
        comp[sn.id] = i;
    }
    if (a1 !== 2) return false;
    let size = sNodes.length;
    sEdges.forEach(se => {
        const fromId = se.from.id;
        const toId = se.to.id;
        if (comp[fromId] < comp[toId]) {
            comp[toId] = comp[fromId];
            size--;
        } else if (comp[fromId] > comp[toId]) {
            comp[fromId] = comp[toId];
            size--;
        }
    });
    return size === 1;
};