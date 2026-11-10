// ModeDraw.test.js (ESM, Node env, NO jsdom)

import { describe, test, expect, jest, beforeEach } from '@jest/globals';

let ModeDraw;
let d3, svgh, graph, ctrl, selh;
let NodeMock, EdgeMock;

const loadFresh = async () => {
  jest.resetModules();

  // d3 mock
  d3 = { select: jest.fn(() => ({ classed: jest.fn() })) };
  await jest.unstable_mockModule('d3', () => ({ __esModule: true, ...d3 }));

  // SvgHandler mock
  svgh = {
    focus: { obj: undefined, type: undefined },
    nodeID: 0,
    edgeID: 0,
    resetMoveEdge: jest.fn(),
    setMoveEdgeVisible: jest.fn(),
    setMoveEdgeTo: jest.fn(),
    updateMessage: jest.fn(),
  };

  // Graph mock
  graph = { addNode: jest.fn(), addEdge: jest.fn() };

  // Controller mock
  ctrl = { modi: { MODE_SELECT: 'MODE_SELECT' } };
  const controllerGetter = () => ctrl;

  // SelectionHandler mock
  selh = { clear: jest.fn() };

  // Node/Edge mocks
  NodeMock = class Node { constructor(id, pos) { this.id = id; this.pos = pos; this.adjacent = []; } };
  EdgeMock = class Edge {
    constructor(id, from, to) {
      this.id = id; this.from = from; this.to = to;
      // emulate adjacency bookkeeping
      from.adjacent.push(this);
      to.adjacent.push(this);
    }
  };

  await jest.unstable_mockModule('../../src/entities/graph/Node.js', () => ({ __esModule: true, default: NodeMock }));
  await jest.unstable_mockModule('../../src/entities/graph/Edge.js', () => ({ __esModule: true, default: EdgeMock }));

  ({ default: ModeDraw } = await import('../../src/business-logic/modes/ModeDraw.js'));

  const makeMode = () =>
      new ModeDraw({
        controller: controllerGetter,
        svgHandler: svgh,
        selectionHandler: selh,
        graph,
      });

  return { makeMode };
};

let makeMode;

beforeEach(async () => {
  jest.clearAllMocks();
  ({makeMode} = await loadFresh());
});

