import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

export function useGallerySelection() {
    const navigate = useNavigate();

    return useCallback(
        (item) => {
            if (!item?.svgPath && !item?.svg) return;

            sessionStorage.setItem("selectedDrawingId", item.id);
            sessionStorage.setItem(
                "selectedSource",
                item.isTemplate ? "template" : "local"
            );

            // Save graphJSON for templates
            if (item.isTemplate && item.graphJSON) {
                sessionStorage.setItem(
                    "templateGraphJSON",
                    JSON.stringify(item.graphJSON)
                );
            }

            navigate("/start");
        },
        [navigate]
    );
}
