import { describe, test, expect, jest, beforeEach, afterEach } from "@jest/globals";

let useGraphStorage;

// ---- React hook mocks (run hook without rendering) ----
let lastEffectCleanup;
const reactMock = {
  useCallback: jest.fn((fn) => fn),
  useEffect: jest.fn((fn) => {
    lastEffectCleanup = fn(); // run immediately
  }),
};

// ---- in-memory localStorage mock ----
function makeStorage(initial = {}) {
  const m = new Map(Object.entries(initial));
  return {
    getItem: jest.fn((k) => (m.has(k) ? m.get(k) : null)),
    setItem: jest.fn((k, v) => m.set(k, String(v))),
    removeItem: jest.fn((k) => m.delete(k)),
    clear: jest.fn(() => m.clear()),
    __map: m,
  };
}

// ---- mutable singletons ----
let graphStub;
let svghStub;

let nowSpy;
let isoSpy;

async function loadFresh({ drawingsJSON } = {}) {
  jest.resetModules();
  jest.clearAllMocks();
  lastEffectCleanup = undefined;

  // globals
  globalThis.localStorage = makeStorage(
      drawingsJSON !== undefined ? { drawings: JSON.stringify(drawingsJSON) } : {}
  );

  // window mock (no jsdom)
  globalThis.window = globalThis.window || {};
  globalThis.window.prompt = jest.fn();
  globalThis.window.alert = jest.fn();

  // deterministic time
  nowSpy = jest.spyOn(Date, "now").mockReturnValue(1700000000000);
  isoSpy = jest
      .spyOn(Date.prototype, "toISOString")
      .mockReturnValue("2025-01-01T00:00:00.000Z");

  // stubs
  graphStub = {
    toJSON: jest.fn(() => ({ g: 1 })),
    validate: jest.fn(() => ({ forms: [{ path: "M0 0" }, { path: "M1 1" }] })),
    fromJSON: jest.fn(),
    fromSvg: jest.fn(),
  };

  svghStub = {
    updateMessage: jest.fn(),
  };

  // mocks
  await jest.unstable_mockModule("react", () => ({
    __esModule: true,
    useCallback: reactMock.useCallback,
    useEffect: reactMock.useEffect,
  }));

  // ✅ IMPORTANT: mock ServicesProvider hook used by useGraphStorage
  await jest.unstable_mockModule(
      "../../src/business-logic/services/ServicesProvider.jsx",
      () => ({
        __esModule: true,
        useServices: () => ({ graph: graphStub, svgHandler: svghStub }),
      })
  );

  // (Optional) You can remove these if not needed by the hook;
  // keeping is fine if other code imports them.
  await jest.unstable_mockModule("../../src/entities/graph/Graph.js", () => ({
    __esModule: true,
    default: class Graph {
      static get instance() {
        return graphStub;
      }
    },
  }));

  await jest.unstable_mockModule(
      "../../src/business-logic/handlers/SvgHandler.js",
      () => ({
        __esModule: true,
        default: class SvgHandler {
          static get instance() {
            return svghStub;
          }
        },
      })
  );

  ({ default: useGraphStorage } = await import(
      "../../src/ui/pages/Start/hooks/useGraphStorage.js"
      ));
}

const formatMessage = (x) => `FMT:${x}`;
const msgs = {
  enterName: "enterName",
  exampleName: "exampleName",
  noName: "noName",
  save: "save",
  noSave: "noSave",
};

beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  nowSpy?.mockRestore?.();
  isoSpy?.mockRestore?.();
});

