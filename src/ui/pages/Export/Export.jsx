import {useState, useMemo, useCallback} from "react";
import {FormattedMessage} from "react-intl";
import {Link} from "react-router-dom";
import createMesh from "../../../business-logic/mesh-operations/CreateMesh.js";
import {useServices} from "../../../business-logic/services/ServicesProvider.jsx";
import {meshToBinarySTL, downloadBinaryStl} from "../../../utils/ExportToBinarySTL.js";
import "./Export.css";

// --------------------------------------------------------
// Validate graph (same logic as before, but dependency-free)
// --------------------------------------------------------
function pointInPolygon(point, vs) {
    const [x, y] = point;
    let inside = false;

    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        const xi = vs[i][0], yi = vs[i][1];
        const xj = vs[j][0], yj = vs[j][1];

        const intersect =
            (yi > y) !== (yj > y) &&
            x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

        if (intersect) inside = !inside;
    }
    return inside;
}

function validateGraph(graph, svgHandler) {
    const zoom = svgHandler.getActZoomValue();
    graph.backup();

    graph.forEachNode(n => {
        n.pos.x /= zoom;
        n.pos.y /= zoom;
    });
    graph.forEachEdge(e => {
        e.q.x /= zoom;
        e.q.y /= zoom;
    });

    const data = graph.validate();
    graph.restore();

    data.valid = false;

    if (data.forms.length === 0 || data.forms.length > 2) return data;

    if (data.forms.length === 1) {
        if (!data.forms[0].closed) return data;
    } else {
        const [f0, f1] = data.forms;

        if (!f0.closed || !f1.closed) return data;

        if (f0.meta.width < f1.meta.width) {
            if (!pointInPolygon([f0.meta.center.x, f0.meta.center.y], f1.points)) return data;
            data.outer = 1;
        } else {
            if (!pointInPolygon([f1.meta.center.x, f1.meta.center.y], f0.points)) return data;
            data.outer = 0;
        }
    }

    if (data.intersections.length > 0) return data;

    data.valid = true;
    return data;
}

// --------------------------------------------------------
// Component
// --------------------------------------------------------
export default function Export() {
    const {graph, svgHandler} = useServices();

    const data = useMemo(() => validateGraph(graph, svgHandler), [graph, svgHandler]);
    const [filename, setFilename] = useState("cookie");
    const [thickness, setThickness] = useState(1.5);
    const [height, setHeight] = useState(12);

    const createAndDownloadMesh = useCallback(() => {
        if (!data.valid) return;
        const mesh = createMesh(data, thickness, height, filename);
        const stlBlob = meshToBinarySTL(mesh);
        downloadBinaryStl(stlBlob, `${filename}.stl`);
    }, [data, thickness, height, filename]);

    return (
        <div className="container mt-4">

            <h2><FormattedMessage id="export.settings"/></h2>

            <hr/>

            {/* --- FILENAME ROW --- */}
            <div className="row align-items-center mb-3">
                <label className="col-sm-4 col-form-label">
                    <FormattedMessage id="export.fileName"/>
                </label>
                <div className="col-sm-8">
                    <input
                        type="text"
                        value={filename}
                        onChange={(e) => setFilename(e.target.value)}
                        className="form-control"
                    />
                </div>
            </div>

            {/* --- WALL THICKNESS ROW --- */}
            <div className="row align-items-center mb-3">
                <label className="col-sm-4 col-form-label">
                    <FormattedMessage id="export.wallThickness"/>
                </label>
                <div className="col-sm-8">
                    <select
                        className="form-control"
                        value={thickness}
                        onChange={(e) => setThickness(parseFloat(e.target.value))}
                    >
                        <option value={1}>1 mm</option>
                        <option value={1.5}>1.5 mm</option>
                        <option value={2}>2 mm</option>
                    </select>
                </div>
            </div>

            {/* --- HEIGHT ROW --- */}
            <div className="row align-items-center mb-4">
                <label className="col-sm-4 col-form-label">
                    <FormattedMessage id="export.height"/>
                </label>
                <div className="col-sm-8">
                    <select
                        className="form-control"
                        value={height}
                        onChange={(e) => setHeight(parseFloat(e.target.value))}
                    >
                        <option value={12}>12 mm</option>
                        <option value={17}>17 mm</option>
                        <option value={23}>23 mm</option>
                    </select>
                </div>
            </div>

            {/* --- BUTTONS --- */}
            <div className="row mt-4">

                <div className="col-6 d-flex justify-content-start">
                    <Link to="/start">
                        <button className="btn btn-secondary btn-lg">
                            <FormattedMessage id="export.backButton"/>
                        </button>
                    </Link>
                </div>

                <div className="col-6 d-flex justify-content-end">
                    <button
                        className="btn btn-primary btn-lg"
                        disabled={!data.valid || filename.length === 0}
                        onClick={createAndDownloadMesh}
                    >
                        Export 3D
                    </button>
                </div>

            </div>

            {!data.valid && (
                <p className="text-danger mt-3">
                    <FormattedMessage id="alert.notAllowedExport"/>
                </p>
            )}
        </div>
    );
}