import * as d3 from "d3";

/**
 * @author Sadik Hrnjica
 * @date 16.10.2025
 * @version 1.0
 */

const DRAWING_AREA_GRID_RASTER_SPACE = 6;
const DRAWING_AREA_SIZE = 240;
const ZOOM_LEVELS = [1.0, 1.2, 1.5, 2.0, 3.0];

let rect = (p1, p2) => {
    const w = p2.x - p1.x;
    const h = p2.y - p1.y;
    return `M${p1.x} ${p1.y} l ${w} 0 l 0 ${h} l ${-w} 0 z`;
};

export default class SvgHandler {
    constructor(getGraph) {
        this._getGraph = getGraph;
        this._radius = 3;
        this.focus = { obj: undefined, type: "" };
        this._zoomLevel = 1;
        this.nodeID = 0;
        this.edgeID = 0;

        const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        this._e = {
            enter: isTouch ? "pointerover" : "mouseenter",
            leave: isTouch ? "pointerout" : "mouseleave",
        };
    }

    getRasterSpace() { return DRAWING_AREA_GRID_RASTER_SPACE; }
    getDrawingAreaSize() { return DRAWING_AREA_SIZE; }
    getZoomLevels() { return ZOOM_LEVELS; }
    getZoomLevel() { return this._zoomLevel; }

    setZoomLevel(level) {
        this._zoomLevel = level;
        this.updateMessage();
    }

    resetMoveEdge(point) {
        d3.select("#moveEdge")
            .attr("x1", point.x)
            .attr("y1", point.y)
            .attr("x2", point.x)
            .attr("y2", point.y);
    }

    setMoveEdgeTo(to) {
        d3.select("#moveEdge")
            .attr("x2", to.x)
            .attr("y2", to.y);
    }

    setMoveEdgeVisible(visible) {
        d3.select("#moveEdge").attr(
            "visibility",
            visible ? "visible" : "hidden"
        );
    }

    setRectSelection(start, end) {
        d3.select("#selectionRect").attr("d", rect(start, end));
    }

    setRectSelectionVisible(visible) {
        d3.select("#selectionRect").attr(
            "visibility",
            visible ? "visible" : "hidden"
        );
    }

    /**
     * Adds a new node
     *
     * @param {Node} node - node object
     */
    addNode(node) {
        d3.select("#nodes")
            .append("circle")
            .attr("id", `n${node.id}`)
            .attr("r", this._radius)
            .attr("cx", node.pos.x)
            .attr("cy", node.pos.y)
            .on(this._e.enter, () => { this.focus = { obj: node, type: "node" }; })
            .on(this._e.leave, () => { this.focus.obj = undefined; });
    }

    /**
     * Updates an existing node
     *
     * @param {Node} node - node object
     */
    updateNode(node) {
        d3.select(`#n${node.id}`)
            .attr("cx", node.pos.x)
            .attr("cy", node.pos.y);
    }

    /**
     * Updates an existing node
     *
     * @param {*} node - node object
     * @param {*} node.id - node id
     * @param {*} node.pos - node position
     * @param {number} node.pos.x - node x coordinate
     * @param {number} node.pos.y - node y coordinate
     * @param {boolean} value - true if selected, otherwise hidden,
     */
    selectNode(node, value) {
        d3.select(`#n${node.id}`).classed("circleSelected", value);
    }

    /**
     * Removes an existing node
     *
     * @param {Node} node - node object
     */
    removeNode(node) {
        d3.select(`#n${node.id}`).remove();
    }

    setQEdgeVisibility(visible) {
        d3.selectAll(".qEdge").attr(
            "visibility",
            visible ? "visible" : "hidden"
        );
    }

    /**
     * Add a new edge
     *
     * @param {Edge} edge - edge object
     */
    setQEdge(edge) {
        d3.select("#qEdge1")
            .attr("x1", edge.from.pos.x)
            .attr("y1", edge.from.pos.y)
            .attr("x2", edge.q.x)
            .attr("y2", edge.q.y);
        d3.select("#qEdge2")
            .attr("x1", edge.to.pos.x)
            .attr("y1", edge.to.pos.y)
            .attr("x2", edge.q.x)
            .attr("y2", edge.q.y);
    }

    /**
     * Add a new edge
     *
     * @param {Edge} edge - edge object
     */
    addEdge(edge) {
        d3.select("#edges")
            .append("path")
            .attr("id", `e${edge.id}`)
            .attr("d", edge.asSvgPath())
            .on(this._e.enter, () => {
                this.focus = { obj: edge, type: "edge" };
                // Preview des gelben Punktes beim Hovern über die Kante anzeigen
                d3.select(`#q${edge.id}`).attr("visibility", "visible");
            })
            .on(this._e.leave, () => {
                this.focus.obj = undefined;
                // Preview des gelben Punktes ausblenden, wenn nicht selektiert
                const isSelected = d3.select(`#e${edge.id}`).classed("pathSelected");
                if (!isSelected) {
                    d3.select(`#q${edge.id}`).attr("visibility", "hidden");
                }
            });

        d3.select("#edges")
            .append("circle")
            .attr("id", `q${edge.id}`)
            .attr("r", this._radius)
            .attr("cx", edge.q.x)
            .attr("cy", edge.q.y)
            .attr("visibility", "hidden")
            .classed("qCircle", true)
            .on(this._e.enter, () => {
                this.focus = { obj: edge, type: "q" };
                d3.select(`#q${edge.id}`).attr("visibility", "visible");
            })
            .on(this._e.leave, () => {
                const isSelected = d3.select(`#e${edge.id}`).classed("pathSelected");
                if (!isSelected) {
                    d3.select(`#q${edge.id}`).attr("visibility", "hidden");
                }
                this.focus.obj = undefined;
            });
    }

