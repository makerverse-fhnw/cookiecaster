// ModeMove.test.js (ESM, Node env, NO jsdom)

import { describe, test, expect, jest, beforeEach } from '@jest/globals';

let ModeMove;
let d3, svgh, selh, ctrl;

const loadFresh = async () => {
  jest.resetModules();

  // d3 mock
  d3 = { select: jest.fn(() => ({ classed: jest.fn() })) };
  await jest.unstable_mockModule('d3', () => ({ __esModule: true, ...d3 }));

  // SvgHandler mock
  svgh = { updateNode: jest.fn(), updateEdge: jest.fn(), updateMessage: jest.fn() };

  // SelectionHandler mock (ModeMove uses .forEach on selectedNodes/Edges/AffectedEdges) :contentReference[oaicite:3]{index=3}
  selh = {
    selectedNodes: [],
    selectedEdges: [],
    affectedEdges: [],
  };

  // Controller mock for onEscape
  ctrl = { modi: { MODE_SELECT: 'MODE_SELECT' } };

  ({ default: ModeMove } = await import('../../src/business-logic/modes/ModeMove.js'));

  const makeMode = () =>
      new ModeMove({
        controller: () => ctrl,
        svgHandler: svgh,
        selectionHandler: selh,
      });

  return { makeMode };
};

let makeMode;

beforeEach(async () => {
  jest.clearAllMocks();
  ({makeMode} = await loadFresh());
});

describe('ModeMove (no jsdom)', () => {
  test('enable: activates button + initializes data', () => {
    const m = makeMode();
    m.enable();

    expect(d3.select).toHaveBeenCalledWith('#move');
    expect(m.data).toEqual({ cursor: undefined, nodePos: {}, qPos: {} });
  });

  test('onMouseDown: stores cursor, node positions, edge q positions including affectedEdges', () => {
    const m = makeMode();
    m.enable();

    const n1 = { id: 1, pos: { x: 1, y: 2 } };
    const n2 = { id: 2, pos: { x: 10, y: 20 } };
    const e1 = { id: 10, q: { x: 5, y: 6 } };
    const e2 = { id: 11, q: { x: 7, y: 8 } };
    const ae = { edge: { id: 12, q: { x: 9, y: 10 } } };

    selh.selectedNodes = [n1, n2];
    selh.selectedEdges = [e1, e2];
    selh.affectedEdges = [ae];

    const cursor = { x: 100, y: 200 };
    m.onMouseDown(cursor);

    expect(m.data.cursor).toBe(cursor);
    expect(m.data.nodePos).toEqual({ 1: n1.pos, 2: n2.pos });
    expect(m.data.qPos).toEqual({ 10: e1.q, 11: e2.q, 12: ae.edge.q });
  });

  test('onMouseMove: when cursor undefined does nothing', () => {
    const m = makeMode();
    m.enable();

    m.onMouseMove({ x: 1, y: 1 });
    expect(svgh.updateNode).not.toHaveBeenCalled();
    expect(svgh.updateEdge).not.toHaveBeenCalled();
    expect(svgh.updateMessage).not.toHaveBeenCalled();
  });

  test('onMouseMove: translates selected nodes/edges by dx,dy and affected edges by dx/2,dy/2', () => {
    const m = makeMode();
    m.enable();

    const n1 = { id: 1, pos: { x: 1, y: 2 } };
    const n2 = { id: 2, pos: { x: 10, y: 20 } };
    const e1 = { id: 10, q: { x: 5, y: 6 } };
    const ae = { edge: { id: 12, q: { x: 9, y: 10 } } };

    selh.selectedNodes = [n1, n2];
    selh.selectedEdges = [e1];
    selh.affectedEdges = [ae];

    m.onMouseDown({ x: 100, y: 100 });
    m.onMouseMove({ x: 110, y: 120 }); // dx=10, dy=20

    expect(n1.pos).toEqual({ x: 1 + 10, y: 2 + 20 });
    expect(n2.pos).toEqual({ x: 10 + 10, y: 20 + 20 });
    expect(svgh.updateNode).toHaveBeenCalledWith(n1);
    expect(svgh.updateNode).toHaveBeenCalledWith(n2);

    expect(e1.q).toEqual({ x: 5 + 10, y: 6 + 20 });
    expect(svgh.updateEdge).toHaveBeenCalledWith(e1);

    // affected edge moves by half
    expect(ae.edge.q).toEqual({ x: 9 + 5, y: 10 + 10 });
    expect(svgh.updateEdge).toHaveBeenCalledWith(ae.edge);

    expect(svgh.updateMessage).toHaveBeenCalledTimes(1);
  });

  test('onMouseUp: clears cursor', () => {
    const m = makeMode();
    m.enable();
    m.onMouseDown({ x: 1, y: 1 });
    expect(m.data.cursor).toBeDefined();
    m.onMouseUp();
    expect(m.data.cursor).toBeUndefined();
  });

  test('onEscape returns MODE_SELECT', () => {
    const m = makeMode();
    expect(m.onEscape()).toBe('MODE_SELECT');
  });

  test('disable deactivates button', () => {
    const m = makeMode();
    m.enable();
    m.disable();
    expect(d3.select).toHaveBeenCalledWith('#move');
  });
});
