/**
 * CookieCaster 3.0 – File Import Utility
 * Opens a .cc3 file, validates and returns the parsed JSON
 */
export const importCC3File = async () => {
    return new Promise((resolve, reject) => {
        try {
            const input = Object.assign(document.createElement("input"), {
                type: "file",
                accept: ".cc3",
            });

            input.onchange = async (e) => {
                const file = e.target.files?.[0];
                if (!file) return reject(new Error("No file selected"));

                try {
                    const text = await file.text();
                    const project = JSON.parse(text);

                    if (!project?.graphJSON) {
                        throw new Error("Invalid CC3 format – missing graphJSON");
                    }

                    console.info(`Imported: ${file.name}`);
                    resolve(project);
                } catch (err) {
                    console.error("Failed to parse CC3:", err);
                    alert("Fehler beim Laden der Vorlage. Die Datei ist ungültig oder beschädigt.");
                    reject(err);
                }
            };

            input.dispatchEvent(new MouseEvent("click"));
        } catch (err) {
            reject(err);
        }
    });
};
