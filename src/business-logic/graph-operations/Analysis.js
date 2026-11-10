let _minPhi, _minDist;
const _critSeg = new Map();

export default function analyzeGraph(graph, data, crit) {
    _minPhi = (crit.angle * Math.PI) / 180;
    _minDist = crit.dist * crit.dist;

    const critNodes = [];
    graph.forEachNode((node) => {
        if (calcAngle(node) < _minPhi) {
            critNodes.push(node);
        }
    });

    _critSeg.clear();
    if (data.forms.length === 2) {
        const forms = data.forms;
        const segments0 = createSegments(forms[0].points, 0);
        const segments1 = createSegments(forms[1].points, 1);
        checkDist(forms[0].points, segments1);
        checkDist(forms[1].points, segments0);
    }

    return { critNodes, critSeg: _critSeg.values() };
}

// ---------- helpers ----------

function calcAngle(node) {
    const pos = node.pos;
    const pos1 = node.adjacent[0].q;
    const pos2 = node.adjacent[1].q;
    const ax = pos1.x - pos.x;
    const ay = pos1.y - pos.y;
    const bx = pos2.x - pos.x;
    const by = pos2.y - pos.y;
    return Math.acos(
        (ax * bx + ay * by) /
        (Math.sqrt(ax * ax + ay * ay) * Math.sqrt(bx * bx + by * by))
    );
}

function createSegments(points, i) {
    const segments = [];
    for (let j = 0; j < points.length - 1; j++) {
        segments.push({ id: `${i},${j}`, p1: points[j], p2: points[j + 1] });
    }
    const j = points.length - 1;
    segments.push({ id: `${i},${j}`, p1: points[j], p2: points[0] });
    return segments;
}

function checkDist(points, segments) {
    points.forEach((p) => {
        segments.forEach((seg) => {
            const dist = pointToSegmentDistSquared(seg.p1, seg.p2, p);
            if (dist < _minDist) {
                _critSeg.set(seg.id, seg);
            }
        });
    });
}

// ---------- replacement for distance-to-line-segment ----------

function pointToSegmentDistSquared(p1, p2, p) {
    const x1 = p1[0],
        y1 = p1[1],
        x2 = p2[0],
        y2 = p2[1],
        px = p[0],
        py = p[1];

    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;

    if (lenSq === 0) {
        // segment is a point
        const dx0 = px - x1;
        const dy0 = py - y1;
        return dx0 * dx0 + dy0 * dy0;
    }

    // Project point onto line segment
    let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));

    const projX = x1 + t * dx;
    const projY = y1 + t * dy;
    const dxProj = px - projX;
    const dyProj = py - projY;

    return dxProj * dxProj + dyProj * dyProj;
}