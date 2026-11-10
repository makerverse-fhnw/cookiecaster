// Validation.test.js (ESM, Node environment)

import { describe, test, expect, jest, beforeEach } from '@jest/globals';

let validateGraph;
let intersectionsMock;

// ---- helpers to build a minimal Graph/Node/Edge world ----

function makeNode(id, x, y) {
  return { id, pos: { x, y }, adjacent: [] };
}

function connect(nodeA, nodeB, q = { x: 0, y: 0 }) {
  // Edge-like object with q and getOtherNode, exactly what traceForm expects. :contentReference[oaicite:3]{index=3}
  const e = {
    q,
    getOtherNode(n) {
      return n === nodeA ? nodeB : nodeA;
    },
  };
  nodeA.adjacent.push(e);
  nodeB.adjacent.push(e);
  return e;
}

function makeGraph(nodes) {
  return { _nodes: new Map(nodes.map((n) => [n.id, n])) };
}

// ---- stub “document + svg path api” without jsdom ----
// Validation.pathToPoints does:
// const temp = document.createElementNS(...,"path");
// temp.setAttribute("d", path);
// const total = temp.getTotalLength();
// for i<=total: temp.getPointAtLength(i) => {x,y} :contentReference[oaicite:4]{index=4}

function installDocumentStubWithPathSampling({ points, totalOverride }) {
  const total =
    typeof totalOverride === 'number'
      ? totalOverride
      : Math.max(0, (points?.length ?? 1) - 1);

  const tempPath = {
    setAttribute: jest.fn(),
    getTotalLength: jest.fn(() => total),
    getPointAtLength: jest.fn((i) => {
      const p = points?.[i];
      if (!p) return { x: 0, y: 0 };
      return { x: p[0], y: p[1] };
    }),
  };

  globalThis.document = {
    createElementNS: jest.fn(() => tempPath),
  };

  return { tempPath };
}

async function loadFreshModule() {
  jest.resetModules();

  // Mock intersections (must match import path inside Validation.js)
  await jest.unstable_mockModule('../../src/business-logic/handlers/Intersections.js', () => {
    intersectionsMock = jest.fn((segments) => ({
      calledWithCount: segments.length,
    }));
    return { __esModule: true, default: intersectionsMock };
  });

  ({ default: validateGraph } = await import(
    '../../src/business-logic/graph-operations/Validation.js'
  ));
}

beforeEach(async () => {
  jest.clearAllMocks();
  // Remove any old document stubs to ensure tests deliberately install it when needed.
  delete globalThis.document;
  await loadFreshModule();
});

