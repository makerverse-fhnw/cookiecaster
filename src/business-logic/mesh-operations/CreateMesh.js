/**
 * @author Claudio
 * @date 03.07.2018
 * @version 1.1
 */

import {Vec2, Vec3} from '../../entities/mesh/Vec.js'
import interections from '../handlers/Intersections.js';

let _mesh, _vertices, _cws;
/**
 * Creates a mesh structure for *.stl export
 *
 * @param {*} data - designed forms
 * @param {number} thickness
 * @param {number} height
 * @param {string} name
 * @returns {{description: *, facets: Array}}
 */

export default function createMesh(data, thickness, height, name) {
    //mesh object structure for stl-lib
    _mesh = {
        description: name,
        facets: []
    };

    const forms = data.forms;
    _cws = Array(forms.length);
    _vertices = Array(forms.length === 1 ? 1 : 3);
    //discrete svg into 2D vectors
    for (let j = 0; j < forms.length; j++) {
        const form = forms[j];
        const points = form.points;
        const origin = new Vec2(points[0][0], points[0][1]);
        const inner = [];
        for (let i = 0; i < points.length - 1; i++) {
            const p0 = {x: points[i][0], y: points[i][1]};
            const p1 = {x: points[i + 1][0], y: points[i + 1][1]};
            inner.push(new Vec2((p1.x - p0.x), (p1.y - p0.y)));
        }
        const cw = form.circDir === "cw";
        if (data.outer === undefined || data.outer === j) {
            //outer form
            _cws[0] = cw;
            _vertices[0] = createOuterVertices(thickness, height, origin, inner);
        } else {
            //inner form
            _cws[1] = cw;
            _vertices[1] = createInnerVertices(thickness, height, origin, inner);
            _vertices[2] = createConnectionVertices(data, thickness);
        }
    }

    if (forms.length === 1) {
        createMeshSingleForm();
    } else {
        createMeshIOForm();
    }

    return _mesh;
}

/**
 *
 * @param {Vec2} p - origin
 * @param {Vec2} a - vector to p
 * @param {Vec2} b - vector from p
 * @param {number[]} ts - thickness
 * @param {boolean} cw - parse clockwise
 * @returns {Vec2[]}
 */
let calcQ = (p, a, b, ts, cw) => {
    const bend = Math.sign(a.x * b.y - a.y * b.x);
    if (bend !== 0) {
        const q = Vec2.ZERO.sub(a.normalize()).add(b.normalize()).normalize();
        const a2 = bend < 0 ? new Vec2(-a.y, a.x) : new Vec2(a.y, -a.x);
        const dt = 1 / (q.dot(a2) / (q.length() * a2.length()));
        return ts.map(t => {
            if (!cw) t *= -1;
            return p.add(q.scale(bend * t * dt ));
        });
    } else {
        const a2 = cw ? new Vec2(a.y, -a.x) : new Vec2(-a.y, a.x);
        return ts.map(t => p.add(a2.normalize().scale(t)));
    }
};

let createOuterVertices = (thickness, height, origin, inner) => {
    const verts = [[], [], [], [], [], []];

    let ts = [thickness, 2 * thickness];
    const n = inner.length;

    let p = origin;
    let a = inner[n - 1];
    let b = inner[0];
    let Q = calcQ(p, a, b, ts, _cws[0]);
    verts[0].push(p.toVec3());
    verts[1].push(p.toVec3(height));
    verts[2].push(Q[0].toVec3(height));
    verts[3].push(Q[0].toVec3(thickness));
    verts[4].push(Q[1].toVec3(thickness));
    verts[5].push(Q[1].toVec3(0));

    for (let i = 1; i < n; i++) {
        p = p.add(b);
        a = inner[i - 1];
        b = inner[i];
        let Q = calcQ(p, a, b, ts, _cws[0]);
        verts[0].push(p.toVec3());
        verts[1].push(p.toVec3(height));
        verts[2].push(Q[0].toVec3(height));
        verts[3].push(Q[0].toVec3(thickness));
        verts[4].push(Q[1].toVec3(thickness));
        verts[5].push(Q[1].toVec3(0));
    }

    return verts;
};

let createInnerVertices = (thickness, height, origin, inner) => {
    const verts = [[], [], [], []];

    let ts = [thickness];
    const n = inner.length;

    let p = origin;
    let a = inner[n - 1];
    let b = inner[0];
    let Q = calcQ(p, a, b, ts, !_cws[1]);
    verts[0].push(p.toVec3());
    verts[1].push(p.toVec3(height));
    verts[2].push(Q[0].toVec3(height));
    verts[3].push(Q[0].toVec3(0));

    for (let i = 1; i < n; i++) {
        p = p.add(b);
        a = inner[i - 1];
        b = inner[i];
        let Q = calcQ(p, a, b, ts, !_cws[1]);
        verts[0].push(p.toVec3());
        verts[1].push(p.toVec3(height));
        verts[2].push(Q[0].toVec3(height));
        verts[3].push(Q[0].toVec3(0));
    }

    return verts;
};