    /**
     * Updates an existing edge
     *
     * @param {Edge} edge - edge object
     */
    updateEdge(edge) {
        d3.select(`#e${edge.id}`).attr("d", edge.asSvgPath());
        d3.select(`#q${edge.id}`)
            .attr("cx", edge.q.x)
            .attr("cy", edge.q.y);
    }

    /**
     * Removes an existing edge
     *
     * @param {Edge} edge - edge object
     */
    removeEdge(edge) {
        d3.select(`#e${edge.id}`).remove();
        d3.select(`#q${edge.id}`).remove();
    }

    /**
     * Selects an existing edge
     *
     * @param {Edge} edge - edge object
     * @param {boolean} value - true if visible, otherwise hidden
     */
    selectEdge(edge, value) {
        d3.select(`#e${edge.id}`).classed("pathSelected", value);
        d3.select(`#q${edge.id}`).attr(
            "visibility",
            value ? "visible" : "hidden"
        );
    }

    setCritNodes(nodes) {
        const warnings = d3.select("#warnings");
        nodes.forEach((node) => {
            warnings
                .append("circle")
                .attr("cx", node.pos.x)
                .attr("cy", node.pos.y)
                .attr("r", 7)
                .classed("eCircle", true);
        });
    }

    setCritSeg(segs) {
        const warnings = d3.select("#warnings");
        segs.forEach((seg) => {
            warnings
                .append("line")
                .attr("x1", seg.p1[0])
                .attr("y1", seg.p1[1])
                .attr("x2", seg.p2[0])
                .attr("y2", seg.p2[1])
                .classed("eSeg", true);
        });
    }

    setIntersections(points) {
        const warnings = d3.select("#warnings");
        points.forEach((p) => {
            warnings
                .append("circle")
                .attr("cx", p[0])
                .attr("cy", p[1])
                .attr("r", 7)
                .classed("eCircle", true);
        });
    }

    getActZoomValue() {
        return ZOOM_LEVELS[this._zoomLevel-1]
    }

    updateMessage() {
        let minX = DRAWING_AREA_SIZE;
        let maxX = 0;
        let minY = DRAWING_AREA_SIZE;
        let maxY = 0;
        this._getGraph().forEachNode(node => {
            minX = (node.pos.x < minX) ? node.pos.x : minX;
            maxX = (node.pos.x > maxX) ? node.pos.x : maxX;
            minY = (node.pos.y < minY) ? node.pos.y : minY;
            maxY = (node.pos.y > maxY) ? node.pos.y : maxY;
        });
        this._getGraph().forEachEdge(edge => {
            let xmin = 0.5*(edge.to.pos.x + edge.q.x)
            minX = (xmin < minX )? xmin : minX;
            let xmax = 0.5*(edge.to.pos.x + edge.q.x)
            maxX = (xmax > maxX) ? xmax : maxX;

            xmin = 0.5*(edge.from.pos.x + edge.q.x)
            minX = (xmin < minX )? xmin : minX;
            xmax = 0.5*(edge.from.pos.x + edge.q.x)
            maxX = (xmax > maxX) ? xmax : maxX;

            let ymin = 0.5*(edge.to.pos.y + edge.q.y)
            minY = (ymin < minY) ? ymin : minY;
            let ymax = 0.5*(edge.to.pos.y + edge.q.y)
            maxY = (ymax > maxY) ? ymax : maxY;

            ymin = 0.5*(edge.from.pos.y + edge.q.y)
            minY = (ymin < minY) ? ymin : minY;
            ymax = 0.5*(edge.from.pos.y + edge.q.y)
            maxY = (ymax > maxY) ? ymax : maxY;
        });
        const deltaX = (maxX - minX) / ZOOM_LEVELS[this._zoomLevel-1];
        const deltaY = (maxY - minY) / ZOOM_LEVELS[this._zoomLevel-1];
        let mesg1 = "";
        let mesg2 = "";
        if (deltaX>=0 && deltaY>=0) {
            mesg1 = "Δx=" + (deltaX / 10.0).toFixed(1) + "cm";
            mesg2 = "Δy=" + (deltaY / 10.0).toFixed(1) + "cm";
        }
        d3.select("#message1").text(mesg1)
            .attr("x",3)
            .attr("y",8)
            .attr("class", "noselect");
        d3.select("#message2").text(mesg2)
            .attr("x",3)
            .attr("y",18)
            .attr("class", "noselect");
    }

    clearWarnings() {
        d3.select("#warnings").selectAll("*").remove();
    }

    /**
     * Removes all svg elements
     */
    clear() {
        this.clearWarnings();
        this.nodeID = 0;
        this.edgeID = 0;
        this.focus.obj = undefined;
        d3.select("#nodes").selectAll("*").remove();
        d3.select("#edges").selectAll("*").remove();
        this.updateMessage("");
    }
}
