// graphValidation.test.js (ESM, Node env, NO jsdom)

import { describe, test, expect, jest, beforeEach } from '@jest/globals';

let validateGraph;

// Mock d3.polygonContains used by graphValidation.js :contentReference[oaicite:3]{index=3}
let polygonContainsMock;

const loadFresh = async () => {
  jest.resetModules();

  polygonContainsMock = jest.fn();

  await jest.unstable_mockModule('d3', () => ({
    __esModule: true,
    polygonContains: polygonContainsMock,
  }));

  ({ validateGraph } = await import('../../src/business-logic/services/graphValidation.js'));
};

beforeEach(async () => {
  jest.clearAllMocks();
  await loadFresh();
});

const msg = {
  empty: 'EMPTY',
  morethan2forms: 'MORE_THAN_2',
  open1: 'OPEN_1',
  open2: 'OPEN_2',
  concentric: 'CONCENTRIC',
  validate: 'INTERSECT',
};

const formatMessage = (m) => `FMT:${m}`;

function makeSvgHandler() {
  return {
    clearWarnings: jest.fn(),
    setIntersections: jest.fn(),
  };
}

function makeGraphReturning(data) {
  return {
    validate: jest.fn(() => ({
      // validateGraph mutates data.valid and may set data.outer :contentReference[oaicite:4]{index=4}
      valid: true,
      outer: undefined,
      ...data,
    })),
  };
}

describe('validateGraph (graphValidation.js) - no jsdom', () => {
  test('clears warnings, sets data.valid=false initially, then returns valid=false with error when forms empty', () => {
    const svg = makeSvgHandler();
    const graph = makeGraphReturning({ forms: [], intersections: [] });

    const result = validateGraph(graph, svg, formatMessage, msg);

    expect(svg.clearWarnings).toHaveBeenCalledTimes(1);
    expect(graph.validate).toHaveBeenCalledTimes(1);

    expect(result.errors).toEqual(['FMT:EMPTY']);
    expect(result.warnings).toEqual([]);
    expect(result.valid).toBe(false);
  });

  test('forms > 2 => error morethan2forms, valid=false', () => {
    const svg = makeSvgHandler();
    const graph = makeGraphReturning({
      forms: [{}, {}, {}],
      intersections: [],
    });

    const result = validateGraph(graph, svg, formatMessage, msg);

    expect(result.errors).toEqual(['FMT:MORE_THAN_2']);
    expect(result.valid).toBe(false);
  });

  test('one form open => warning open1, valid=true (no errors)', () => {
    const svg = makeSvgHandler();
    const graph = makeGraphReturning({
      forms: [{ closed: false }],
      intersections: [],
    });

    const result = validateGraph(graph, svg, formatMessage, msg);

    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual(['FMT:OPEN_1']);
    expect(result.valid).toBe(true);
  });

  test('two forms but not both closed => warning open2, no outer computed', () => {
    const svg = makeSvgHandler();
    const graph = makeGraphReturning({
      forms: [
        { closed: true, meta: { width: 10, height: 10, center: { x: 5, y: 5 } }, points: [] },
        { closed: false, meta: { width: 20, height: 20, center: { x: 10, y: 10 } }, points: [] },
      ],
      intersections: [],
    });

    const result = validateGraph(graph, svg, formatMessage, msg);

    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual(['FMT:OPEN_2']);
    expect(result.outer).toBeUndefined();
    expect(result.valid).toBe(true);
    expect(polygonContainsMock).not.toHaveBeenCalled();
  });

  test('two closed forms: f0 smaller and inside f1 => sets data.outer=1', () => {
    const svg = makeSvgHandler();

    polygonContainsMock.mockReturnValue(true);

    const f0 = {
      closed: true,
      meta: { width: 10, height: 10, center: { x: 5, y: 5 } },
      points: [[0,0],[10,0],[10,10],[0,10]],
    };
    const f1 = {
      closed: true,
      meta: { width: 20, height: 20, center: { x: 10, y: 10 } },
      points: [[-5,-5],[25,-5],[25,25],[-5,25]],
    };

    const graph = makeGraphReturning({ forms: [f0, f1], intersections: [] });

    const result = validateGraph(graph, svg, formatMessage, msg);

    // f0 smaller => checks center of f0 is inside form1.points :contentReference[oaicite:5]{index=5}
    expect(polygonContainsMock).toHaveBeenCalledTimes(1);
    expect(polygonContainsMock).toHaveBeenCalledWith(f1.points, [5, 5]);
    expect(result.outer).toBe(1);
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
  });

  test('two closed forms: f0 smaller but NOT inside f1 => concentric error, valid=false', () => {
    const svg = makeSvgHandler();

    polygonContainsMock.mockReturnValue(false);

    const f0 = {
      closed: true,
      meta: { width: 10, height: 10, center: { x: 5, y: 5 } },
      points: [[0,0],[10,0],[10,10],[0,10]],
    };
    const f1 = {
      closed: true,
      meta: { width: 20, height: 20, center: { x: 10, y: 10 } },
      points: [[100,100],[200,100],[200,200],[100,200]],
    };

    const graph = makeGraphReturning({ forms: [f0, f1], intersections: [] });

    const result = validateGraph(graph, svg, formatMessage, msg);

    expect(result.errors).toEqual(['FMT:CONCENTRIC']);
    expect(result.valid).toBe(false);
    expect(result.outer).toBeUndefined();
  });

  test('two closed forms: f0 larger and contains f1 => sets data.outer=0', () => {
    const svg = makeSvgHandler();
    polygonContainsMock.mockReturnValue(true);

    const f0 = {
      closed: true,
      meta: { width: 30, height: 30, center: { x: 15, y: 15 } },
      points: [[0,0],[30,0],[30,30],[0,30]],
    };
    const f1 = {
      closed: true,
      meta: { width: 10, height: 10, center: { x: 5, y: 5 } },
      points: [[2,2],[8,2],[8,8],[2,8]],
    };

    const graph = makeGraphReturning({ forms: [f0, f1], intersections: [] });

    const result = validateGraph(graph, svg, formatMessage, msg);

    // f0 bigger => checks center of f1 inside f0.points :contentReference[oaicite:6]{index=6}
    expect(polygonContainsMock).toHaveBeenCalledWith(f0.points, [5, 5]);
    expect(result.outer).toBe(0);
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
  });

  test('two closed forms: neither strictly contains by width/height => concentric error', () => {
    const svg = makeSvgHandler();

    const f0 = {
      closed: true,
      meta: { width: 10, height: 20, center: { x: 5, y: 10 } },
      points: [],
    };
    const f1 = {
      closed: true,
      meta: { width: 20, height: 10, center: { x: 10, y: 5 } },
      points: [],
    };

    const graph = makeGraphReturning({ forms: [f0, f1], intersections: [] });

    const result = validateGraph(graph, svg, formatMessage, msg);

    expect(result.errors).toEqual(['FMT:CONCENTRIC']);
    expect(result.valid).toBe(false);
    expect(polygonContainsMock).not.toHaveBeenCalled();
  });

  test('intersection warnings: intersections > 0 => calls svgHandler.setIntersections and adds validate warning', () => {
    const svg = makeSvgHandler();
    const graph = makeGraphReturning({
      forms: [{ closed: true }],
      intersections: [[1, 1], [2, 2]],
    });

    const result = validateGraph(graph, svg, formatMessage, msg);

    expect(svg.setIntersections).toHaveBeenCalledTimes(1);
    expect(svg.setIntersections).toHaveBeenCalledWith([[1, 1], [2, 2]]);
    expect(result.warnings).toEqual(['FMT:INTERSECT']);
  });
});
