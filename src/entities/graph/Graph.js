import Node from './Node.js'
import Edge from './Edge.js'
import validateGraph from '../../business-logic/graph-operations/Validation.js'
import analyzeGraph from '../../business-logic/graph-operations/Analysis.js'

export default class Graph {
    constructor(getSvgHandler) {
        this._getSvgHandler = getSvgHandler;
        this._nodes = new Map();
        this._edges = new Map();
    }

    backup() {
        this._backup = this.toJSON();
    }

    restore() {
        this.fromJSON(this._backup);
    }

    // ============ Nodes ============
    /**
     * Returns size of _nodes
     * @returns {number}
     */
    get nodeSize() {
        return this._nodes.size;
    }

    /**
     * Checks if the specified node id exists
     * @param {*} id - node id
     * @returns {boolean}
     */
    hasNode(id) {
        return this._nodes.has(id);
    }

    /**
     * Adds
     * @param {Node} node - node id
     */
    addNode(node) {
        this._getSvgHandler().addNode(node);
        this._nodes.set(node.id, node);
    };

    /**
     * Gets the defined node
     * @param {*} id - node id
     * @returns {Node}
     */
    getNode(id) {
        return this._nodes.get(id);
    }

    /**
     * Removes the specified node
     * Removes adjacent _edges
     * @param {Node} node
     */
    removeNode(node) {
        const adja = node.adjacent.slice(0);  //clone adjacent _edges
        adja.forEach(edge => {
            this.removeEdge(edge);
        });
        this._getSvgHandler().removeNode(node);
        this._nodes.delete(node.id);
    };

    /**
     * Iterates over each node
     * @param {function} callback - callback function
     */
    forEachNode(callback) {
        Array.from(this._nodes.values()).forEach(callback);
    }

    // ============ Edges ============
    /**
     * Returns size of _edges
     * @returns {number}
     */
    get edgeSize() {
        return this._edges.size;
    }

    /**
     * Checks if the specified edge id exists
     * @param {*} id - edge id
     * @returns {boolean}
     */
    hasEdge(id) {
        return this._edges.has(id);
    }

    /**
     * Creates and adds an edge
     * Registers edge to adjacent _nodes
     * @param {Edge} edge - edge
     */
    addEdge(edge) {
        this._getSvgHandler().addEdge(edge);
        this._edges.set(edge.id, edge);
    };

    /**
     * Gets the defined edge
     * @param {*} id - edge id
     * @returns {Edge}
     */
    getEdge(id) {
        return this._edges.get(id);
    }

    /**
     * Removes the specified edge
     * Unregister from adjacent _nodes
     * @param {Edge} edge - edge
     */
    removeEdge(edge) {
        this._getSvgHandler().removeEdge(edge);
        edge.removeFromAdjacentNode();
        this._edges.delete(edge.id);
    };

    /**
     * Iterates over each edge
     * @param {function} callback - callback function
     */
    forEachEdge(callback) {
        Array.from(this._edges.values()).forEach(callback);
    }

    /**
     * Clears the complete graph
     */
    clear() {
        this._getSvgHandler().clear();
        this._nodes.clear();
        this._edges.clear();
    };

    // ============ Graph functions ============
    validate() {
        return validateGraph(this);
    }

    analyze(data, crit) {
        return analyzeGraph(this, data, crit);
    }

    /**
     * Converts the graph into a non-cyclic object
     *
     * @returns {string}
     */
    toJSON() {
        const graph = {nodes: [], edges: []};
        this.forEachNode(node => {
            graph.nodes.push({id: node.id, pos: node.pos});
        });
        this.forEachEdge(edge => {
            graph.edges.push({id: edge.id, from: edge.from.id, to: edge.to.id, q: edge.q});
        });
        return JSON.stringify(graph);
    }

    /**
     * Loads the graph from an non-cyclic json object
     *
     * @param {string} json - graph
     */
    fromJSON(json) {
        this.clear();
        const obj = JSON.parse(json);
        let nid = 0;
        let eid = 0;
        obj.nodes.forEach(node => {
            const n = new Node(node.id, node.pos);
            this.addNode(n);
            if (node.id > nid) {
                nid = node.id;
            }
        });
        obj.edges.forEach(edge => {
            const from = this.getNode(edge.from);
            const to = this.getNode(edge.to);
            const e = new Edge(edge.id, from, to, edge.q);
            this.addEdge(e);
            if (edge.id > 0) {
                eid = edge.id;
            }
        });
        this._getSvgHandler().nodeID = nid + 1;
        this._getSvgHandler().edgeID = eid + 1;
    }

    fromSvg(forms) {
        this.clear();
        for (let j = 0; j < forms.length; j++) {
            const segments = forms[j].split(' Q ');
            const n = segments.length - 1;
            let segment = segments[0];
            let valStr = segment.split(' ');
            let pos = {x: Number.parseFloat(valStr[0]), y: Number.parseFloat(valStr[1])};
            const origin = new Node(this._getSvgHandler().nodeID++, pos);
            let from = origin;
            let q;
            let to;
            let edge;
            this.addNode(from);

            for (let i = 1; i < n; i++) {
                segment = segments[i];
                valStr = segment.split(' ');
                pos = {x: Number.parseFloat(valStr[2]), y: Number.parseFloat(valStr[3])};
                q = {x: Number.parseFloat(valStr[0]), y: Number.parseFloat(valStr[1])};
                to = new Node(this._getSvgHandler().nodeID++, pos);
                this.addNode(to);
                edge = new Edge(this._getSvgHandler().edgeID++, from, to, q);
                this.addEdge(edge);
                from = to;
            }

            segment = segments[n];
            valStr = segment.split(' ');
            q = {x: Number.parseFloat(valStr[0]), y: Number.parseFloat(valStr[1])};
            const ex = Number.parseFloat(valStr[2]);
            const ey = Number.parseFloat(valStr[3]);
            if (origin.pos.x === ex && origin.pos.y === ey) {
                //closed path
                edge = new Edge(this._getSvgHandler().edgeID++, from, origin, q);
            } else {
                //not closed path
                to = new Node(this._getSvgHandler().nodeID++, {x: ex, y: ey});
                this.addNode(to);
                edge = new Edge(this._getSvgHandler().edgeID++, from, to, q);
            }
            this.addEdge(edge);
        }
    }
}