describe('ModeDraw (no jsdom)', () => {
  test('enable: activates draw, disables buttons, clears selection', () => {
    const m = makeMode();
    const spyEnableButtons = jest.spyOn(m, 'enableButtons');

    m.enable();

    expect(d3.select).toHaveBeenCalledWith('#draw');
    expect(spyEnableButtons).toHaveBeenCalledWith({ move: false, rotate: false, copy: false, mirror: false, erase: false });
    expect(selh.clear).toHaveBeenCalledTimes(1);
  });

  test('prev setter calls resetMoveEdge when set to node', () => {
    const m = makeMode();
    const node = new NodeMock(1, { x: 1, y: 2 });
    m.prev = node;
    expect(svgh.resetMoveEdge).toHaveBeenCalledWith(node.pos);
    expect(m.prev).toBe(node);
  });

  test('onMouseDown: when prev undefined and focus is undefined -> creates node, sets prev, shows move edge', () => {
    const m = makeMode();
    m.enable();

    svgh.focus = { obj: undefined, type: undefined };

    const ret = m.onMouseDown({ x: 10, y: 20 });

    expect(ret).toBeUndefined();
    expect(graph.addNode).toHaveBeenCalledTimes(1);
    const createdNode = graph.addNode.mock.calls[0][0];
    expect(createdNode).toBeInstanceOf(NodeMock);
    expect(svgh.setMoveEdgeVisible).toHaveBeenCalledWith(true);
    expect(svgh.updateMessage).toHaveBeenCalledTimes(1);
    expect(m.prev).toBe(createdNode);
  });

  test('onMouseDown: when prev undefined and focus is node with degree < 2 -> sets prev and shows move edge', () => {
    const m = makeMode();
    m.enable();

    const existing = new NodeMock(5, { x: 1, y: 1 });
    // degree 1
    existing.adjacent.push({});

    svgh.focus = { obj: existing, type: 'node' };

    m.onMouseDown({ x: 0, y: 0 });

    expect(m.prev).toBe(existing);
    expect(svgh.setMoveEdgeVisible).toHaveBeenCalledWith(true);
  });

  test('onMouseDown: when prev exists and click empty space -> adds new node and edge from prev, updates prev', () => {
    const m = makeMode();
    m.enable();

    // create prev
    const prev = new NodeMock(1, { x: 0, y: 0 });
    m.prev = prev;

    svgh.focus = { obj: undefined, type: undefined };

    m.onMouseDown({ x: 10, y: 10 });

    expect(graph.addNode).toHaveBeenCalledTimes(1);
    expect(graph.addEdge).toHaveBeenCalledTimes(1);
    const newNode = graph.addNode.mock.calls[0][0];
    const edge = graph.addEdge.mock.calls[0][0];
    expect(edge.from).toBe(prev);
    expect(edge.to).toBe(newNode);
    expect(m.prev).toBe(newNode);
  });

  test('onMouseDown: when prev exists and click different node with degree < 2 -> creates edge and may transition if node reaches degree 2', () => {
    const m = makeMode();
    m.enable();

    const a = new NodeMock(1, { x: 0, y: 0 });
    const b = new NodeMock(2, { x: 10, y: 0 });

    m.prev = a;

    // b currently has degree 1 -> after adding edge it becomes 2 => transition
    b.adjacent.push({});

    svgh.focus = { obj: b, type: 'node' };

    const ret = m.onMouseDown({ x: 0, y: 0 });

    expect(graph.addEdge).toHaveBeenCalledTimes(1);
    expect(m.prev).toBe(b);
    expect(ret).toBe('MODE_SELECT');
  });

  test('onMouseDown edge cases: clicking node with degree === 2 returns MODE_SELECT; clicking same node returns MODE_SELECT', () => {
    const m = makeMode();
    m.enable();

    const a = new NodeMock(1, { x: 0, y: 0 });
    const b = new NodeMock(2, { x: 10, y: 0 });

    m.prev = a;

    // Case 1: b has degree 2 => returns MODE_SELECT (an === 2) :contentReference[oaicite:7]{index=7}
    b.adjacent.push({}, {});
    svgh.focus = { obj: b, type: 'node' };
    expect(m.onMouseDown({ x: 0, y: 0 })).toBe('MODE_SELECT');

    // Case 2: click same node as prev => returns MODE_SELECT
    svgh.focus = { obj: a, type: 'node' };
    expect(m.onMouseDown({ x: 0, y: 0 })).toBe('MODE_SELECT');
  });

  test('onMouseMove: when prev exists uses focus node pos if hovering a node, else uses cursor point', () => {
    const m = makeMode();
    m.enable();

    const prev = new NodeMock(1, { x: 0, y: 0 });
    m.prev = prev;

    // hover node
    const target = new NodeMock(2, { x: 99, y: 88 });
    svgh.focus = { obj: target, type: 'node' };
    m.onMouseMove({ x: 5, y: 6 });
    expect(svgh.setMoveEdgeTo).toHaveBeenCalledWith(target.pos);

    // hover empty
    svgh.focus = { obj: undefined, type: undefined };
    const p = { x: 7, y: 8 };
    m.onMouseMove(p);
    expect(svgh.setMoveEdgeTo).toHaveBeenCalledWith(p);
  });

  test('onEscape returns MODE_SELECT', () => {
    const m = makeMode();
    expect(m.onEscape()).toBe('MODE_SELECT');
  });

  test('disable: deactivates draw, clears prev, hides move edge', () => {
    const m = makeMode();
    m.enable();

    m.prev = new NodeMock(1, { x: 1, y: 1 });

    m.disable();

    expect(d3.select).toHaveBeenCalledWith('#draw');
    expect(m.prev).toBeUndefined();
    expect(svgh.setMoveEdgeVisible).toHaveBeenCalledWith(false);
  });
});
