import SvgHandler from "./SvgHandler.js";

/**
 * Handles selection state for nodes and edges.
 * Manages single and rectangle selections and keeps SVG UI in sync.
 */
export default class SelectionHandler {
    constructor(svgHandler, graph) {
        this._svgHandler = svgHandler;
        this._graph = graph;
        this._nodes = new Map();
        this._edges = new Map();
        this._affectedEdges = new Map();
        this._rectActive = false;
        this._singleEdge = false;
    }

    // ----------- Getters -----------
    get singleEdge() {
        return this._singleEdge;
    }

    get selectedNodes() {
        return this._nodes.values();
    }

    get selectedEdges() {
        return this._edges.values();
    }

    get affectedEdges() {
        return this._affectedEdges.values();
    }

    // ----------- Queries -----------
    isAnySelected() {
        return this._nodes.size > 0 || this._edges.size > 0;
    }

    isNodeSelected(node) {
        return this._nodes.has(node.id);
    }

    isEdgeSelected(edge) {
        return this._edges.has(edge.id);
    }

    isEdgeAffected(edge) {
        return this._affectedEdges.has(edge.id);
    }

    isRectActive() {
        return this._rectActive;
    }

    // SELECTION LOGIC
    /** Select a single node (clears previous selection). */
    selectNode(node) {
        this.clear();

        this._nodes.set(node.id, node);
        this._svgHandler.selectNode(node, true);

        // Mark connected edges as affected
        node.adjacent.forEach(edge =>
            this._affectedEdges.set(edge.id, {edge, mod: node})
        );
    }

    /** Select a single edge (and its two nodes). */
    selectEdge(edge) {
        this.clear();
        this._edges.set(edge.id, edge);
        this._svgHandler.selectEdge(edge, true);

        const addNodeWithAffected = (node, mainEdge) => {
            this._nodes.set(node.id, node);

            const adj = node.adjacent;
            if (adj.length === 2) {
                const affected = adj[0] !== mainEdge ? adj[0] : adj[1];
                if (!this._affectedEdges.has(affected.id)) {
                    this._affectedEdges.set(affected.id, {edge: affected, mod: node});
                }
            }
        };

        addNodeWithAffected(edge.from, edge);
        addNodeWithAffected(edge.to, edge);

        this._singleEdge = true;
    }

    // RECTANGLE SELECTION LOGIC
    startRectSelection(start) {
        this.clear();
        this._start = start;
        this._moved = start;
        this._rectActive = true;

        this._svgHandler.setRectSelection(start, start);
        this._svgHandler.setRectSelectionVisible(true);
    }

    moveRectSelection(moved) {
        this._moved = moved;
        this._svgHandler.setRectSelection(this._start, moved);
    }

    endRectSelection() {
        const {_start: start, _moved: moved} = this;

        const xMin = Math.min(start.x, moved.x);
        const xMax = Math.max(start.x, moved.x);
        const yMin = Math.min(start.y, moved.y);
        const yMax = Math.max(start.y, moved.y);

        const isInside = (x, y) => x >= xMin && x <= xMax && y >= yMin && y <= yMax;

        this._graph.forEachNode(node => {
            const {x, y} = node.pos;
            if (!isInside(x, y)) return;

            this._nodes.set(node.id, node);
            this._svgHandler.selectNode(node, true);

            node.adjacent.forEach(edge => {
                const {from, to} = edge;
                const insideEdge =
                    isInside(from.pos.x, from.pos.y) && isInside(to.pos.x, to.pos.y);

                if (!this._edges.has(edge.id) && !this._affectedEdges.has(edge.id)) {
                    if (insideEdge) {
                        this._edges.set(edge.id, edge);
                        this._svgHandler.selectEdge(edge, true);
                    } else {
                        this._affectedEdges.set(edge.id, {edge, mod: node});
                    }
                }
            });
        });

        this._svgHandler.setRectSelectionVisible(false);
        this._rectActive = false;
    }

    cancelRectSelection() {
        this._svgHandler.setRectSelectionVisible(false);
        this._rectActive = false;
    }

    // UTILITIES
    /** Clear current selection and update the SVG display. */
    clear() {
        // Deselect all nodes
        this._nodes.forEach(node => this._svgHandler.selectNode(node, false));
        this._nodes.clear();

        // Deselect all edges
        this._edges.forEach(edge => this._svgHandler.selectEdge(edge, false));
        this._edges.clear();

        this._affectedEdges.clear();
        this._singleEdge = false;
    }
}
