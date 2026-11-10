import {useCallback, useState, useMemo} from "react";
import {useServices} from "../../../../business-logic/services/ServicesProvider.jsx";

export default function useCanvasConfig() {
    const {svgHandler, controller} = useServices();

    // Local UI state synced with BL state
    const [showGrid, setShowGrid] = useState(controller.grid);
    const [zoomIndex, setZoomIndex] = useState(() => svgHandler.getZoomLevel() - 1);

    // Computed values coming from svgHandler
    const size = svgHandler.getDrawingAreaSize();
    const viewBox = useMemo(() => `0 0 ${size} ${size}`, [size]);
    const translate = useMemo(
        () => `translate(${size / 2},${size / 2})`,
        [size]
    );

    const zoomLevels = svgHandler.getZoomLevels();

    const raster = svgHandler.getRasterSpace();

    const changeGrid = useCallback((checked) => {
        controller.grid = checked;
        setShowGrid(checked);
    }, [controller]);

    const changeZoom = useCallback((idx) => {
        const zoom = parseInt(idx, 10);
        svgHandler.setZoomLevel(zoom + 1);
        setZoomIndex(zoom);
    }, [svgHandler]);

    return {
        showGrid,
        changeGrid,
        zoomIndex,
        changeZoom,
        zoomLevels,
        size,
        viewBox,
        translate,
        raster,
    };
}