describe('validateGraph (Validation.js) - Node env, no jsdom', () => {
  test('empty graph: returns empty forms + segments and calls intersections([])', () => {
    const graph = makeGraph([]);

    const result = validateGraph(graph);

    expect(result.forms).toEqual([]);
    expect(result.segments).toEqual([]);
    expect(intersectionsMock).toHaveBeenCalledTimes(1);
    expect(intersectionsMock).toHaveBeenCalledWith([]);
    expect(result.intersections).toEqual({ calledWithCount: 0 });
  });

  test('isolated nodes (adjacent length 0): creates one empty open form per node', () => {
    const n1 = makeNode(1, 0, 0);
    const n2 = makeNode(2, 10, 10);
    const graph = makeGraph([n1, n2]);

    const result = validateGraph(graph);

    expect(result.forms).toHaveLength(2);

    for (const f of result.forms) {
      expect(f.closed).toBe(false);
      expect(f.path).toBe('');
      expect(f.points).toEqual([]);
      expect(f.circDir).toBeUndefined();
      expect(f.meta).toEqual({});
    }

    expect(result.segments).toEqual([]);
    expect(intersectionsMock).toHaveBeenCalledWith([]);
  });

  test('open component: start node degree=2 triggers “trace other edges of start node to mark as visited” branch', () => {
    // S has degree 2; A and B are leaves.
    // This specifically hits:
    //   else if (node.adjacent.length === 2) { ... mark visited ... } :contentReference[oaicite:5]{index=5}
    const S = makeNode(1, 0, 0);
    const A = makeNode(2, -10, 0);
    const B = makeNode(3, 10, 0);

    connect(S, A, { x: -5, y: 0 });
    connect(S, B, { x: 5, y: 0 });

    const graph = makeGraph([S, A, B]);
    const result = validateGraph(graph);

    // Because the "other edges of start node" branch marks the other leaf visited,
    // only one form should be traced.
    expect(result.forms).toHaveLength(1);
    expect(result.forms[0].closed).toBe(false);
  });

  test('closed form (cw): computes circDir=cw, adds "z", computes points/meta, and pushes segments', () => {
    // Triangle cycle intended to have _A > 0 => cw :contentReference[oaicite:6]{index=6}
    const n0 = makeNode(1, 0, 0);
    const n1 = makeNode(2, 10, 0);
    const n2 = makeNode(3, 0, 10);

    connect(n0, n1, { x: 5, y: 0 });
    connect(n1, n2, { x: 5, y: 5 });
    connect(n2, n0, { x: 0, y: 5 });

    // Provide sampled points for calcPathMeta.
    // Include consecutive duplicates to hit:
    //   if (dx < _eta && dy < _eta) continue; :contentReference[oaicite:7]{index=7}
    installDocumentStubWithPathSampling({
      points: [
        [0, 0],
        [0, 0], // duplicate -> skipped
        [10, 0],
        [10, 10],
        [0, 10],
        [0, 0],
      ],
    });

    const graph = makeGraph([n0, n1, n2]);
    const result = validateGraph(graph);

    expect(globalThis.document.createElementNS).toHaveBeenCalledTimes(1);

    expect(result.forms).toHaveLength(1);
    const form = result.forms[0];

    expect(form.closed).toBe(true);
    expect(form.circDir).toBe('cw');
    expect(form.path.endsWith('z')).toBe(true);

    // Duplicate skipped: points should exclude the duplicated consecutive point
    expect(form.points).toEqual([
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
    ]);

    expect(form.meta).toEqual({
      width: 10,
      height: 10,
      center: { x: 5, y: 5 },
    });

    // segments are pushed inside calcPathMeta loop
    expect(result.segments.length).toBeGreaterThan(0);

    expect(intersectionsMock).toHaveBeenCalledTimes(1);
    expect(intersectionsMock).toHaveBeenCalledWith(result.segments);
    expect(result.intersections).toEqual({ calledWithCount: result.segments.length });
  });

  test('closed form (ccw): circDir=ccw when _A <= 0', () => {
    // Reverse ordering intended to make _A <= 0 :contentReference[oaicite:8]{index=8}
    const n0 = makeNode(1, 0, 0);
    const n1 = makeNode(2, 0, 10);
    const n2 = makeNode(3, 10, 0);

    connect(n0, n1, { x: 0, y: 5 });
    connect(n1, n2, { x: 5, y: 5 });
    connect(n2, n0, { x: 5, y: 0 });

    installDocumentStubWithPathSampling({
      points: [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
        [0, 0],
      ],
    });

    const graph = makeGraph([n0, n1, n2]);
    const result = validateGraph(graph);

    expect(result.forms).toHaveLength(1);
    expect(result.forms[0].closed).toBe(true);
    expect(result.forms[0].circDir).toBe('ccw');
  });

  test('edge case: calcPathMeta returns undefined when contour is empty => validateGraph throws (accessing pathMeta.points)', () => {
    // Need a CLOSED form so it calls calcPathMeta(form.path) :contentReference[oaicite:9]{index=9}
    // Easiest: two nodes with TWO parallel edges (each node degree 2),
    // so trace walks from n0 to n1 and back to n0 and closes.
    const n0 = makeNode(1, 0, 0);
    const n1 = makeNode(2, 10, 0);

    connect(n0, n1, { x: 5, y: 0 });
    connect(n0, n1, { x: 5, y: 0 }); // second parallel edge => degree 2 on both nodes

    // Force pathToPoints to return [] by making total < 0 so loop never runs.
    // for (let i = 0; i <= total; i += step) won't execute if total is -1 :contentReference[oaicite:10]{index=10}
    installDocumentStubWithPathSampling({ points: [], totalOverride: -1 });

    const graph = makeGraph([n0, n1]);

    expect(() => validateGraph(graph)).toThrow();
  });
});
