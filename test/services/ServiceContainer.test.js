import { describe, test, expect, jest, beforeEach } from "@jest/globals";

let createServices;

// capture constructor args
let GraphMock, SvgHandlerMock, SelectionHandlerMock, ControllerMock;
let ModeDrawMock, ModeMoveMock, ModeRotateMock, ModeSelectMock;

async function loadFresh() {
    jest.resetModules();
    jest.clearAllMocks();

    // ----- class mocks -----
    GraphMock = jest.fn(function Graph(getSvgHandler) {
        this.__name = "GraphInstance";
        this.__getSvgHandler = getSvgHandler;
    });

    SvgHandlerMock = jest.fn(function SvgHandler(getGraph) {
        this.__name = "SvgHandlerInstance";
        this.__getGraph = getGraph;
    });

    SelectionHandlerMock = jest.fn(function SelectionHandler(svgHandler, graph) {
        this.__name = "SelectionHandlerInstance";
        this.__svgHandler = svgHandler;
        this.__graph = graph;
    });

    ControllerMock = jest.fn(function Controller(deps) {
        this.__name = "ControllerInstance";
        this.__deps = deps;
        this.setModes = jest.fn();
    });

    ModeDrawMock = jest.fn(function ModeDraw(deps) {
        this.__name = "ModeDrawInstance";
        this.__deps = deps;
    });
    ModeMoveMock = jest.fn(function ModeMove(deps) {
        this.__name = "ModeMoveInstance";
        this.__deps = deps;
    });
    ModeRotateMock = jest.fn(function ModeRotate(deps) {
        this.__name = "ModeRotateInstance";
        this.__deps = deps;
    });
    ModeSelectMock = jest.fn(function ModeSelect(deps) {
        this.__name = "ModeSelectInstance";
        this.__deps = deps;
    });

    // ----- module mocks (must match import strings exactly) -----
    await jest.unstable_mockModule("../../src/entities/graph/Graph.js", () => ({
        __esModule: true,
        default: GraphMock,
    }));

    await jest.unstable_mockModule("../../src/business-logic/handlers/SvgHandler.js", () => ({
        __esModule: true,
        default: SvgHandlerMock,
    }));

    await jest.unstable_mockModule(
        "../../src/business-logic/handlers/SelectionHandler.js",
        () => ({
            __esModule: true,
            default: SelectionHandlerMock,
        })
    );

    await jest.unstable_mockModule("../../src/business-logic/handlers/Controller.js", () => ({
        __esModule: true,
        default: ControllerMock,
    }));

    await jest.unstable_mockModule("../../src/business-logic/modes/ModeDraw.js", () => ({
        __esModule: true,
        default: ModeDrawMock,
    }));
    await jest.unstable_mockModule("../../src/business-logic/modes/ModeMove.js", () => ({
        __esModule: true,
        default: ModeMoveMock,
    }));
    await jest.unstable_mockModule("../../src/business-logic/modes/ModeRotate.js", () => ({
        __esModule: true,
        default: ModeRotateMock,
    }));
    await jest.unstable_mockModule("../../src/business-logic/modes/ModeSelect.js", () => ({
        __esModule: true,
        default: ModeSelectMock,
    }));

    // import the module under test AFTER mocks
    ({ createServices } = await import(
        "../../src/business-logic/services/ServiceContainer.js"
        ));
}

beforeEach(() => {
    jest.clearAllMocks();
});

describe("createServices", () => {
    test("creates services with correct wiring + calls controller.setModes", async () => {
        await loadFresh();

        const services = createServices();

        const moveDeps = ModeMoveMock.mock.calls[0][0];
        const rotateDeps = ModeRotateMock.mock.calls[0][0];
        const selectDeps = ModeSelectMock.mock.calls[0][0];

        expect(typeof moveDeps.controller).toBe("function");
        expect(moveDeps.controller()).toBe(services.controller);

        expect(typeof rotateDeps.controller).toBe("function");
        expect(rotateDeps.controller()).toBe(services.controller);

        expect(typeof selectDeps.controller).toBe("function");
        expect(selectDeps.controller()).toBe(services.controller);

        // --- constructors called ---
        expect(GraphMock).toHaveBeenCalledTimes(1);
        expect(SvgHandlerMock).toHaveBeenCalledTimes(1);
        expect(SelectionHandlerMock).toHaveBeenCalledTimes(1);
        expect(ControllerMock).toHaveBeenCalledTimes(1);

        expect(ModeDrawMock).toHaveBeenCalledTimes(1);
        expect(ModeMoveMock).toHaveBeenCalledTimes(1);
        expect(ModeRotateMock).toHaveBeenCalledTimes(1);
        expect(ModeSelectMock).toHaveBeenCalledTimes(1);

        // --- instances are placed on services ---
        expect(services.graph).toBeDefined();
        expect(services.svgHandler).toBeDefined();
        expect(services.selectionHandler).toBeDefined();
        expect(services.controller).toBeDefined();
        expect(services.modes).toBeDefined();

        // --- cross refs: Graph(() => svgHandler) ---
        // GraphMock got a getter function as first arg
        const graphGetter = GraphMock.mock.calls[0][0];
        expect(typeof graphGetter).toBe("function");
        expect(graphGetter()).toBe(services.svgHandler);

        // --- cross refs: SvgHandler(() => graph) ---
        const svgGetter = SvgHandlerMock.mock.calls[0][0];
        expect(typeof svgGetter).toBe("function");
        expect(svgGetter()).toBe(services.graph);

        // --- SelectionHandler(svgHandler, graph) ---
        expect(SelectionHandlerMock).toHaveBeenCalledWith(services.svgHandler, services.graph);

        // --- Controller deps object ---
        const controllerDeps = ControllerMock.mock.calls[0][0];
        expect(controllerDeps).toEqual({
            svgHandler: services.svgHandler,
            selectionHandler: services.selectionHandler,
            graph: services.graph,
        });

        // --- Modes deps, controller is lazy getter ---
        const drawDeps = ModeDrawMock.mock.calls[0][0];
        expect(typeof drawDeps.controller).toBe("function");
        expect(drawDeps.controller()).toBe(services.controller);
        expect(drawDeps.svgHandler).toBe(services.svgHandler);
        expect(drawDeps.selectionHandler).toBe(services.selectionHandler);
        expect(drawDeps.graph).toBe(services.graph);

        // Quick spot-check one more mode (others same shape)
        expect(moveDeps.graph).toBe(services.graph);

        // --- controller.setModes called with modes object ---
        expect(services.controller.setModes).toHaveBeenCalledTimes(1);
        expect(services.controller.setModes).toHaveBeenCalledWith(services.modes);

        // --- modes keys exist ---
        expect(Object.keys(services.modes).sort()).toEqual(
            ["MODE_DRAW", "MODE_MOVE", "MODE_ROTATE", "MODE_SELECT"].sort()
        );
    });
});