let createConnectionVertices = (data, t) => {
    const segments = data.segments.splice(0, data.segments.length)
        .map(s => [[s[0][0], s[0][1]], [s[1][0], s[1][1]]]);
    const center = data.forms[data.outer === 0 ? 1 : 0].meta.center;
    const x = center.x;
    const y = center.y;
    segments.push([[-1, y], [601, y]]);

    const intersections = interections(segments);
    intersections.sort((a, b) => a[0] - b[0]);
    let idx = 0;
    for(let i = 0; i < intersections.length - 1; i++) {
        if (intersections[i][0] > x) {
            idx = i;
        }
    }
    const x1 = intersections[0][0];
    const x2 = intersections[idx - 1][0];
    const x3 = intersections[idx][0];
    const x4 = intersections[intersections.length - 1][0];
    const verts = [[], [], [], []];
    verts[0].push(new Vec3(x1 - t, y - t, 0));
    verts[0].push(new Vec3(x1 - t, y - t, t));
    verts[0].push(new Vec3(x1 - t, y + t, t));
    verts[0].push(new Vec3(x1 - t, y + t, 0));

    verts[1].push(new Vec3(x2 + t, y - t, 0));
    verts[1].push(new Vec3(x2 + t, y - t, t));
    verts[1].push(new Vec3(x2 + t, y + t, t));
    verts[1].push(new Vec3(x2 + t, y + t, 0));

    verts[2].push(new Vec3(x3 - t, y - t, 0));
    verts[2].push(new Vec3(x3 - t, y - t, t));
    verts[2].push(new Vec3(x3 - t, y + t, t));
    verts[2].push(new Vec3(x3 - t, y + t, 0));

    verts[3].push(new Vec3(x4 + t, y - t, 0));
    verts[3].push(new Vec3(x4 + t, y - t, t));
    verts[3].push(new Vec3(x4 + t, y + t, t));
    verts[3].push(new Vec3(x4 + t, y + t, 0));

    return verts;
};

/**
 * Creates a facet for the mesh structure
 * a-b-c must be right hand ordered
 *
 * @param {Vec3} n - normal vector
 * @param {Vec3} a - first vertex of triangle
 * @param {Vec3} b - second vertex of triangle
 * @param {Vec3} c - third vertex of triangle
 * @returns {{normal: number[], verts: number[][]}}
 */
let createFacet = (n, a, b, c) => {
    return {
        normal: [n.x, n.y, n.z],
        verts: [
            [a.x, a.y, a.z],
            [b.x, b.y, b.z],
            [c.x, c.y, c.z]
        ]
    }
};

/**
 *
 * @param vert1
 * @param vert2
 * @param [normal]
 */
let createFace = (vert1, vert2, orientation, normal = Vec3.ZERO) => {
    /*
triangle vertices are right hand ordered
normal is redundant, let software calculate normal by right hand order
 */
    const n = vert1.length;
    for (let i = 0; i < n; i++) {
        const i2 = (i + 1) % n;
        const a = vert1[i];
        const b = vert2[i2];
        const c = vert1[i2];
        const d = vert2[i];

        if (orientation) {
            _mesh.facets.push(createFacet(normal, a, b, c));
            _mesh.facets.push(createFacet(normal, a, d, b));
        } else {
            _mesh.facets.push(createFacet(normal, a, b, d));
            _mesh.facets.push(createFacet(normal, a, c, b));
        }
    }
};

/**
 * Creates a mesh from a single outer form
 */
let createMeshSingleForm = () => {
    //const normal = Vec3.ZERO;
    const verts = _vertices[0];

    /*
    Vertices arrangement:
     1 - 2
     |   |
     |   |
     |   3 - 4
     |       |
     0 - - - 5
    <- inside
    outside ->
     */

    //create
    createFace(verts[0], verts[1], _cws[0]);
    createFace(verts[2], verts[3], _cws[0]);
    createFace(verts[4], verts[5], _cws[0]);

    createFace(verts[1], verts[2], _cws[0]);
    createFace(verts[3], verts[4], _cws[0]);
    createFace(verts[5], verts[0], _cws[0]);
};

let createMeshIOForm = () => {
    //const normal = Vec3.ZERO;
    /*
    outer form:
    1 - 2
    |   |
    |   |
    |   3 - 4
    |       |
    0 - - - 5
    <- inner form
    outside ->
    */
    const outerVerts = _vertices[0];
    createFace(outerVerts[0], outerVerts[1], !_cws[0]);
    createFace(outerVerts[2], outerVerts[3], !_cws[0]);
    createFace(outerVerts[4], outerVerts[5], !_cws[0]);

    createFace(outerVerts[1], outerVerts[2], _cws[0]);
    createFace(outerVerts[3], outerVerts[4], _cws[0]);
    createFace(outerVerts[5], outerVerts[0], !_cws[0]);
    /*
    inner form:
    2 - 1
    |   |
    |   |
    |   |
    |   |
    3 - 0
    <- inside
    outer form ->
    */
    const innerVerts = _vertices[1];
    createFace(innerVerts[0], innerVerts[1], _cws[1]);
    createFace(innerVerts[2], innerVerts[3], _cws[1]);

    createFace(innerVerts[1], innerVerts[2], !_cws[1]);
    createFace(innerVerts[3], innerVerts[0], _cws[1]);

    /*
    connection:
    */
    const connVerts = _vertices[2];
    createFace(connVerts[0], connVerts[1], false);
    createFace(connVerts[2], connVerts[3], false);
};