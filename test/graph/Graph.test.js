import { test, expect, jest, describe } from '@jest/globals';


/**
 * Graph.test.js
 *
 * These tests are written based on Graph.js. :contentReference[oaicite:1]{index=1}
 */

const makeSvgHandlerMock = () => {
  // A simple singleton-like handler object Graph interacts with
  return {
    addNode: jest.fn(),
    removeNode: jest.fn(),
    addEdge: jest.fn(),
    removeEdge: jest.fn(),
    clear: jest.fn(),
    nodeID: 0,
    edgeID: 0,
  };
};

describe('Graph (singleton)', () => {
  /**
   * Loads Graph with fresh module state and fresh mocks.
   * This is important because Graph.instance uses a private module Symbol.
   */
  const loadFreshGraph = async () => {
    jest.resetModules();

    const svgh = makeSvgHandlerMock();

    // Mock validate/analyze functions
    jest.unstable_mockModule('../../src/business-logic/graph-operations/Validation.js', () => ({
      __esModule: true,
      default: jest.fn((graph) => ({ ok: true, nodeSize: graph.nodeSize, edgeSize: graph.edgeSize })),
    }));
    jest.unstable_mockModule('../../src/business-logic/graph-operations/Analysis.js', () => ({
      __esModule: true,
      default: jest.fn((graph, data, crit) => ({
        analyzed: true,
        data,
        crit,
        nodeSize: graph.nodeSize,
        edgeSize: graph.edgeSize,
      })),
    }));

    // Mock Node
    jest.doMock('../../src/entities/graph/Node.js', () => ({
      __esModule: true,
      default: class Node {
        constructor(id, pos) {
          this.id = id;
          this.pos = pos;
          this.adjacent = [];
        }
      },
    }));

    // Mock Edge (handles adjacency bookkeeping so removeNode/removeEdge can be tested realistically)
    jest.unstable_mockModule('../../src/entities/graph/Edge.js', () => ({
      __esModule: true,
      default: class Edge {
        constructor(id, from, to, q) {
          this.id = id;
          this.from = from;
          this.to = to;
          this.q = q;
          // mimic typical behavior: register on nodes
          if (from && Array.isArray(from.adjacent)) from.adjacent.push(this);
          if (to && Array.isArray(to.adjacent)) to.adjacent.push(this);
        }
        removeFromAdjacentNode() {
          const remove = (n) => {
            if (!n || !Array.isArray(n.adjacent)) return;
            n.adjacent = n.adjacent.filter((e) => e !== this);
          };
          remove(this.from);
          remove(this.to);
        }
      },
    }));

    // IMPORTANT: adjust this import path to where Graph.js is from this test file
    const Graph = (await import('../../src/entities/graph/Graph.js')).default;

    // Also get access to mocked modules for assertions
    const validateGraph = (await import('../../src/business-logic/graph-operations/Validation.js')).default;
    const analyzeGraph = (await import('../../src/business-logic/graph-operations/Analysis.js')).default;
    const SvgHandler = (await import('../../src/business-logic/handlers/SvgHandler.js')).default;
    const Node = (await import('../../src/entities/graph/Node.js')).default;
    const Edge = (await import('../../src/entities/graph/Edge.js')).default;

    const g = new Graph(() => svgh);

    return { Graph, g, validateGraph, analyzeGraph, Node, Edge, svgh };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('starts empty', async () => {
    const { g } = await loadFreshGraph();
    expect(g.nodeSize).toBe(0);
    expect(g.edgeSize).toBe(0);
  });

  test('addNode: stores node and calls SvgHandler.addNode', async () => {
    const { g, Node, svgh } = await loadFreshGraph();

    const n = new Node(1, { x: 10, y: 20 });
    g.addNode(n);

    expect(g.nodeSize).toBe(1);
    expect(g.hasNode(1)).toBe(true);
    expect(g.getNode(1)).toBe(n);
    expect(svgh.addNode).toHaveBeenCalledTimes(1);
    expect(svgh.addNode).toHaveBeenCalledWith(n);
  });

  test('hasNode/getNode: returns false/undefined for missing id', async () => {
    const { g } = await loadFreshGraph();

    expect(g.hasNode('nope')).toBe(false);
    expect(g.getNode('nope')).toBeUndefined();
  });

  test('forEachNode iterates over values (in insertion order of Map)', async () => {
    const { g , Node} = await loadFreshGraph();

    const n1 = new Node(1, { x: 0, y: 0 });
    const n2 = new Node(2, { x: 1, y: 1 });
    g.addNode(n1);
    g.addNode(n2);

    const seen = [];
    g.forEachNode((n) => seen.push(n.id));
    expect(seen).toEqual([1, 2]);
  });

  test('addEdge: stores edge and calls SvgHandler.addEdge', async () => {
    const { g, Node, Edge, svgh } = await loadFreshGraph();

    const a = new Node(1, { x: 0, y: 0 });
    const b = new Node(2, { x: 10, y: 10 });
    g.addNode(a);
    g.addNode(b);

    const e = new Edge(7, a, b, { x: 5, y: 5 });
    g.addEdge(e);

    expect(g.edgeSize).toBe(1);
    expect(g.hasEdge(7)).toBe(true);
    expect(g.getEdge(7)).toBe(e);

    expect(svgh.addEdge).toHaveBeenCalledTimes(1);
    expect(svgh.addEdge).toHaveBeenCalledWith(e);
  });

  test('hasEdge/getEdge: returns false/undefined for missing id', async () => {
    const { g } = await loadFreshGraph();

    expect(g.hasEdge(123)).toBe(false);
    expect(g.getEdge(123)).toBeUndefined();
  });

  test('forEachEdge iterates over values', async () => {
    const { g, Node, Edge } = await loadFreshGraph();

    const a = new Node(1, { x: 0, y: 0 });
    const b = new Node(2, { x: 1, y: 1 });
    g.addNode(a);
    g.addNode(b);

    const e1 = new Edge(1, a, b, { x: 0.5, y: 0.5 });
    const e2 = new Edge(2, b, a, { x: 0.5, y: 0.5 });
    g.addEdge(e1);
    g.addEdge(e2);

    const seen = [];
    g.forEachEdge((e) => seen.push(e.id));
    expect(seen).toEqual([1, 2]);
  });

  test('removeEdge: calls SvgHandler.removeEdge, unregisters from adjacent nodes, deletes from Map', async () => {
    const { g, Node, Edge, svgh } = await loadFreshGraph();

    const a = new Node(1, { x: 0, y: 0 });
    const b = new Node(2, { x: 1, y: 1 });
    g.addNode(a);
    g.addNode(b);

    const e = new Edge(99, a, b, { x: 0.5, y: 0.5 });
    const spyRemoveFromAdj = jest.spyOn(e, 'removeFromAdjacentNode');
    g.addEdge(e);

    expect(a.adjacent).toContain(e);
    expect(b.adjacent).toContain(e);

    g.removeEdge(e);

    expect(svgh.removeEdge).toHaveBeenCalledTimes(1);
    expect(svgh.removeEdge).toHaveBeenCalledWith(e);

    expect(spyRemoveFromAdj).toHaveBeenCalledTimes(1);
    expect(g.edgeSize).toBe(0);
    expect(g.hasEdge(99)).toBe(false);

    expect(a.adjacent).not.toContain(e);
    expect(b.adjacent).not.toContain(e);
  });

  test('removeNode: removes all adjacent edges (using clone), calls SvgHandler.removeNode, deletes node', async () => {
    const { g, Node, Edge, svgh } = await loadFreshGraph();

    const a = new Node(1, { x: 0, y: 0 });
    const b = new Node(2, { x: 1, y: 1 });
    const c = new Node(3, { x: 2, y: 2 });
    g.addNode(a);
    g.addNode(b);
    g.addNode(c);

    const e1 = new Edge(10, a, b, { x: 0.5, y: 0.5 });
    const e2 = new Edge(11, a, c, { x: 1, y: 1 });
    g.addEdge(e1);
    g.addEdge(e2);

    // adjacency on a contains two edges
    expect(a.adjacent).toHaveLength(2);

    // Spy on removeEdge to ensure it is called for both edges even if adjacency mutates during removal
    const removeEdgeSpy = jest.spyOn(g, 'removeEdge');

    g.removeNode(a);

    expect(removeEdgeSpy).toHaveBeenCalledTimes(2);
    expect(removeEdgeSpy).toHaveBeenCalledWith(e1);
    expect(removeEdgeSpy).toHaveBeenCalledWith(e2);

    expect(svgh.removeNode).toHaveBeenCalledTimes(1);
    expect(svgh.removeNode).toHaveBeenCalledWith(a);

    expect(g.hasNode(1)).toBe(false);
    expect(g.nodeSize).toBe(2);
    expect(g.edgeSize).toBe(0);
  });

  test('clear: calls SvgHandler.clear and empties nodes + edges', async () => {
    const { g, Node, Edge, svgh } = await loadFreshGraph();

    const a = new Node(1, { x: 0, y: 0 });
    const b = new Node(2, { x: 1, y: 1 });
    g.addNode(a);
    g.addNode(b);
    g.addEdge(new Edge(1, a, b, { x: 0.5, y: 0.5 }));

    expect(g.nodeSize).toBe(2);
    expect(g.edgeSize).toBe(1);

    g.clear();

    expect(svgh.clear).toHaveBeenCalledTimes(1);
    expect(g.nodeSize).toBe(0);
    expect(g.edgeSize).toBe(0);
  });

  test('validate delegates to validateGraph(graph)', async () => {
    const { g, validateGraph } = await loadFreshGraph();

    const result = g.validate();

    expect(validateGraph).toHaveBeenCalledTimes(1);
    expect(validateGraph).toHaveBeenCalledWith(g);
    expect(result).toEqual({ ok: true, nodeSize: 0, edgeSize: 0 });
  });

  test('analyze delegates to analyzeGraph(graph, data, crit)', async () => {
    const { g, analyzeGraph } = await loadFreshGraph();

    const data = { foo: 'bar' };
    const crit = { threshold: 3 };
    const result = g.analyze(data, crit);

    expect(analyzeGraph).toHaveBeenCalledTimes(1);
    expect(analyzeGraph).toHaveBeenCalledWith(g, data, crit);
    expect(result).toMatchObject({ analyzed: true, data, crit });
  });

  test('toJSON produces non-cyclic JSON with nodes and edges', async () => {
    const { g, Node, Edge } = await loadFreshGraph();

    const a = new Node(1, { x: 1, y: 2 });
    const b = new Node(2, { x: 3, y: 4 });
    g.addNode(a);
    g.addNode(b);

    g.addEdge(new Edge(5, a, b, { x: 9, y: 9 }));

    const json = g.toJSON();
    const obj = JSON.parse(json);

    expect(obj).toEqual({
      nodes: [
        { id: 1, pos: { x: 1, y: 2 } },
        { id: 2, pos: { x: 3, y: 4 } },
      ],
      edges: [{ id: 5, from: 1, to: 2, q: { x: 9, y: 9 } }],
    });
  });

  test('fromJSON: clears existing graph, loads nodes/edges, sets SvgHandler nodeID/edgeID', async () => {
    const { g, Node, Edge, svgh } = await loadFreshGraph();

    // Pre-fill graph to ensure clear() occurs
    const a = new Node(1, { x: 0, y: 0 });
    const b = new Node(2, { x: 1, y: 1 });
    g.addNode(a);
    g.addNode(b);
    g.addEdge(new Edge(1, a, b, { x: 0.5, y: 0.5 }));

    const json = JSON.stringify({
      nodes: [
        { id: 10, pos: { x: 10, y: 10 } },
        { id: 11, pos: { x: 20, y: 20 } },
      ],
      edges: [{ id: 7, from: 10, to: 11, q: { x: 15, y: 15 } }],
    });

    g.fromJSON(json);

    expect(g.nodeSize).toBe(2);
    expect(g.edgeSize).toBe(1);
    expect(g.getNode(10).pos).toEqual({ x: 10, y: 10 });
    expect(g.getEdge(7).from.id).toBe(10);
    expect(g.getEdge(7).to.id).toBe(11);

    // Graph.js sets svgh.nodeID = maxNodeId + 1, svgh.edgeID = eid + 1
    expect(svgh.nodeID).toBe(12);
    expect(svgh.edgeID).toBe(8);
  });

  test('fromJSON edge case: invalid JSON throws', async () => {
    const { g } = await loadFreshGraph();

    expect(() => g.fromJSON('not-json')).toThrow();
  });

  test('backup/restore: restore returns to exact previous JSON snapshot', async () => {
    const { g, Node, Edge } = await loadFreshGraph();

    const a = new Node(1, { x: 0, y: 0 });
    const b = new Node(2, { x: 1, y: 1 });
    g.addNode(a);
    g.addNode(b);
    g.addEdge(new Edge(1, a, b, { x: 0.5, y: 0.5 }));

    g.backup();
    const before = g.toJSON();

    // mutate graph
    g.clear();
    expect(g.nodeSize).toBe(0);

    // restore
    g.restore();
    const after = g.toJSON();

    expect(after).toBe(before);
  });

  test('fromSvg: open path (end != origin) creates new final node', async () => {
    const { g, svgh } = await loadFreshGraph();

    // ensure deterministic IDs
    svgh.nodeID = 0;
    svgh.edgeID = 0;

    // format: "x0 y0 Q qx1 qy1 x1 y1"
    // This is an open path because end != origin.
    const forms = ['0 0 Q 5 5 10 10'];

    g.fromSvg(forms);

    // origin + final node
    expect(g.nodeSize).toBe(2);
    // a single edge
    expect(g.edgeSize).toBe(1);

    // node IDs incremented starting from 0
    const n0 = g.getNode(0);
    const n1 = g.getNode(1);
    expect(n0.pos).toEqual({ x: 0, y: 0 });
    expect(n1.pos).toEqual({ x: 10, y: 10 });

    // edge IDs incremented starting from 0
    const e0 = g.getEdge(0);
    expect(e0.from.id).toBe(0);
    expect(e0.to.id).toBe(1);
    expect(e0.q).toEqual({ x: 5, y: 5 });

    // handler counters moved forward
    expect(svgh.nodeID).toBe(2);
    expect(svgh.edgeID).toBe(1);
  });

  test('fromSvg: closed path (end == origin) does NOT create new final node; edge points back to origin', async () => {
    const { g, svgh } = await loadFreshGraph();

    svgh.nodeID = 100;
    svgh.edgeID = 200;

    // Closed: origin at (0,0), last end also (0,0)
    const forms = ['0 0 Q 7 7 0 0'];

    g.fromSvg(forms);

    expect(g.nodeSize).toBe(1); // only origin
    expect(g.edgeSize).toBe(1);

    const origin = g.getNode(100);
    const e = g.getEdge(200);
    expect(e.from.id).toBe(100);
    expect(e.to.id).toBe(100);
    expect(e.q).toEqual({ x: 7, y: 7 });

    expect(svgh.nodeID).toBe(101);
    expect(svgh.edgeID).toBe(201);
  });

  test('fromSvg: multi-segment path creates intermediate nodes and edges', async () => {
    const { g, svgh } = await loadFreshGraph();

    svgh.nodeID = 0;
    svgh.edgeID = 0;

    // origin (0,0)
    // segment1: Q 1 1 10 10  => node(10,10), edge(origin->node)
    // segment2: Q 2 2 20 20  => end at (20,20), edge(node->newNode)
    const forms = ['0 0 Q 1 1 10 10 Q 2 2 20 20'];

    g.fromSvg(forms);

    expect(g.nodeSize).toBe(3); // origin + intermediate + final
    expect(g.edgeSize).toBe(2);

    expect(g.getNode(0).pos).toEqual({ x: 0, y: 0 });
    expect(g.getNode(1).pos).toEqual({ x: 10, y: 10 });
    expect(g.getNode(2).pos).toEqual({ x: 20, y: 20 });

    expect(g.getEdge(0).from.id).toBe(0);
    expect(g.getEdge(0).to.id).toBe(1);
    expect(g.getEdge(0).q).toEqual({ x: 1, y: 1 });

    expect(g.getEdge(1).from.id).toBe(1);
    expect(g.getEdge(1).to.id).toBe(2);
    expect(g.getEdge(1).q).toEqual({ x: 2, y: 2 });

    expect(svgh.nodeID).toBe(3);
    expect(svgh.edgeID).toBe(2);
  });

  test('edge cases: removing a node with empty adjacent does not call removeEdge', async () => {
    const { g, Node } = await loadFreshGraph();

    const a = new Node(1, { x: 0, y: 0 });
    g.addNode(a);

    const removeEdgeSpy = jest.spyOn(g, 'removeEdge');
    g.removeNode(a);

    expect(removeEdgeSpy).not.toHaveBeenCalled();
    expect(g.nodeSize).toBe(0);
  });

  test('edge cases: toJSON on empty graph returns nodes/edges empty arrays', async () => {
    const { g } = await loadFreshGraph();

    const obj = JSON.parse(g.toJSON());
    expect(obj).toEqual({ nodes: [], edges: [] });
  });
});
