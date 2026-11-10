import {useCallback, useState} from "react";
import {validateGraph} from "../../../../business-logic/services/graphValidation";
import config from "../../../../client_config.json" with { type: "json" };
import {useServices} from "../../../../business-logic/services/ServicesProvider.jsx";

const profiles = config.profiles;

export default function useGraphAnalysis(formatMessage, msgs) {
    const {selectionHandler, graph, svgHandler} = useServices();

    const [analyze, setAnalyze] = useState({
        status: false,
        keys: Object.keys(profiles),
        data: profiles.default,
    });

    const analyzeGraph = useCallback(() => {
        selectionHandler.clear();

        const data = validateGraph(
            graph,
            svgHandler,
            formatMessage,
            msgs
        );

        // Errors block further processing
        if (!data.valid) {
            if (data.errors.length > 0) window.alert(data.errors.join("\n"));
            return;
        }

        // Show warnings if any
        if (data.warnings.length > 0)
            window.alert(data.warnings.join("\n"));

        const crit = graph.analyze(data, analyze.data);
        const segCount = Array.from(crit.critSeg).length;

        if (crit.critNodes.length === 0 && segCount === 0) {
            window.alert(formatMessage(msgs.export));
            return;
        }

        setAnalyze({status: true, keys: analyze.keys, data: profiles.default});

        svgHandler.setCritNodes(crit.critNodes);
        svgHandler.setCritSeg(crit.critSeg);

        window.alert(formatMessage(msgs.useful));
    }, [analyze.data, analyze.keys, formatMessage, msgs, graph, svgHandler, selectionHandler]);

    return {analyze, analyzeGraph, setAnalyze};
}