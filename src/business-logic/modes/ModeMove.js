import * as d3 from "d3";
import AbstractMode from "./AbstractMode.js";

export default class ModeMove extends AbstractMode {
    constructor({controller, svgHandler, selectionHandler}) {
        super();
        this._controller = controller;
        this._svgHandler = svgHandler;
        this._selectionHandler = selectionHandler;
    }

    enable() {
        d3.select("#move").classed("activeMode", true);
        this.data = {cursor: undefined, nodePos: {}, qPos: {}};
    }

    onMouseDown(point) {
        this.data.cursor = point;
        this._selectionHandler.selectedNodes.forEach(node => this.data.nodePos[node.id] = node.pos);
        this._selectionHandler.selectedEdges.forEach(edge => this.data.qPos[edge.id] = edge.q);
        this._selectionHandler.affectedEdges.forEach(affected => {
            const edge = affected.edge;
            this.data.qPos[edge.id] = edge.q
        });
    }

    onMouseMove(point) {
        if (this.data.cursor !== undefined) {
            const dx = point.x - this.data.cursor.x;
            const dy = point.y - this.data.cursor.y;
            this._selectionHandler.selectedNodes.forEach(node => {
                const np = this.data.nodePos[node.id];
                node.pos = {x: np.x + dx, y: np.y + dy};
                this._svgHandler.updateNode(node);
            });
            this._selectionHandler.selectedEdges.forEach(edge => {
                const q = this.data.qPos[edge.id];
                edge.q = {x: q.x + dx, y: q.y + dy};
                this._svgHandler.updateEdge(edge);
            });
            const dx2 = dx * 0.5;
            const dy2 = dy * 0.5;
            this._selectionHandler.affectedEdges.forEach(affected => {
                const edge = affected.edge;
                const q = this.data.qPos[edge.id];
                edge.q = {x: q.x + dx2, y: q.y + dy2};
                this._svgHandler.updateEdge(edge);
            });
            this._svgHandler.updateMessage();
        }
    }

    onMouseUp() {
        this.data.cursor = undefined;
    }

    onEscape() {
        return this._controller().modi.MODE_SELECT;
    }

    disable() {
        d3.select("#move").classed("activeMode", false);
    }
}