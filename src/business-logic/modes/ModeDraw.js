import * as d3 from "d3";
import AbstractMode from "./AbstractMode.js";
import Node from '../../entities/graph/Node.js'
import Edge from '../../entities/graph/Edge.js'

export default class ModeDraw extends AbstractMode {
    constructor({controller, svgHandler, selectionHandler, graph}) {
        super();
        this._controller = controller;
        this._svgHandler = svgHandler;
        this._selectionHandler = selectionHandler;
        this._graph = graph;
        this._prev = undefined;
    }

    get prev() {
        return this._prev
    }

    set prev(value) {
        this._prev = value;
        if (value !== undefined) {
            this._svgHandler.resetMoveEdge(value.pos);
        }
    }

    enable() {
        d3.select("#draw").classed("activeMode", true);
        this.enableButtons({move: false, rotate: false, copy: false, mirror: false, erase: false});
        this._selectionHandler.clear();
    }

    onMouseDown(point) {
        const focus = this._svgHandler.focus;
        if (this.prev !== undefined) {
            if (focus.obj !== undefined && focus.type === "node") {
                if (focus.obj !== this.prev) {
                    const an = focus.obj.adjacent.length;
                    if (an < 2) {
                        const eid = this._svgHandler.edgeID++;
                        const edge = new Edge(eid, this.prev, focus.obj);
                        this._graph.addEdge(edge);
                        this.prev = focus.obj;
                        if (focus.obj.adjacent.length === 2) {
                            return this._controller().modi.MODE_SELECT;
                        }
                        this.prev = focus.obj;
                    } else if (an === 2) {
                        return this._controller().modi.MODE_SELECT;
                    }
                } else {
                    return this._controller().modi.MODE_SELECT;
                }
            } else if (focus.obj === undefined) {
                const eid = this._svgHandler.edgeID++;
                const nid = this._svgHandler.nodeID++;
                const node = new Node(nid, point);
                this._graph.addNode(node);
                const edge = new Edge(eid, this.prev, node);
                this._graph.addEdge(edge);
                this.prev = node;
            }
        } else {
            if (focus.obj !== undefined && focus.type === "node" && focus.obj.adjacent.length < 2) {
                this.prev = focus.obj;
                this._svgHandler.setMoveEdgeVisible(true);
            } else if (focus.obj === undefined) {
                const nid = this._svgHandler.nodeID++;
                const node = new Node(nid, point);
                this._graph.addNode(node);
                this.prev = node;
                this._svgHandler.setMoveEdgeVisible(true);
            }
        }
        this._svgHandler.updateMessage();
    }

    onMouseMove(point) {
        const focus = this._svgHandler.focus;
        if (this.prev !== undefined)
            this._svgHandler.setMoveEdgeTo(focus.obj !== undefined && focus.type === "node" ? focus.obj.pos : point);
    }

    onEscape() {
        return this._controller().modi.MODE_SELECT;
    }

    disable() {
        d3.select("#draw").classed("activeMode", false);
        this.prev = undefined;
        this._svgHandler.setMoveEdgeVisible(false);
    }
}