import { useEffect, useMemo, useState } from "react";

export function useTemplates(templateFiles) {
    const [templates, setTemplates] = useState([]);

    const computedTemplates = useMemo(() => {
        return Object.entries(templateFiles).map(([path, mod]) => {
            const fileName = path.split("/").pop()?.replace(".json", "") ?? "";

            return {
                id: `tpl-${fileName}`,
                name: mod.name || fileName,
                svgPath: mod.svgPath || mod.svg || "",
                graphJSON: mod.graphJSON || mod,
                isTemplate: true,
            };
        });
    }, [templateFiles]);

    useEffect(() => {
        setTemplates(computedTemplates);
    }, [computedTemplates]);

    return templates;
}
