// ModeSelect.test.js (ESM, Node env, NO jsdom)

import { describe, test, expect, jest, beforeEach } from '@jest/globals';

let ModeSelect;
let svgh, selh, ctrl;
let d3;

const loadFresh = async () => {
  jest.resetModules();

  // --- d3 mock ---
  const selections = new Map();
  const makeSelection = () => {
    const api = {
      classed: jest.fn(() => api),
      attr: jest.fn(() => api),
      property: jest.fn(() => api),
      on: jest.fn(() => api),
      style: jest.fn(() => api),
      text: jest.fn(() => api),
    };
    return api;
  };

  d3 = {
    select: jest.fn((selector) => {
      if (!selections.has(selector)) selections.set(selector, makeSelection());
      return selections.get(selector);
    }),
  };
  await jest.unstable_mockModule('d3', () => ({ __esModule: true, ...d3 }));

  // --- SelectionHandler mock ---
  selh = {
    clear: jest.fn(),
    selectNode: jest.fn(),
    selectEdge: jest.fn(),
    startRectSelection: jest.fn(),
    moveRectSelection: jest.fn(),
    endRectSelection: jest.fn(),
    cancelRectSelection: jest.fn(),
    isRectActive: jest.fn(() => false),
    isAnySelected: jest.fn(() => false),
    selectedNodes: [],
    selectedEdges: [],
  };

  // --- SvgHandler mock ---
  svgh = {
    focus: { obj: undefined, type: undefined },
    updateNode: jest.fn(),
    updateEdge: jest.fn(),
    updateMessage: jest.fn(),
    setQEdge: jest.fn(),
    setQEdgeVisibility: jest.fn(),
  };

  ctrl = { modi: { MODE_SELECT: 'MODE_SELECT' } };

  // AbstractMode is imported by ModeSelect; keep it real, but it imports d3 (already mocked)
  ({ default: ModeSelect } = await import('../../src/business-logic/modes/ModeSelect.js'));

  const makeMode = () =>
      new ModeSelect({
        controller: () => ctrl,
        svgHandler: svgh,
        selectionHandler: selh,
      });

  return { selections, makeMode };
};

let makeMode;

beforeEach(async () => {
  jest.clearAllMocks();
  ({ makeMode } = await loadFresh());
});

