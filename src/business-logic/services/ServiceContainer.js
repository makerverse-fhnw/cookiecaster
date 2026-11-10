import Graph from "../../entities/graph/Graph.js";
import SvgHandler from "../handlers/SvgHandler.js";
import SelectionHandler from "../handlers/SelectionHandler.js";
import Controller from "../handlers/Controller.js";
import ModeDraw from "../modes/ModeDraw.js";
import ModeMove from "../modes/ModeMove.js";
import ModeRotate from "../modes/ModeRotate.js";
import ModeSelect from "../modes/ModeSelect.js";

export function createServices() {
    const services = {};

    // Lazy cross-refs
    services.graph = new Graph(() => services.svgHandler);
    services.svgHandler = new SvgHandler(() => services.graph);
    services.selectionHandler = new SelectionHandler(services.svgHandler, services.graph);
    services.controller = new Controller({
        svgHandler: services.svgHandler,
        selectionHandler: services.selectionHandler,
        graph: services.graph,
    });

    services.modes = {
        MODE_DRAW: new ModeDraw({
            controller: () => services.controller,
            svgHandler: services.svgHandler,
            selectionHandler: services.selectionHandler,
            graph: services.graph,
        }),
        MODE_MOVE: new ModeMove({
            controller: () => services.controller,
            svgHandler: services.svgHandler,
            selectionHandler: services.selectionHandler,
            graph: services.graph,
        }),
        MODE_ROTATE: new ModeRotate({
            controller: () => services.controller,
            svgHandler: services.svgHandler,
            selectionHandler: services.selectionHandler,
            graph: services.graph,
        }),
        MODE_SELECT: new ModeSelect({
            controller: () => services.controller,
            svgHandler: services.svgHandler,
            selectionHandler: services.selectionHandler,
            graph: services.graph,
        }),
    };

    services.controller.setModes(services.modes);
    return services;
}