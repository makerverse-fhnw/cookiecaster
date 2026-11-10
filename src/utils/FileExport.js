/**
 * CookieCaster 3.0 – File Export Utility
 * Exports a given graph as a .cc3 JSON file
 */
export const exportCC3File = (graphData, name = "cookiecaster") => {
    if (!graphData) {
        console.warn("exportCC3File: No graph data provided.");
        return;
    }

    try {
        const project = {
            version: "3.0",
            timestamp: new Date().toISOString(),
            graphJSON: graphData,
        };

        const fileName = `${sanitizeFileName(name)}_${Date.now()}.cc3`;
        const blob = new Blob([JSON.stringify(project, null, 2)], {
            type: "application/json",
        });

        const url = URL.createObjectURL(blob);
        const a = Object.assign(document.createElement("a"), {
            href: url,
            download: fileName,
        });

        a.dispatchEvent(new MouseEvent("click"));
        URL.revokeObjectURL(url);
        console.info(`Exported: ${fileName}`);
    } catch (err) {
        console.error("CC3 export failed:", err);
        alert("Fehler beim Exportieren der Vorlage.");
    }
};

/** Sanitize filename for safe downloads */
const sanitizeFileName = (name) =>
    name.replace(/[<>:"/\\|?*]+/g, "_").trim() || "cookiecaster";
