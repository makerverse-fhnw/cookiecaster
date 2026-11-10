// SvgHandler.test.js (ESM, Node environment, no jsdom)

import { describe, test, expect, jest, beforeEach } from '@jest/globals';

let SvgHandler;
let d3Mock;
let graphStub;
let selections;

// --------- d3 mock with chainable selections + stored handlers ----------

function makeSelection(selector) {
  const state = {
    selector,
    attrs: new Map(),
    classes: new Map(),
    textValue: '',
    children: [],
    removed: false,
    handlers: new Map(), // eventName -> fn
  };

  const api = {
    __state: state,
    append: jest.fn((tag) => {
      const child = makeSelection(`${selector}::${tag}#${state.children.length}`);
      child.__state.tag = tag;
      state.children.push(child);
      return child;
    }),
    attr: jest.fn((k, v) => {
      if (v === undefined) return state.attrs.get(k);
      state.attrs.set(k, v);
      return api;
    }),
    text: jest.fn((v) => {
      state.textValue = v;
      return api;
    }),
    classed: jest.fn((cls, v) => {
      if (v === undefined) return state.classes.get(cls) ?? false;
      state.classes.set(cls, v);
      return api;
    }),
    on: jest.fn((eventName, fn) => {
      state.handlers.set(eventName, fn);
      return api;
    }),
    remove: jest.fn(() => {
      state.removed = true;
      return api;
    }),
    selectAll: jest.fn(() => {
      // simple child selection used in clearWarnings/clear
      return {
        remove: jest.fn(() => {
          // clear children
          state.children.length = 0;
        }),
      };
    }),
  };

  return api;
}

function getSel(selector) {
  if (!selections.has(selector)) selections.set(selector, makeSelection(selector));
  return selections.get(selector);
}

