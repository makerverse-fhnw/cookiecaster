import AbstractMode from "./AbstractMode.js";
import * as d3 from "d3";

const round5 = x => Math.round(2 * x) * 0.5;

export default class ModeRotate extends AbstractMode {
    constructor({controller, svgHandler, selectionHandler}) {
        super();
        this._controller = controller;
        this._svgHandler = svgHandler;
        this._selectionHandler = selectionHandler;
    }

    enable() {
        d3.select("#rotate").classed("activeMode", true);
        this.data = {pivot: null, vec: null, nodePos: {}, qPos: {}};
        console.log("ModeRotate enabled");
    }

    onMouseDown(point) {
        const nodes = Array.from(this._selectionHandler.selectedNodes);
        const edges = Array.from(this._selectionHandler.selectedEdges);

        if (!nodes.length && !edges.length) {
            console.log("No nodes or edges selected");
            return;
        }

        // --- compute pivot (average of all selected node positions) ---
        const pivot = nodes.reduce(
            (acc, n) => {
                this.data.nodePos[n.id] = n.pos;
                return {x: acc.x + n.pos.x, y: acc.y + n.pos.y};
            },
            {x: 0, y: 0}
        );

        pivot.x /= nodes.length;
        pivot.y /= nodes.length;
        this.data.pivot = pivot;
        this.data.vec = {x: point.x - pivot.x, y: point.y - pivot.y};

        // --- store edge control points ---
        [...this._selectionHandler.selectedEdges, ...this._selectionHandler.affectedEdges].forEach(item => {
            const edge = item.edge || item; // handle affectedEdges which wrap {edge, mod}
            this.data.qPos[edge.id] = edge.q;
        });

        console.log("Pivot:", pivot, "Vec:", this.data.vec);
    }

    onMouseMove(point) {
        const {pivot, vec} = this.data;
        if (!vec) return;

        const vx = vec.x, vy = vec.y;
        const dx = point.x - pivot.x, dy = point.y - pivot.y;

        // --- angle computation ---
        const cross = vx * dy - vy * dx;
        const s = Math.sign(cross);
        const dot = vx * dx + vy * dy;
        const cosPhi = dot / (Math.hypot(vx, vy) * Math.hypot(dx, dy));
        const sinPhi = s * Math.sqrt(1 - cosPhi * cosPhi);

        // simplified half-angle
        const cosHalf = Math.cos(0.5 * Math.acos(cosPhi));
        const sinHalf = s * Math.sqrt(1 - cosHalf * cosHalf);

        // --- rotation helper ---
        const rotatePoint = (x, y, c = cosPhi, s = sinPhi) => ({
            x: round5((x - pivot.x) * c - (y - pivot.y) * s + pivot.x),
            y: round5((x - pivot.x) * s + (y - pivot.y) * c + pivot.y)
        });

        // --- update nodes ---
        for (const node of this._selectionHandler.selectedNodes) {
            const old = this.data.nodePos[node.id];
            node.pos = rotatePoint(old.x, old.y);
            this._svgHandler.updateNode(node);
        }

        // --- update selected edges ---
        for (const edge of this._selectionHandler.selectedEdges) {
            const old = this.data.qPos[edge.id];
            edge.q = rotatePoint(old.x, old.y);
            this._svgHandler.updateEdge(edge);
        }

        // --- update affected edges ---
        for (const {edge} of this._selectionHandler.affectedEdges) {
            const old = this.data.qPos[edge.id];
            edge.q = rotatePoint(old.x, old.y, cosHalf, sinHalf);
            this._svgHandler.updateEdge(edge);
        }

        this._svgHandler.updateMessage();
    }

    onMouseUp() {
        this.data.vec = null;
    }

    onEscape() {
        return this._controller().modi.MODE_SELECT;
    }

    disable() {
        d3.select("#rotate").classed("activeMode", false);
    }
}
