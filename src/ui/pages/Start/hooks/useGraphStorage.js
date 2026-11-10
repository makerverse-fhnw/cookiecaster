import {useCallback, useEffect} from "react";
import {useServices} from "../../../../business-logic/services/ServicesProvider.jsx";

export default function useGraphStorage(formatMessage, msgs) {
    const {graph, svgHandler} = useServices();

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const getAllDrawings = () => {
        return JSON.parse(localStorage.getItem("drawings")) || [];
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const saveAllDrawings = (drawings) => {
        localStorage.setItem("drawings", JSON.stringify(drawings));
    };

    const saveGraph = useCallback(() => {
        const jsonData = graph.toJSON();
        const forms = graph.validate()?.forms || [];
        const svgPath = forms.map((f) => f.path).join(" ");

        const name = window.prompt(formatMessage(msgs.enterName), formatMessage(msgs.exampleName));
        if (!name || !name.trim()) {
            window.alert(formatMessage(msgs.noName));
            return;
        }

        try {
            const payload = {
                id: "drawing-" + Date.now(),
                name: name.trim(),
                graphJSON: jsonData,
                svgPath,
                saved: true,
                timestamp: new Date().toISOString()
            };

            const drawings = getAllDrawings();
            drawings.push(payload);
            saveAllDrawings(drawings);

            window.alert(formatMessage(msgs.save));
        } catch (err) {
            console.error(err);
            window.alert(formatMessage(msgs.noSave));
        }
    }, [formatMessage, msgs, graph]);

    // Auto-restore unsaved drawing on mount
    useEffect(() => {
        const temp = getAllDrawings().find((d) => !d.saved);
        if (!temp) return;

        try {
            const json = typeof temp.graphJSON === "string"
                ? temp.graphJSON
                : JSON.stringify(temp.graphJSON);

            if (temp.graphJSON) {
                graph.fromJSON(json);
            } else if (temp.svgPath) {
                graph.fromSvg([temp.svgPath]);
            }

            svgHandler.updateMessage();
        } catch (err) {
            console.warn("Failed to restore autosave:", err);
        }
    }, [graph, svgHandler, getAllDrawings, saveAllDrawings]);

    return {saveGraph};
}
