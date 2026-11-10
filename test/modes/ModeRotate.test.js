// ModeRotate.test.js (ESM, Node env, NO jsdom)

import { describe, test, expect, jest, beforeEach } from '@jest/globals';

let ModeRotate;
let d3, svgh, selh, ctrl;

const asIterable = (arr) => ({
  [Symbol.iterator]: function* () { yield* arr; },
});

const loadFresh = async () => {
  jest.resetModules();

  d3 = { select: jest.fn(() => ({ classed: jest.fn() })) };
  await jest.unstable_mockModule('d3', () => ({ __esModule: true, ...d3 }));

  svgh = { updateNode: jest.fn(), updateEdge: jest.fn(), updateMessage: jest.fn() };

  // ModeRotate uses Array.from(selh.selectedNodes/selectedEdges) AND iterates selectedNodes/edges/affectedEdges with for..of :contentReference[oaicite:5]{index=5}
  selh = {
    selectedNodes: asIterable([]),
    selectedEdges: asIterable([]),
    affectedEdges: asIterable([]),
  };

  ctrl = { modi: { MODE_SELECT: 'MODE_SELECT' } };

  ({ default: ModeRotate } = await import('../../src/business-logic/modes/ModeRotate.js'));

  const makeMode = () =>
      new ModeRotate({
        controller: () => ctrl,
        svgHandler: svgh,
        selectionHandler: selh,
      });

  return { makeMode };
};

let makeMode;

beforeEach(async () => {
  jest.clearAllMocks();
  jest.spyOn(console, 'log').mockImplementation(() => {});
  ({ makeMode } = await loadFresh());
});

describe('ModeRotate (no jsdom)', () => {
  test('enable: activates rotate and initializes data', () => {
    const m = makeMode();
    m.enable();
    expect(d3.select).toHaveBeenCalledWith('#rotate');
    expect(m.data).toEqual({ pivot: null, vec: null, nodePos: {}, qPos: {} });
  });

  test('onMouseDown: logs and returns if nothing selected', () => {
    const m = makeMode();
    m.enable();

    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    m.onMouseDown({ x: 1, y: 1 });

    expect(logSpy).toHaveBeenCalledWith('No nodes or edges selected');
    expect(m.data.pivot).toBeNull();
    expect(m.data.vec).toBeNull();

    logSpy.mockRestore();
  });

  test('onMouseDown: computes pivot from selected nodes, stores nodePos and qPos (selected + affected)', () => {
    const m = makeMode();
    m.enable();

    const n1 = { id: 1, pos: { x: 0, y: 0 } };
    const n2 = { id: 2, pos: { x: 10, y: 0 } };
    const eSel = { id: 10, q: { x: 5, y: 2 } };
    const eAff = { edge: { id: 11, q: { x: 5, y: 1 } }, mod: n1 };

    selh.selectedNodes = asIterable([n1, n2]);
    selh.selectedEdges = asIterable([eSel]);
    selh.affectedEdges = asIterable([eAff]);

    m.onMouseDown({ x: 10, y: 10 });

    expect(m.data.pivot).toEqual({ x: 5, y: 0 }); // average
    expect(m.data.vec).toEqual({ x: 10 - 5, y: 10 - 0 });

    // stores originals
    expect(m.data.nodePos).toEqual({ 1: n1.pos, 2: n2.pos });
    expect(m.data.qPos).toEqual({ 10: eSel.q, 11: eAff.edge.q });
  });

  test('onMouseMove: no-op if vec is null', () => {
    const m = makeMode();
    m.enable();
    m.onMouseMove({ x: 1, y: 1 });
    expect(svgh.updateNode).not.toHaveBeenCalled();
    expect(svgh.updateEdge).not.toHaveBeenCalled();
    expect(svgh.updateMessage).not.toHaveBeenCalled();
  });

  test('onMouseMove: rotates selected nodes + edges, affected edges use half-angle; updates message', () => {
    const m = makeMode();
  m.enable();

  // Pivot should be at (0,0) because it averages selected node positions.
  // Use a node at (10,0) so pivot=(10,0) IF you select only this node.
  // To avoid that, select TWO nodes symmetric around origin so pivot=(0,0).
  const n1 = { id: 1, pos: { x: 10, y: 0 } };
  const n2 = { id: 2, pos: { x: -10, y: 0 } };

  const eSel = { id: 10, q: { x: 10, y: 0 } };
  const eAff = { edge: { id: 11, q: { x: 10, y: 0 } }, mod: n1 };

  selh.selectedNodes = asIterable([n1, n2]);
  selh.selectedEdges = asIterable([eSel]);
  selh.affectedEdges = asIterable([eAff]);

  // Mouse down at (10,0) => vec = (10,0) (non-zero) because pivot is (0,0)
  m.onMouseDown({ x: 10, y: 0 });

  // Move to (0,10) => +90° rotation around (0,0)
  m.onMouseMove({ x: 0, y: 10 });

  expect(n1.pos).toEqual({ x: 0, y: 10 });
  expect(n2.pos).toEqual({ x: 0, y: -10 });
  expect(svgh.updateNode).toHaveBeenCalledWith(n1);
  expect(svgh.updateNode).toHaveBeenCalledWith(n2);

  // selected edge q rotates full angle
  expect(eSel.q).toEqual({ x: 0, y: 10 });
  expect(svgh.updateEdge).toHaveBeenCalledWith(eSel);

  // affected edge rotates by half-angle (~45°): (10,0)->(7.07,7.07)->round5 => (7,7)
  expect(eAff.edge.q).toEqual({ x: 7, y: 7 });
  expect(svgh.updateEdge).toHaveBeenCalledWith(eAff.edge);

  expect(svgh.updateMessage).toHaveBeenCalledTimes(1);
});


  test('onMouseUp clears vec', () => {
    const m = makeMode();
    m.enable();
    // simulate set vec
    m.data.vec = { x: 1, y: 1 };
    m.onMouseUp();
    expect(m.data.vec).toBeNull();
  });

  test('onEscape returns MODE_SELECT', () => {
    const m = makeMode();
    expect(m.onEscape()).toBe('MODE_SELECT');
  });

  test('disable deactivates rotate', () => {
    const m = makeMode();
    m.enable();
    m.disable();
    expect(d3.select).toHaveBeenCalledWith('#rotate');
  });
});