describe('ModeSelect (no jsdom)', () => {
  test('enable: activates #select, clears selection, disables buttons, resets data', async () => {
    const m = makeMode();
    const spyEnableButtons = jest.spyOn(m, 'enableButtons');

    m.enable();

    expect(d3.select).toHaveBeenCalledWith('#select');
    // activeMode true
    // We can't easily pinpoint which select call is which without selector map,
    // but we CAN assert classed called for #select via d3.select calls.
    expect(d3.select).toHaveBeenCalledWith('#select');

    // Selection cleared
    expect(selh.clear).toHaveBeenCalledTimes(1);

    // Buttons disabled in enable()
    expect(spyEnableButtons).toHaveBeenCalledWith({
      move: false, rotate: false, copy: false, mirror: false, erase: false,
    });

    // Data reset shape
    expect(m.data).toEqual({ cursor: undefined, edge: undefined, node: undefined });
  });

  test('onMouseDown: when focus is node -> selectNode + stores original pos + q snapshot', () => {
    const m = makeMode();
    m.enable();

    const edge1 = { q: { x: 1, y: 2 } };
    const edge2 = { q: { x: 3, y: 4 } };
    const node = { pos: { x: 10, y: 20 }, adjacent: [edge1, edge2] };

    svgh.focus = { obj: node, type: 'node' };

    const cursor = { x: 100, y: 200 };
    m.onMouseDown(cursor);

    expect(m.data.cursor).toBe(cursor);
    expect(selh.selectNode).toHaveBeenCalledWith(node);

    expect(m.data.node.original).toBe(node);
    // stores reference to original pos object per implementation :contentReference[oaicite:1]{index=1}
    expect(m.data.node.pos).toBe(node.pos);
    expect(m.data.node.q).toEqual([{ x: 1, y: 2 }, { x: 3, y: 4 }]);
  });

  test('onMouseDown: when focus is edge -> selectEdge', () => {
    const m = makeMode();
    m.enable();

    const edge = { id: 5 };
    svgh.focus = { obj: edge, type: 'edge' };

    m.onMouseDown({ x: 0, y: 0 });

    expect(selh.selectEdge).toHaveBeenCalledWith(edge);
    expect(m.data.edge).toBeUndefined();
  });

  test('onMouseDown: when focus is q -> selectEdge + stores edge q + shows q-edge', () => {
    const m = makeMode();
    m.enable();

    const edge = { q: { x: 7, y: 8 } };
    svgh.focus = { obj: edge, type: 'q' };

    m.onMouseDown({ x: 0, y: 0 });

    expect(selh.selectEdge).toHaveBeenCalledWith(edge);
    expect(m.data.edge.original).toBe(edge);
    expect(m.data.edge.q).toBe(edge.q);

    expect(svgh.setQEdge).toHaveBeenCalledWith(edge);
    expect(svgh.setQEdgeVisibility).toHaveBeenCalledWith(true);
  });

  test('onMouseDown: when no focus -> starts rectangle selection', () => {
    const m = makeMode();
    m.enable();

    svgh.focus = { obj: undefined, type: undefined };

    const p = { x: 1, y: 2 };
    m.onMouseDown(p);

    expect(selh.startRectSelection).toHaveBeenCalledWith(p);
  });

  test('onMouseMove: when rect active -> moveRectSelection + updateMessage', () => {
    const m = makeMode();
    m.enable();

    selh.isRectActive.mockReturnValue(true);

    const p = { x: 9, y: 9 };
    m.onMouseMove(p);

    expect(selh.moveRectSelection).toHaveBeenCalledWith(p);
    expect(svgh.updateMessage).toHaveBeenCalledTimes(1);
  });

  test('onMouseMove: when dragging node -> updates node.pos, updateNode, updates adjacent q + updateEdge, updateMessage', () => {
    const m = makeMode();
    m.enable();

    const adja1 = { q: { x: 10, y: 10 } };
    const adja2 = { q: { x: 20, y: 20 } };
    const node = { pos: { x: 5, y: 6 }, adjacent: [adja1, adja2] };

    svgh.focus = { obj: node, type: 'node' };
    m.onMouseDown({ x: 100, y: 100 }); // cursor

    // move by +10,+20
    m.onMouseMove({ x: 110, y: 120 });

    expect(node.pos).toEqual({ x: 15, y: 26 });
    expect(svgh.updateNode).toHaveBeenCalledWith(node);

    // adja.q uses +0.5 delta per code :contentReference[oaicite:2]{index=2}
    expect(adja1.q).toEqual({ x: 10 + 10 * 0.5, y: 10 + 20 * 0.5 });
    expect(adja2.q).toEqual({ x: 20 + 10 * 0.5, y: 20 + 20 * 0.5 });
    expect(svgh.updateEdge).toHaveBeenCalledWith(adja1);
    expect(svgh.updateEdge).toHaveBeenCalledWith(adja2);

    expect(svgh.updateMessage).toHaveBeenCalledTimes(1);
  });

  test('onMouseMove: when dragging q-point -> updates edge.q, updateEdge, setQEdge, updateMessage', () => {
    const m = makeMode();
    m.enable();

    const edge = { q: { x: 1, y: 2 } };
    svgh.focus = { obj: edge, type: 'q' };

    m.onMouseDown({ x: 10, y: 10 });
    m.onMouseMove({ x: 14, y: 19 }); // delta +4,+9

    expect(edge.q).toEqual({ x: 1 + 4, y: 2 + 9 });
    expect(svgh.updateEdge).toHaveBeenCalledWith(edge);
    expect(svgh.setQEdge).toHaveBeenCalledWith(edge);
    expect(svgh.updateMessage).toHaveBeenCalledTimes(1);
  });

  test('onMouseUp: if edge drag active -> clears data.edge and hides q-edge', () => {
    const m = makeMode();
    m.enable();

    const edge = { q: { x: 0, y: 0 } };
    svgh.focus = { obj: edge, type: 'q' };

    m.onMouseDown({ x: 0, y: 0 });
    expect(m.data.edge).toBeDefined();

    m.onMouseUp();

    expect(m.data.edge).toBeUndefined();
    expect(svgh.setQEdgeVisibility).toHaveBeenCalledWith(false);
  });

  test('onMouseUp: if node drag active -> clears data.node', () => {
    const m = makeMode();
    m.enable();

    const node = { pos: { x: 0, y: 0 }, adjacent: [] };
    svgh.focus = { obj: node, type: 'node' };

    m.onMouseDown({ x: 0, y: 0 });
    expect(m.data.node).toBeDefined();

    m.onMouseUp();
    expect(m.data.node).toBeUndefined();
  });

  test('onMouseUp: if rect active -> ends rect selection', () => {
    const m = makeMode();
    m.enable();

    selh.isRectActive.mockReturnValue(true);

    m.onMouseUp();
    expect(selh.endRectSelection).toHaveBeenCalledTimes(1);
  });

  test('onMouseUp: enables buttons when selection exists; mirror enabled when checkMirror returns true', () => {
    const m = makeMode();
    m.enable();

    // Force "selection exists"
    selh.isAnySelected.mockReturnValue(true);

    // Construct a mirror-valid selection for checkMirror():
    // - exactly two nodes with adjacent.length === 1 (tails)
    // - all nodes have adjacent.length > 0
    // - connected component size reduces to 1 via edges union
    const t1 = { id: 1, adjacent: [{}] };
    const t2 = { id: 2, adjacent: [{}] };
    const mid = { id: 3, adjacent: [{}, {}] };

    const e1 = { from: { id: 1 }, to: { id: 3 } };
    const e2 = { from: { id: 3 }, to: { id: 2 } };

    selh.selectedNodes = [t1, t2, mid];
    selh.selectedEdges = [e1, e2];

    const spyEnableButtons = jest.spyOn(m, 'enableButtons');

    m.onMouseUp();

    // mirror should be true here
    expect(spyEnableButtons).toHaveBeenCalledWith({
      move: true, rotate: true, copy: true, mirror: true, erase: true,
    });
  });

  test('checkMirror edge case: returns false if any selected node has adjacent.length === 0', () => {
    const m = makeMode();
    m.enable();

    selh.isAnySelected.mockReturnValue(true);

    const bad = { id: 1, adjacent: [] }; // triggers immediate false :contentReference[oaicite:3]{index=3}
    selh.selectedNodes = [bad];
    selh.selectedEdges = [];

    const spyEnableButtons = jest.spyOn(m, 'enableButtons');

    m.onMouseUp();

    expect(spyEnableButtons).toHaveBeenCalledWith({
      move: true, rotate: true, copy: true, mirror: false, erase: true,
    });
  });

  test('checkMirror edge case: returns false if number of tails (adjacent.length===1) is not 2', () => {
    const m = makeMode();
    m.enable();

    selh.isAnySelected.mockReturnValue(true);

    const t1 = { id: 1, adjacent: [{}] };      // 1 tail only
    const mid = { id: 2, adjacent: [{}, {}] }; // not tail
    selh.selectedNodes = [t1, mid];
    selh.selectedEdges = [];

    const spyEnableButtons = jest.spyOn(m, 'enableButtons');

    m.onMouseUp();

    expect(spyEnableButtons).toHaveBeenCalledWith({
      move: true, rotate: true, copy: true, mirror: false, erase: true,
    });
  });

  test('checkMirror edge case: returns false when selection is not one connected component (size !== 1)', () => {
    const m = makeMode();
    m.enable();

    selh.isAnySelected.mockReturnValue(true);

    // Two tails exist, but no edges connecting components => size stays > 1
    const t1 = { id: 1, adjacent: [{}] };
    const t2 = { id: 2, adjacent: [{}] };
    const mid = { id: 3, adjacent: [{}, {}] };

    selh.selectedNodes = [t1, t2, mid];
    selh.selectedEdges = []; // no unions

    const spyEnableButtons = jest.spyOn(m, 'enableButtons');

    m.onMouseUp();

    expect(spyEnableButtons).toHaveBeenCalledWith({
      move: true, rotate: true, copy: true, mirror: false, erase: true,
    });
  });

  test('onMouseUp: disables buttons when nothing is selected', () => {
    const m = makeMode();
    m.enable();

    selh.isAnySelected.mockReturnValue(false);

    const spyEnableButtons = jest.spyOn(m, 'enableButtons');

    m.onMouseUp();

    expect(spyEnableButtons).toHaveBeenCalledWith({
      move: false, rotate: false, copy: false, mirror: false, erase: false,
    });
  });

  test('onEscape: clears selection and disables buttons', () => {
    const m = makeMode();
    m.enable();

    const spyEnableButtons = jest.spyOn(m, 'enableButtons');

    m.onEscape();

    expect(selh.clear).toHaveBeenCalledTimes(2); // once in enable(), once in onEscape()
    expect(spyEnableButtons).toHaveBeenCalledWith({
      move: false, rotate: false, copy: false, mirror: false, erase: false,
    });
  });

  test('disable: deactivates #select and cancels rect selection', () => {
    const m = makeMode();
    m.enable();

    m.disable();

    expect(d3.select).toHaveBeenCalledWith('#select');
    expect(selh.cancelRectSelection).toHaveBeenCalledTimes(1);
  });
});
