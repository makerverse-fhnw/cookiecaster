// components/Canvas.jsx
export default function Canvas({
                                   svgRef,
                                   viewBox,
                                   backgroundStyle,
                                   translate,
                                   rasterLines,
                                   formatMessage,
                                   msgs,
                                   showGrid,
                               }) {
    return (
        <div className="canvas-wrap">
            <svg
                ref={svgRef}
                viewBox={viewBox}
                style={backgroundStyle}
                preserveAspectRatio="xMidYMid meet"
                id="drawingarea"
                className="mouse"
            >
                <g id="raster" style={{visibility: showGrid ? "visible" : "hidden"}}>
                    {rasterLines.linesY}
                    {rasterLines.linesX}
                </g>


                <g id="layer" transform={translate}>
                    <text textAnchor="middle">{formatMessage(msgs.drawingarea)}</text>
                </g>

                <line id="moveEdge" visibility="hidden"/>
                <path id="selectionRect" visibility="hidden"/>

                <g id="edges"/>
                <line id="qEdge1" className="qEdge" visibility="hidden"/>
                <line id="qEdge2" className="qEdge" visibility="hidden"/>
                <g id="nodes"/>
                <g id="warnings"/>
                <g>
                    <text id="message1"/>
                    <text id="message2"/>
                </g>
            </svg>
        </div>
    );
}