describe("useGraphStorage (no jsdom)", () => {
  test("saveGraph: prompts for name; if cancelled (null) => alerts noName and does not save", async () => {
    await loadFresh();
    window.prompt.mockReturnValue(null);

    const { saveGraph } = useGraphStorage(formatMessage, msgs);
    saveGraph();

    expect(window.alert).toHaveBeenCalledWith("FMT:noName");
    expect(localStorage.setItem).not.toHaveBeenCalled();
  });

  test("saveGraph: blank/whitespace name => alerts noName and does not save", async () => {
    await loadFresh();
    window.prompt.mockReturnValue("   ");

    const { saveGraph } = useGraphStorage(formatMessage, msgs);
    saveGraph();

    expect(window.alert).toHaveBeenCalledWith("FMT:noName");
    expect(localStorage.setItem).not.toHaveBeenCalled();
  });

  test("saveGraph: success writes payload and alerts save", async () => {
    await loadFresh({ drawingsJSON: [{ id: "old", saved: true }] });

    window.prompt.mockReturnValue("  My Drawing  ");

    const { saveGraph } = useGraphStorage(formatMessage, msgs);
    saveGraph();

    expect(graphStub.validate).toHaveBeenCalledTimes(1);

    expect(localStorage.setItem).toHaveBeenCalledTimes(1);
    const [key, value] = localStorage.setItem.mock.calls[0];
    expect(key).toBe("drawings");

    const saved = JSON.parse(value);
    expect(saved).toHaveLength(2);

    const payload = saved[1];
    expect(payload.id).toBe("drawing-1700000000000");
    expect(payload.name).toBe("My Drawing");
    expect(payload.graphJSON).toEqual({ g: 1 });
    expect(payload.svgPath).toBe("M0 0 M1 1");
    expect(payload.saved).toBe(true);
    expect(payload.timestamp).toBe("2025-01-01T00:00:00.000Z");

    expect(window.alert).toHaveBeenCalledWith("FMT:save");
  });

  test('saveGraph edge case: Graph.validate returns undefined => svgPath becomes "" and still saves', async () => {
    await loadFresh({ drawingsJSON: [] });

    graphStub.validate.mockReturnValue(undefined);
    window.prompt.mockReturnValue("Name");

    const { saveGraph } = useGraphStorage(formatMessage, msgs);
    saveGraph();

    const saved = JSON.parse(localStorage.setItem.mock.calls[0][1]);
    expect(saved[0].svgPath).toBe("");
    expect(window.alert).toHaveBeenCalledWith("FMT:save");
  });

  test("edge case: invalid localStorage.drawings JSON throws during mount (current behavior)", async () => {
    await loadFresh();

    localStorage.getItem.mockImplementation((k) =>
        k === "drawings" ? "not-json" : null
    );

    expect(() => useGraphStorage(formatMessage, msgs)).toThrow(SyntaxError);
  });

  test("useEffect auto-restore: no unsaved drawing => does nothing", async () => {
    await loadFresh({
      drawingsJSON: [{ id: "a", saved: true, graphJSON: { a: 1 } }],
    });

    useGraphStorage(formatMessage, msgs);

    expect(graphStub.fromJSON).not.toHaveBeenCalled();
    expect(graphStub.fromSvg).not.toHaveBeenCalled();
    expect(svghStub.updateMessage).not.toHaveBeenCalled();
  });

  test("useEffect auto-restore: unsaved drawing with graphJSON object => stringifies and calls Graph.fromJSON, then updateMessage", async () => {
    await loadFresh({
      drawingsJSON: [{ id: "temp", saved: false, graphJSON: { foo: 1 } }],
    });

    useGraphStorage(formatMessage, msgs);

    expect(graphStub.fromJSON).toHaveBeenCalledTimes(1);
    const arg = graphStub.fromJSON.mock.calls[0][0];
    expect(typeof arg).toBe("string");
    expect(arg).toContain('"foo":1');

    expect(svghStub.updateMessage).toHaveBeenCalledTimes(1);
  });

  test("useEffect auto-restore: unsaved drawing with graphJSON string => passes through to Graph.fromJSON", async () => {
    await loadFresh({
      drawingsJSON: [{ id: "temp", saved: false, graphJSON: '{"x":1}' }],
    });

    useGraphStorage(formatMessage, msgs);

    expect(graphStub.fromJSON).toHaveBeenCalledWith('{"x":1}');
    expect(svghStub.updateMessage).toHaveBeenCalledTimes(1);
  });

  test("useEffect auto-restore: unsaved drawing with NO graphJSON but svgPath => calls Graph.fromSvg([svgPath])", async () => {
    await loadFresh({
      drawingsJSON: [{ id: "temp", saved: false, graphJSON: null, svgPath: "M0 0" }],
    });

    useGraphStorage(formatMessage, msgs);

    expect(graphStub.fromSvg).toHaveBeenCalledWith(["M0 0"]);
    expect(svghStub.updateMessage).toHaveBeenCalledTimes(1);
  });

  test("useEffect edge case: restore throws => warns and does not throw", async () => {
    await loadFresh({
      drawingsJSON: [{ id: "temp", saved: false, graphJSON: '{"x":1}' }],
    });

    graphStub.fromJSON.mockImplementation(() => {
      throw new Error("boom");
    });

    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    expect(() => useGraphStorage(formatMessage, msgs)).not.toThrow();
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();

    expect(svghStub.updateMessage).not.toHaveBeenCalled();
  });
});
