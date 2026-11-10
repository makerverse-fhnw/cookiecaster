import Node from "../../entities/graph/Node.js";
import Edge from "../../entities/graph/Edge.js";

export default class Controller {
    constructor({svgHandler, selectionHandler, graph}) {
        this.svgHandler = svgHandler;
        this.selectionHandler = selectionHandler;
        this.graph = graph;
        this.modi = {};
        this._mode = null;
        this._grid = true;
    }

    setModes(modes) {
        this.modi = modes;
        if (!this._mode) this.mode = this.modi.MODE_DRAW;
    }

    // --- Grid toggle ---
    get grid() {
        return this._grid;
    }

    set grid(active) {
        this._grid = Boolean(active);
    }

    // --- Mode handling ---
    get mode() {
        return this._mode;
    }

    set mode(newMode) {
        if (newMode === this._mode) return;
        if (this._mode && typeof this._mode.disable === "function") {
            this._mode.disable();
        }
        this._mode = newMode;
        if (this._mode && typeof this._mode.enable === "function") {
            this._mode.enable();
        }
    }

    // UTILITY METHODS
    /** Snaps point to grid and clamps to drawing area boundaries */
    fixAndSnapPoint(point) {
        const space = this.svgHandler.getRasterSpace();
        const size = this.svgHandler.getDrawingAreaSize();

        if (this._grid) {
            const snap = Math.floor(space / 2);
            point.x = Math.floor(point.x / space) * space + (point.x % space > snap ? space : 0);
            point.y = Math.floor(point.y / space) * space + (point.y % space > snap ? space : 0);
        }

        // Clamp inside boundaries
        point.x = Math.min(Math.max(point.x, space), size - space);
        point.y = Math.min(Math.max(point.y, space), size - space);
    }

    // MOUSE INTERACTIONS

    mouseDown(point) {
        if (!this.selectionHandler.isRectActive()) this.fixAndSnapPoint(point);
        this._transition(this._mode.onMouseDown(point));
    }

    mouseMove(point) {
        if (!this.selectionHandler.isRectActive()) this.fixAndSnapPoint(point);
        this._transition(this._mode.onMouseMove(point));
    }

    mouseUp() {
        this._transition(this._mode.onMouseUp());
    }

    /** Helper to safely change mode if a function returns a new one */
    _transition(nextMode) {
        if (nextMode !== undefined) this.mode = nextMode;
    }

    // COMMANDS

    /** Clears graph and resets to draw mode */
    reset() {
        this.graph.clear();
        this.svgHandler.clear();
        this.mode = this.modi.MODE_DRAW;
    }

    /** Deletes selected elements */
    erase() {
        for (const edge of this.selectionHandler.selectedEdges) this.graph.removeEdge(edge);

        if (!this.selectionHandler.singleEdge) {
            for (const {edge} of this.selectionHandler.affectedEdges) this.graph.removeEdge(edge);
            for (const node of this.selectionHandler.selectedNodes) this.graph.removeNode(node);
        }

        this.selectionHandler.clear();
        this.svgHandler.updateMessage("");
        this.mode = this.graph.nodeSize > 0 ? this.modi.MODE_SELECT : this.modi.MODE_DRAW;
    }

    /** Duplicates selected elements, offsetting them by 5 raster spaces */
    copy() {
        const dx = this.svgHandler.getRasterSpace() * 5;
        const dy = this.svgHandler.getRasterSpace() * 5;

        const selNodes = Array.from(this.selectionHandler.selectedNodes);
        const selEdges = Array.from(this.selectionHandler.selectedEdges);
        if (!selNodes.length && !selEdges.length) {
            console.log("Copy: nothing selected");
            return;
        }

        this.selectionHandler.clear();
        const cNodes = {};

        // Copy nodes
        for (const sn of selNodes) {
            const node = new Node(this.svgHandler.nodeID++, {x: sn.pos.x + dx, y: sn.pos.y + dy});
            this.graph.addNode(node);
            this.selectionHandler._nodes.set(node.id, node);
            this.svgHandler.selectNode(node, true);
            cNodes[sn.id] = node;
        }

        // Copy edges
        for (const se of selEdges) {
            const from = cNodes[se.from.id];
            const to = cNodes[se.to.id];
            if (!from || !to) continue;

            const edge = new Edge(this.svgHandler.edgeID++, from, to, {x: se.q.x + dx, y: se.q.y + dy});
            this.graph.addEdge(edge);
            this.selectionHandler._edges.set(edge.id, edge);
            this.svgHandler.selectEdge(edge, true);
        }

        this.svgHandler.updateMessage();
        this.mode = this.modi.MODE_MOVE;
    }

    /** Mirrors selected elements along the line between two “tail” nodes */
    mirror() {
        const tails = [];
        for (const sn of this.selectionHandler.selectedNodes) {
            if (sn.adjacent.length === 1) tails.push(sn);
            if (sn.adjacent.length === 0) return;
        }
        if (tails.length !== 2) return;

        const [p1, p2] = tails.map(t => t.pos);
        const vec = {x: p2.x - p1.x, y: p2.y - p1.y};
        const invLen2 = 1 / (vec.x * vec.x + vec.y * vec.y);
        const cNodes = {};

        // Mirror nodes
        for (const sn of this.selectionHandler.selectedNodes) {
            if (tails.includes(sn)) {
                cNodes[sn.id] = sn;
                continue;
            }

            const {x, y} = sn.pos;
            const lambda = (vec.x * (x - p1.x) + vec.y * (y - p1.y)) * invLen2;
            const fx = p1.x + lambda * vec.x;
            const fy = p1.y + lambda * vec.y;
            const node = new Node(this.svgHandler.nodeID++, {
                x: x + 2 * (fx - x),
                y: y + 2 * (fy - y),
            });

            this.graph.addNode(node);
            cNodes[sn.id] = node;
        }

        // Mirror edges
        for (const se of this.selectionHandler.selectedEdges) {
            const {x, y} = se.q;
            const lambda = (vec.x * (x - p1.x) + vec.y * (y - p1.y)) * invLen2;
            const fx = p1.x + lambda * vec.x;
            const fy = p1.y + lambda * vec.y;
            const edge = new Edge(
                this.svgHandler.edgeID++,
                cNodes[se.from.id],
                cNodes[se.to.id],
                {x: x + 2 * (fx - x), y: y + 2 * (fy - y)}
            );
            this.graph.addEdge(edge);
        }

        this.selectionHandler.clear();
        this.svgHandler.updateMessage();
        this.mode = this.modi.MODE_SELECT;
    }

    /** Escape key handler */
    escape() {
        this._transition(this._mode.onEscape());
    }
}