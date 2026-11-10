// useCanvasConfig.test.js (ESM, Node env, NO jsdom)

import { describe, test, expect, jest, beforeEach } from "@jest/globals";

let useCanvasConfig;

// ---- mutable stubs so each test can control behavior ----
let handler;
let controller;

// ---- minimal React hook mocks (no renderer / no jsdom) ----
function makeReactMock() {
  const setters = {
    setShowGrid: jest.fn(),
    setZoomIndex: jest.fn(),
  };

  let stateCall = 0;

  return {
    __setters: setters,

    useState: jest.fn((init) => {
      stateCall += 1;
      const value = typeof init === "function" ? init() : init;

      if (stateCall === 1) return [value, setters.setShowGrid]; // showGrid
      if (stateCall === 2) return [value, setters.setZoomIndex]; // zoomIndex

      throw new Error("Unexpected extra useState call");
    }),

    useMemo: jest.fn((fn) => fn()),
    useCallback: jest.fn((fn) => fn),
  };
}

async function loadFresh({
                           grid = true,
                           zoomLevel = 3,
                           size = 240,
                           zoomLevels = [1.0, 1.2, 1.5],
                           raster = 6,
                         } = {}) {
  jest.resetModules();
  jest.clearAllMocks();

  // stubs based on test inputs
  handler = {
    getZoomLevel: jest.fn(() => zoomLevel),
    getDrawingAreaSize: jest.fn(() => size),
    getZoomLevels: jest.fn(() => zoomLevels),
    getRasterSpace: jest.fn(() => raster),
    setZoomLevel: jest.fn(),
  };

  controller = { grid };

  const reactMock = makeReactMock();

  // Mock react hooks
  await jest.unstable_mockModule("react", () => ({
    __esModule: true,
    useState: reactMock.useState,
    useMemo: reactMock.useMemo,
    useCallback: reactMock.useCallback,
  }));

  // ✅ IMPORTANT: hook uses useServices(), not .instance singletons
  await jest.unstable_mockModule(
      "../../src/business-logic/services/ServicesProvider.jsx",
      () => ({
        __esModule: true,
        useServices: () => ({ svgHandler: handler, controller }),
      })
  );

  // Import after mocks are in place
  ({ default: useCanvasConfig } = await import(
      "../../src/ui/pages/Start/hooks/useCanvasConfig.js"
      ));

  return { reactMock };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("useCanvasConfig (no jsdom)", () => {
  test("initial values: showGrid comes from controller.grid; zoomIndex initializes from handler.getZoomLevel()-1", async () => {
    const { reactMock } = await loadFresh({ grid: false, zoomLevel: 3, size: 240 });

    const cfg = useCanvasConfig();

    expect(cfg.showGrid).toBe(false);
    expect(cfg.zoomIndex).toBe(2);

    expect(cfg.size).toBe(240);
    expect(cfg.viewBox).toBe("0 0 240 240");
    expect(cfg.translate).toBe("translate(120,120)");
    expect(cfg.zoomLevels).toEqual([1.0, 1.2, 1.5]);
    expect(cfg.raster).toBe(6);

    // smoke: ensure memo/callback were used
    expect(reactMock.useMemo).toHaveBeenCalledTimes(2);
    expect(reactMock.useCallback).toHaveBeenCalledTimes(2);
  });

  test("changeGrid: updates controller.grid and calls setShowGrid", async () => {
    const { reactMock } = await loadFresh({ grid: true });

    const cfg = useCanvasConfig();
    cfg.changeGrid(false);

    expect(controller.grid).toBe(false);
    expect(reactMock.__setters.setShowGrid).toHaveBeenCalledWith(false);

    cfg.changeGrid(true);
    expect(controller.grid).toBe(true);
    expect(reactMock.__setters.setShowGrid).toHaveBeenCalledWith(true);
  });

  test("changeZoom: parses idx base-10, calls handler.setZoomLevel(zoom+1) and sets zoomIndex to zoom", async () => {
    const { reactMock } = await loadFresh({ zoomLevel: 1 });

    const cfg = useCanvasConfig();

    cfg.changeZoom("0");
    expect(handler.setZoomLevel).toHaveBeenCalledWith(1);
    expect(reactMock.__setters.setZoomIndex).toHaveBeenCalledWith(0);

    cfg.changeZoom("2");
    expect(handler.setZoomLevel).toHaveBeenCalledWith(3);
    expect(reactMock.__setters.setZoomIndex).toHaveBeenCalledWith(2);
  });

  test("edge case: changeZoom whitespace/leading zeros", async () => {
    const { reactMock } = await loadFresh();

    const cfg = useCanvasConfig();

    cfg.changeZoom(" 01 ");
    expect(handler.setZoomLevel).toHaveBeenCalledWith(2);
    expect(reactMock.__setters.setZoomIndex).toHaveBeenCalledWith(1);
  });

  test("edge case: changeZoom non-numeric propagates NaN (documents current behavior)", async () => {
    const { reactMock } = await loadFresh();

    const cfg = useCanvasConfig();

    cfg.changeZoom("abc");
    expect(handler.setZoomLevel).toHaveBeenCalledWith(NaN);
    expect(reactMock.__setters.setZoomIndex).toHaveBeenCalledWith(NaN);
  });

  test("edge case: getZoomLevel returns 0 => zoomIndex initializes to -1", async () => {
    await loadFresh({ zoomLevel: 0 });

    const cfg = useCanvasConfig();
    expect(cfg.zoomIndex).toBe(-1);
  });

  test("edge case: size 0 => viewBox and translate are zeroed", async () => {
    await loadFresh({ size: 0 });

    const cfg = useCanvasConfig();
    expect(cfg.viewBox).toBe("0 0 0 0");
    expect(cfg.translate).toBe("translate(0,0)");
  });
});
