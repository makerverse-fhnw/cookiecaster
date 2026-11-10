import intersections from "../handlers/Intersections.js";

const _eta = 1e-6; //precision
let _visited, _path, _A, _segments;

/**
 *
 * @param {Graph} graph
 * @returns {{forms: Array, segments: Array, intersections: Array}}
 */
export default function validateGraph(graph) {
    const forms = trace(Array.from(graph._nodes.values()));
    return {forms: forms, segments: _segments, intersections: intersections(_segments)}
}

/**
 * Traces all forms
 * @param {Node[]} nodes - list of all nodes in graph
 * @returns {Array}
 */
let trace = (nodes) => {
    _segments = [];
    const forms = [];
    if (nodes.length === 0) return forms;
    _visited = {};
    for (let i in nodes) {
        if (Object.prototype.hasOwnProperty.call(nodes, i)) {
            const node = nodes[i];
            if (!Object.prototype.hasOwnProperty.call(_visited, node.id)) {
                forms.push(traceForm(node));
            }
        }
    }
    return forms;
};

/**
 * Trace all nodes of a form
 * @param {Node} node - start node of form
 * @returns {{path: string, points: Array, closed: boolean, circDir: undefined, meta: {}}}
 */
let traceForm = (node) => {
    _visited[node.id] = true;
    const form = {
        path: "",
        points: [],
        closed: false,
        circDir: undefined,
        meta: {}
    };
    _path = [`M ${node.pos.x} ${node.pos.y}`];
    _A = 0;
    if (node.adjacent.length > 0) {
        //trace components
        let from = node;
        let edge = node.adjacent[0];
        let to = edge.getOtherNode(node);
        traceEdge(from.pos, to.pos, edge.q);
        while (to.adjacent.length === 2 && to !== node) {
            const n = to;
            _visited[n.id] = true;
            edge = n.adjacent[0].getOtherNode(n) !== from ?
                n.adjacent[0] :
                n.adjacent[1];
            to = edge.getOtherNode(n);
            from = n;
            traceEdge(from.pos, to.pos, edge.q);
        }
        _visited[to.id] = true;
        if (to === node) {
            //closed form
            form.closed = true;
            form.circDir = _A > 0 ? 'cw' : 'ccw';
            form.path = _path.join(' ') + "z";
            const pathMeta = calcPathMeta(form.path);
            form.points = pathMeta.points;
            form.meta = pathMeta.meta;
        } else if (node.adjacent.length === 2) {
            //trace other edges of start node to mark as visited
            from = node;
            edge = node.adjacent[1];
            to = edge.getOtherNode(node);
            while (to.adjacent.length === 2) {
                const n = to;
                _visited[n.id] = true;
                edge = n.adjacent[0].getOtherNode(n) !== from ?
                    n.adjacent[0] :
                    n.adjacent[1];
                to = edge.getOtherNode(n);
                from = n;
            }
            _visited[to.id] = true;
        }
    }
    return form;
};

/**
 * Adds an edge to path as svg element
 * @param {{x: number, y: number}} from - position of from node
 * @param {{x: number, y: number}} to - position of to node
 * @param {{x: number, y: number}} q - position of bézier point
 */
let traceEdge = (from, to, q) => {
    _path.push(`Q ${q.x} ${q.y} ${to.x} ${to.y}`);
    _A += (to.x + from.x) * (to.y - from.y);
};

/**
 * Calculates the bounding box, center, and polyline points of a path.
 * Uses only the browser’s native SVG API — no external libs.
 */
function calcPathMeta(path) {
    const contour = pathToPoints(path);
    if (!contour || contour.length === 0) return;

    const points = [];
    const plen = contour.length;
    let x1 = Number.MAX_VALUE, y1 = Number.MAX_VALUE, x2 = 0, y2 = 0;
    let cx = 0, cy = 0;

    for (let i = 0; i < plen - 1; i++) {
        const [p0x, p0y] = contour[i];
        const [p1x, p1y] = contour[i + 1];

        const dx = Math.abs(p0x - p1x);
        const dy = Math.abs(p0y - p1y);
        if (dx < _eta && dy < _eta) continue; // skip duplicates

        // bounding box
        x1 = Math.min(x1, p0x);
        x2 = Math.max(x2, p0x);
        y1 = Math.min(y1, p0y);
        y2 = Math.max(y2, p0y);

        // center
        cx += p0x;
        cy += p0y;

        points.push(contour[i]);
        _segments.push([[p0x, p0y], [p1x, p1y]]);
    }

    return {
        points,
        meta: {
            width: x2 - x1,
            height: y2 - y1,
            center: { x: cx / points.length, y: cy / points.length }
        }
    };
}
/**
 * Samples an SVG path string into [x, y] points using native DOM APIs.
 * @param {string} path
 * @returns {number[][]}
 */
function pathToPoints(path) {
    // Create a temporary in-memory <path> element
    const temp = document.createElementNS("http://www.w3.org/2000/svg", "path");
    temp.setAttribute("d", path);

    const total = temp.getTotalLength();
    const points = [];
    const step = 1; // sample every 1px

    for (let i = 0; i <= total; i += step) {
        const { x, y } = temp.getPointAtLength(i);
        points.push([x, y]);
    }
    return points;
}