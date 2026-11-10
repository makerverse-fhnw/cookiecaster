// CreateMesh.test.js (ESM, Node env, NO jsdom)

import { describe, test, expect, jest, beforeEach } from '@jest/globals';

let createMesh;
let intersectionsMock;

// ---------- Minimal Vec2/Vec3 mocks with real-ish math ----------
class Vec2 {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  static ZERO = new Vec2(0, 0);

  add(v) {
    return new Vec2(this.x + v.x, this.y + v.y);
  }
  sub(v) {
    return new Vec2(this.x - v.x, this.y - v.y);
  }
  scale(s) {
    return new Vec2(this.x * s, this.y * s);
  }
  length() {
    return Math.hypot(this.x, this.y);
  }
  normalize() {
    const len = this.length();
    if (len === 0) return new Vec2(0, 0);
    return new Vec2(this.x / len, this.y / len);
  }
  dot(v) {
    return this.x * v.x + this.y * v.y;
  }
  toVec3(z = 0) {
    return new Vec3(this.x, this.y, z);
  }
}

class Vec3 {
  constructor(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
  static ZERO = new Vec3(0, 0, 0);
}

// Helper: facets count per createFace call is 2 * n where n = number of verts in ring
const expectedFacetsForCreateFaceCalls = (n, faceCalls) => 2 * n * faceCalls;

async function loadFresh() {
  jest.resetModules();

  // Mock Vec module used by CreateMesh.js: import {Vec2, Vec3} from '../../entities/mesh/Vec.js' :contentReference[oaicite:2]{index=2}
  await jest.unstable_mockModule('../../src/entities/mesh/Vec.js', () => ({
    __esModule: true,
    Vec2,
    Vec3,
  }));

  // Mock intersections dependency: import interections from '../handlers/Intersections.js' :contentReference[oaicite:3]{index=3}
  await jest.unstable_mockModule('../../src/business-logic/handlers/Intersections.js', () => {
    intersectionsMock = jest.fn();
    return { __esModule: true, default: intersectionsMock };
  });

  ({ default: createMesh } = await import('../../src/business-logic/mesh-operations/CreateMesh.js'));
}

beforeEach(async () => {
  jest.clearAllMocks();
  await loadFresh();
});

describe('createMesh (CreateMesh.js) - Node env, no jsdom', () => {
  test('single form (outer only): produces mesh with correct description and facet count', () => {
    // Square (closed): inner vectors count n = points.length-1 = 4
    const data = {
      forms: [
        {
          circDir: 'cw',
          points: [
            [0, 0],
            [10, 0],
            [10, 10],
            [0, 10],
            [0, 0],
          ],
          meta: { center: { x: 5, y: 5 } },
        },
      ],
      segments: [],
      outer: 0,
    };

    const thickness = 2;
    const height = 5;
    const name = 'single';

    const mesh = createMesh(data, thickness, height, name);

    expect(mesh.description).toBe(name);
    expect(Array.isArray(mesh.facets)).toBe(true);

    // createMeshSingleForm calls createFace 6 times :contentReference[oaicite:4]{index=4}
    // each createFace with n=4 adds 2*n=8 facets => total 48
    expect(mesh.facets).toHaveLength(expectedFacetsForCreateFaceCalls(4, 6));

    // basic facet structure
    for (const f of mesh.facets.slice(0, 3)) {
      expect(f).toHaveProperty('normal');
      expect(f).toHaveProperty('verts');
      expect(f.verts).toHaveLength(3);
      expect(f.normal).toHaveLength(3);
    }

    // single-form should not call intersections at all
    expect(intersectionsMock).not.toHaveBeenCalled();
  });

  test('single form edge case: includes collinear corner (bend == 0 branch in calcQ) and still produces facets', () => {
    // Points include a straight run along the bottom edge:
    // (0,0)->(10,0)->(20,0) creates collinear vectors at (10,0) => bend == 0 branch :contentReference[oaicite:5]{index=5}
    const data = {
      forms: [
        {
          circDir: 'ccw',
          points: [
            [0, 0],
            [10, 0],
            [20, 0],   // collinear continuation
            [20, 10],
            [0, 10],
            [0, 0],
          ],
          meta: { center: { x: 10, y: 5 } },
        },
      ],
      segments: [],
      outer: 0,
    };

    const mesh = createMesh(data, 1, 3, 'collinear');

    // n = points.length-1 = 5
    // createFace called 6 times => 2*n*6 = 60 facets
    expect(mesh.facets).toHaveLength(expectedFacetsForCreateFaceCalls(5, 6));
  });

  test('two forms (outer+inner): builds outer, inner, connection, calls intersections, and produces expected facet count', () => {
    // For IO-form case, CreateMesh allocates _vertices length 3 and uses:
    // - createOuterVertices
    // - createInnerVertices
    // - createConnectionVertices (uses intersections) :contentReference[oaicite:6]{index=6}

    // outer square (n=4)
    const outer = {
      circDir: 'cw',
      points: [
        [0, 0],
        [20, 0],
        [20, 20],
        [0, 20],
        [0, 0],
      ],
      meta: { center: { x: 10, y: 10 } },
    };

    // inner square (n=4)
    const inner = {
      circDir: 'ccw',
      points: [
        [6, 6],
        [14, 6],
        [14, 14],
        [6, 14],
        [6, 6],
      ],
      meta: { center: { x: 10, y: 10 } },
    };

    // segments consumed by createConnectionVertices: it splices the array empty and maps to [[p1],[p2]] :contentReference[oaicite:7]{index=7}
    const data = {
      forms: [outer, inner],
      outer: 0,
      segments: [
        // format matches what CreateMesh expects: [[x,y],[x,y]] wrapped like segment arrays from Validation
        [[[0, 10], [20, 10]]],
      ].map((s) => s[0]),
    };

    // createConnectionVertices pushes a horizontal segment through center.y and calls intersections(segments).
    // It expects intersections as list of [x,y], then sorts by x. :contentReference[oaicite:8]{index=8}
    // We return 4 intersection points with center.x = 10 inside.
    intersectionsMock.mockReturnValue([
      [0, 10],
      [8, 10],
      [12, 10],
      [20, 10],
    ]);

    const thickness = 2;
    const height = 6;

    const mesh = createMesh(data, thickness, height, 'io');

    expect(intersectionsMock).toHaveBeenCalledTimes(1);
    // ensure it was called with some segments array (we don't over-specify its internal content)
    expect(intersectionsMock.mock.calls[0][0]).toBeInstanceOf(Array);

    // Facet count reasoning:
    // Outer faces: createFace called 6 times with n=4 => 2*4*6 = 48 facets
    // Inner faces: createFace called 4 times with n=4 => 2*4*4 = 32 facets
    // Connection: two createFace calls, each with n=4 (each connVerts[k] has 4 points) => 2*4*2 = 16 facets
    // Total expected = 48 + 32 + 16 = 96 facets :contentReference[oaicite:9]{index=9}
    expect(mesh.facets).toHaveLength(96);

    expect(mesh.description).toBe('io');
  });

  test('two forms edge case: outer chosen by data.outer; swapping outer index still works', () => {
    const f0 = {
      circDir: 'ccw',
      points: [
        [0, 0],
        [30, 0],
        [30, 30],
        [0, 30],
        [0, 0],
      ],
      meta: { center: { x: 15, y: 15 } },
    };
    const f1 = {
      circDir: 'cw',
      points: [
        [10, 10],
        [20, 10],
        [20, 20],
        [10, 20],
        [10, 10],
      ],
      meta: { center: { x: 15, y: 15 } },
    };

    const data = {
      forms: [f0, f1],
      outer: 1, // flip: now f1 is treated as outer and f0 is inner per CreateMesh.js logic :contentReference[oaicite:10]{index=10}
      segments: [
        [[0, 15], [30, 15]],
      ],
    };

    intersectionsMock.mockReturnValue([
      [0, 15],
      [14, 15],
      [16, 15],
      [30, 15],
    ]);

    const mesh = createMesh(data, 1, 4, 'swapped-outer');
    expect(mesh.facets.length).toBeGreaterThan(0);
    expect(intersectionsMock).toHaveBeenCalledTimes(1);
  });

  test('connection vertices edge case: intersections returned unsorted; CreateMesh sorts them by x', () => {
    const outer = {
      circDir: 'cw',
      points: [
        [0, 0],
        [20, 0],
        [20, 20],
        [0, 20],
        [0, 0],
      ],
      meta: { center: { x: 10, y: 10 } },
    };
    const inner = {
      circDir: 'cw',
      points: [
        [6, 6],
        [14, 6],
        [14, 14],
        [6, 14],
        [6, 6],
      ],
      meta: { center: { x: 10, y: 10 } },
    };

    const data = {
      forms: [outer, inner],
      outer: 0,
      segments: [
        [[0, 10], [20, 10]],
      ],
    };

    // return out-of-order; code sorts intersections by x :contentReference[oaicite:11]{index=11}
    intersectionsMock.mockReturnValue([
      [20, 10],
      [12, 10],
      [0, 10],
      [8, 10],
    ]);

    const mesh = createMesh(data, 2, 6, 'unsorted');
    expect(mesh.facets).toHaveLength(96); // same geometry => same number of faces as the other IO test
  });
});