async function loadFreshModule({ touch = false } = {}) {
  jest.resetModules();
  selections = new Map();

  // Stub globals used in constructor: window + navigator.maxTouchPoints :contentReference[oaicite:2]{index=2}
  globalThis.window = touch ? { ontouchstart: () => {} } : {};
  globalThis.navigator = { maxTouchPoints: touch ? 5 : 0 };

  // Graph stub used by updateMessage() :contentReference[oaicite:3]{index=3}
  graphStub = {
    forEachNode: jest.fn(),
    forEachEdge: jest.fn(),
  };

  // Mock d3 module (select/selectAll)
  d3Mock = {
    select: jest.fn((selector) => getSel(selector)),
    selectAll: jest.fn((selector) => getSel(`ALL:${selector}`)),
  };

  await jest.unstable_mockModule('d3', () => ({
    __esModule: true,
    ...d3Mock,
  }));

  ({ default: SvgHandler } = await import('../../src/business-logic/handlers/SvgHandler.js'));
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('SvgHandler (no jsdom)', () => {
  test('touch vs mouse events: _e uses pointer events on touch devices', async () => {
    await loadFreshModule({ touch: true });
    const h = new SvgHandler(() => graphStub);
    // enter/leave chosen from isTouch branch :contentReference[oaicite:4]{index=4}
    expect(h._e.enter).toBe('pointerover');
    expect(h._e.leave).toBe('pointerout');
  });

  test('touch vs mouse events: _e uses mouse events on non-touch devices', async () => {
    await loadFreshModule({ touch: false });
    const h = new SvgHandler(() => graphStub);
    expect(h._e.enter).toBe('mouseenter');
    expect(h._e.leave).toBe('mouseleave');
  });

  test('getters return constants and zoom level', async () => {
    await loadFreshModule();
    const h = new SvgHandler(() => graphStub);

    expect(h.getRasterSpace()).toBe(6);
    expect(h.getDrawingAreaSize()).toBe(240);
    expect(h.getZoomLevels()).toEqual([1.0, 1.2, 1.5, 2.0, 3.0]);
    expect(h.getZoomLevel()).toBe(1);
  });

  test('setZoomLevel updates _zoomLevel and calls updateMessage()', async () => {
    await loadFreshModule();
    const h = new SvgHandler(() => graphStub);

    const spy = jest.spyOn(h, 'updateMessage');
    h.setZoomLevel(2);

    expect(h.getZoomLevel()).toBe(2);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  test('move edge helpers set correct attributes', async () => {
    await loadFreshModule();
    const h = new SvgHandler(() => graphStub);

    h.resetMoveEdge({ x: 1, y: 2 });
    expect(d3Mock.select).toHaveBeenCalledWith('#moveEdge');
    expect(getSel('#moveEdge').attr).toHaveBeenCalledWith('x1', 1);
    expect(getSel('#moveEdge').attr).toHaveBeenCalledWith('y1', 2);
    expect(getSel('#moveEdge').attr).toHaveBeenCalledWith('x2', 1);
    expect(getSel('#moveEdge').attr).toHaveBeenCalledWith('y2', 2);

    h.setMoveEdgeTo({ x: 9, y: 8 });
    expect(getSel('#moveEdge').attr).toHaveBeenCalledWith('x2', 9);
    expect(getSel('#moveEdge').attr).toHaveBeenCalledWith('y2', 8);

    h.setMoveEdgeVisible(true);
    expect(getSel('#moveEdge').attr).toHaveBeenCalledWith('visibility', 'visible');
    h.setMoveEdgeVisible(false);
    expect(getSel('#moveEdge').attr).toHaveBeenCalledWith('visibility', 'hidden');
  });

  test('rect selection helpers set d and visibility', async () => {
    await loadFreshModule();
    const h = new SvgHandler(() => graphStub);

    h.setRectSelection({ x: 1, y: 2 }, { x: 4, y: 6 });
    // rect() path: Mx y l w 0 l 0 h l -w 0 z :contentReference[oaicite:5]{index=5}
    expect(getSel('#selectionRect').attr).toHaveBeenCalledWith('d', 'M1 2 l 3 0 l 0 4 l -3 0 z');

    h.setRectSelectionVisible(true);
    expect(getSel('#selectionRect').attr).toHaveBeenCalledWith('visibility', 'visible');
    h.setRectSelectionVisible(false);
    expect(getSel('#selectionRect').attr).toHaveBeenCalledWith('visibility', 'hidden');
  });

  test('addNode/updateNode/selectNode/removeNode', async () => {
    await loadFreshModule();
    const h = new SvgHandler(() => graphStub);

    const node = { id: 7, pos: { x: 10, y: 20 } };

    h.addNode(node);

    // It appends a circle under #nodes with id n7 etc. :contentReference[oaicite:6]{index=6}
    expect(d3Mock.select).toHaveBeenCalledWith('#nodes');
    const nodesSel = getSel('#nodes');
    expect(nodesSel.append).toHaveBeenCalledWith('circle');
    const created = nodesSel.__state.children[0];
    expect(created.attr).toHaveBeenCalledWith('id', 'n7');
    expect(created.attr).toHaveBeenCalledWith('cx', 10);
    expect(created.attr).toHaveBeenCalledWith('cy', 20);

    // trigger enter/leave handlers to cover focus logic
    const enterEvent = h._e.enter;
    const leaveEvent = h._e.leave;
    created.__state.handlers.get(enterEvent)();
    expect(h.focus).toEqual({ obj: node, type: 'node' });

    created.__state.handlers.get(leaveEvent)();
    expect(h.focus.obj).toBeUndefined();

    // updateNode
    node.pos.x = 99;
    node.pos.y = 88;
    h.updateNode(node);
    expect(d3Mock.select).toHaveBeenCalledWith('#n7');
    expect(getSel('#n7').attr).toHaveBeenCalledWith('cx', 99);
    expect(getSel('#n7').attr).toHaveBeenCalledWith('cy', 88);

    // selectNode
    h.selectNode(node, true);
    expect(getSel('#n7').classed).toHaveBeenCalledWith('circleSelected', true);

    // removeNode
    h.removeNode(node);
    expect(getSel('#n7').remove).toHaveBeenCalledTimes(1);
  });

  test('q-edge visibility + setQEdge', async () => {
    await loadFreshModule();
    const h = new SvgHandler(() => graphStub);

    h.setQEdgeVisibility(true);
    expect(d3Mock.selectAll).toHaveBeenCalledWith('.qEdge');
    expect(getSel('ALL:.qEdge').attr).toHaveBeenCalledWith('visibility', 'visible');

    h.setQEdgeVisibility(false);
    expect(getSel('ALL:.qEdge').attr).toHaveBeenCalledWith('visibility', 'hidden');

    const edge = {
      from: { pos: { x: 1, y: 2 } },
      to: { pos: { x: 9, y: 8 } },
      q: { x: 5, y: 6 },
    };

    h.setQEdge(edge);
    expect(getSel('#qEdge1').attr).toHaveBeenCalledWith('x1', 1);
    expect(getSel('#qEdge1').attr).toHaveBeenCalledWith('y1', 2);
    expect(getSel('#qEdge1').attr).toHaveBeenCalledWith('x2', 5);
    expect(getSel('#qEdge1').attr).toHaveBeenCalledWith('y2', 6);

    expect(getSel('#qEdge2').attr).toHaveBeenCalledWith('x1', 9);
    expect(getSel('#qEdge2').attr).toHaveBeenCalledWith('y1', 8);
    expect(getSel('#qEdge2').attr).toHaveBeenCalledWith('x2', 5);
    expect(getSel('#qEdge2').attr).toHaveBeenCalledWith('y2', 6);
  });

  test('addEdge/updateEdge/removeEdge/selectEdge including hover branches', async () => {
    await loadFreshModule();
    const h = new SvgHandler(() => graphStub);

    const edge = {
      id: 3,
      q: { x: 7, y: 8 },
      from: { pos: { x: 1, y: 2 } },
      to: { pos: { x: 9, y: 10 } },
      asSvgPath: jest.fn(() => 'M0 0 Q 1 1 2 2'),
    };

    // create edge + q-circle
    h.addEdge(edge);

    const edgesSel = getSel('#edges');
    expect(edgesSel.append).toHaveBeenCalledWith('path');
    expect(edgesSel.append).toHaveBeenCalledWith('circle');

    const pathEl = edgesSel.__state.children[0];
    const qEl = edgesSel.__state.children[1];

    expect(pathEl.attr).toHaveBeenCalledWith('id', 'e3');
    expect(pathEl.attr).toHaveBeenCalledWith('d', 'M0 0 Q 1 1 2 2');

    expect(qEl.attr).toHaveBeenCalledWith('id', 'q3');
    expect(qEl.attr).toHaveBeenCalledWith('cx', 7);
    expect(qEl.attr).toHaveBeenCalledWith('cy', 8);
    expect(qEl.attr).toHaveBeenCalledWith('visibility', 'hidden');
    expect(qEl.classed).toHaveBeenCalledWith('qCircle', true);

    // Hover enter on edge path: shows q preview and sets focus
    pathEl.__state.handlers.get(h._e.enter)();
    expect(h.focus).toEqual({ obj: edge, type: 'edge' });
    expect(getSel('#q3').attr).toHaveBeenCalledWith('visibility', 'visible');

    // Hover leave on edge path:
    // branch A: NOT selected => hide q
    getSel('#e3').classed.mockImplementation((cls) => (cls === 'pathSelected' ? false : false));
    pathEl.__state.handlers.get(h._e.leave)();
    expect(getSel('#q3').attr).toHaveBeenCalledWith('visibility', 'hidden');
    expect(h.focus.obj).toBeUndefined();

    // branch B: selected => do not hide q
    getSel('#e3').classed.mockImplementation((cls) => (cls === 'pathSelected' ? true : false));
    pathEl.__state.handlers.get(h._e.leave)();
    // no new "hidden" required here, but handler executed

    // Hover enter on q-circle: focus type "q" + visible
    qEl.__state.handlers.get(h._e.enter)();
    expect(h.focus).toEqual({ obj: edge, type: 'q' });
    expect(getSel('#q3').attr).toHaveBeenCalledWith('visibility', 'visible');

    // Hover leave on q-circle:
    // branch A: not selected => hide, then focus cleared
    getSel('#e3').classed.mockImplementation((cls) => (cls === 'pathSelected' ? false : false));
    qEl.__state.handlers.get(h._e.leave)();
    expect(getSel('#q3').attr).toHaveBeenCalledWith('visibility', 'hidden');
    expect(h.focus.obj).toBeUndefined();

    // updateEdge updates path d and q position
    edge.q.x = 55;
    edge.q.y = 66;
    edge.asSvgPath.mockReturnValue('M1 1 Q 2 2 3 3');
    h.updateEdge(edge);
    expect(getSel('#e3').attr).toHaveBeenCalledWith('d', 'M1 1 Q 2 2 3 3');
    expect(getSel('#q3').attr).toHaveBeenCalledWith('cx', 55);
    expect(getSel('#q3').attr).toHaveBeenCalledWith('cy', 66);

    // selectEdge toggles class and visibility
    h.selectEdge(edge, true);
    expect(getSel('#e3').classed).toHaveBeenCalledWith('pathSelected', true);
    expect(getSel('#q3').attr).toHaveBeenCalledWith('visibility', 'visible');

    h.selectEdge(edge, false);
    expect(getSel('#e3').classed).toHaveBeenCalledWith('pathSelected', false);
    expect(getSel('#q3').attr).toHaveBeenCalledWith('visibility', 'hidden');

    // removeEdge removes both elements
    h.removeEdge(edge);
    expect(getSel('#e3').remove).toHaveBeenCalledTimes(1);
    expect(getSel('#q3').remove).toHaveBeenCalledTimes(1);
  });

  test('warnings: setCritNodes/setCritSeg/setIntersections + clearWarnings', async () => {
    await loadFreshModule();
    const h = new SvgHandler(() => graphStub);

    const warningsSel = getSel('#warnings');

    h.setCritNodes([{ pos: { x: 1, y: 2 } }, { pos: { x: 3, y: 4 } }]);
    expect(warningsSel.append).toHaveBeenCalledWith('circle');

    h.setCritSeg([{ p1: [0, 0], p2: [1, 1] }]);
    expect(warningsSel.append).toHaveBeenCalledWith('line');

    h.setIntersections([[9, 9]]);
    expect(warningsSel.append).toHaveBeenCalledWith('circle');

    h.clearWarnings();
    expect(getSel('#warnings').selectAll).toHaveBeenCalledWith('*');
  });

  test('getActZoomValue returns correct zoom factor', async () => {
    await loadFreshModule();
    const h = new SvgHandler(() => graphStub);

    h.setZoomLevel(3);
    expect(h.getActZoomValue()).toBe(1.5);
  });

  test('updateMessage: empty graph produces empty message text; non-empty produces Δx/Δy', async () => {
    await loadFreshModule();
    const h = new SvgHandler(() => graphStub);

    // Case A: empty graph (no callbacks invoked) => delta negative => mesg1/2 remain "" :contentReference[oaicite:7]{index=7}
    graphStub.forEachNode.mockImplementation(() => {});
    graphStub.forEachEdge.mockImplementation(() => {});
    h.updateMessage();

    expect(getSel('#message1').text).toHaveBeenCalledWith('');
    expect(getSel('#message2').text).toHaveBeenCalledWith('');

    // Case B: with nodes and an edge => deltaX/deltaY >= 0 => mesg computed
    graphStub.forEachNode.mockImplementation((cb) => {
      cb({ pos: { x: 10, y: 20 } });
      cb({ pos: { x: 110, y: 120 } });
    });
    graphStub.forEachEdge.mockImplementation((cb) => {
      cb({
        from: { pos: { x: 10, y: 20 } },
        to: { pos: { x: 110, y: 120 } },
        q: { x: 60, y: 10 },
      });
    });

    h.setZoomLevel(1); // zoom index 1 => factor 1.0
    h.updateMessage();

    const msg1 = getSel('#message1').__state.textValue;
    const msg2 = getSel('#message2').__state.textValue;
    expect(msg1.startsWith('Δx=')).toBe(true);
    expect(msg1.endsWith('cm')).toBe(true);
    expect(msg2.startsWith('Δy=')).toBe(true);
    expect(msg2.endsWith('cm')).toBe(true);
  });

  test('clear: clears warnings, resets ids/focus, clears nodes/edges, calls updateMessage', async () => {
    await loadFreshModule();
    const h = new SvgHandler(() => graphStub);

    // modify state first
    h.nodeID = 5;
    h.edgeID = 6;
    h.focus = { obj: { any: 1 }, type: 'node' };

    const spy = jest.spyOn(h, 'updateMessage');

    h.clear();

    expect(h.nodeID).toBe(0);
    expect(h.edgeID).toBe(0);
    expect(h.focus.obj).toBeUndefined();

    expect(getSel('#nodes').selectAll).toHaveBeenCalledWith('*');
    expect(getSel('#edges').selectAll).toHaveBeenCalledWith('*');
    expect(spy).toHaveBeenCalled();
  });
});
