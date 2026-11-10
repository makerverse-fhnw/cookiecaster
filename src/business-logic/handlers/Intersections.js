const eta = 1e-9; // precision

/**
 *
 * @param {number[][][]} segments
 * @returns {number[] | undefined} - intersection point
 */
export default function intersections(segments) {
    //init event queue
    const queue = [];
    let id = 0;
    segments.forEach(seg => {
        const p1x = seg[0][0];
        const p1y = seg[0][1];
        const p2x = seg[1][0];
        const p2y = seg[1][1];
        if (p1x < p2x) {
            queue.push({segId: id, pos: {x: p1x, y: p1y}, type: 'start', vec: {x: p2x - p1x, y: p2y - p1y}});
            queue.push({segId: id, pos: {x: p2x, y: p2y}, type: 'end'});
        } else {
            queue.push({segId: id, pos: {x: p2x, y: p2y}, type: 'start', vec: {x: p1x - p2x, y: p1y - p2y}});
            queue.push({segId: id, pos: {x: p1x, y: p1y}, type: 'end'});
        }
        id++;
    });
    queue.sort((a, b) => {
        const d = b.pos.x - a.pos.x;
        if (d > eta) return 1;
        else if (d < -eta) return -1;
        else return b.type < a.type ? 1 : -1;
    });

    //sweep
    const intersections = [];
    const map = new Map();
    let event= queue.pop();
    while (event !== undefined) {
        // console.log(`segment: ${event.segId}, type: ${event.type}`);
        if (event.type === 'start') {
            // console.log(`pos: (${event.pos.x}, ${event.pos.y}), vec: (${event.vec.x}, ${event.vec.y})`);
            map.forEach((value) => {
                const i = intersect(value.pos, value.vec, event.pos, event.vec);
                if (i !== undefined) intersections.push(i);
            });
            map.set(event.segId, {pos: event.pos, vec: event.vec});
        } else {
            map.delete(event.segId);
        }
        event= queue.pop();
    }
    return intersections;
}

/**
 * Calculates the intersection between 2 line segments
 *
 * @param {{x: number, y: number}} r1 - origin segment 1
 * @param {{x: number, y: number}} a1 - vector segment 1
 * @param {{x: number, y: number}} r2 - origin segment 2
 * @param {{x: number, y: number}} a2 - vector segment 2
 * @returns {number[] | undefined} - intersection point
 */
function intersect(r1, a1, r2, a2) {
    if (Math.abs(a1.x * a2.y - a1.y * a2.x) < eta) {
        //parallelism
        //may handled otherwise if needed
        return undefined;
    } else {
        let lambda1, lambda2;
        if (Math.abs(a1.x) < eta) {
            lambda2 = (r1.x - r2.x) / a2.x;
            lambda1 = (r2.y - r1.y + lambda2 * a2.y) / a1.y;
        } else if (Math.abs(a1.y) < eta) {
            lambda2 = (r1.y - r2.y) / a2.y;
            lambda1 = (r2.x - r1.x + lambda2 * a2.x) / a1.x;
        } else if (Math.abs(a2.x) < eta) {
            lambda1 = (r2.x - r1.x) / a1.x;
            lambda2 = (r1.y - r2.y + lambda1 * a1.y) / a2.y;
        } else if (Math.abs(a2.y) < eta) {
            lambda1 = (r2.y - r1.y) / a1.y;
            lambda2 = (r1.x - r2.x + lambda1 * a1.x) / a2.x;
        } else {
            lambda1 = (r2.x - r1.x + a2.x * (r1.y - r2.y) / a2.y) / (a1.x - a1.y * a2.x / a2.y);
            lambda2 = (r1.y - r2.y + lambda1 * a1.y) / a2.y
        }

        if (lambda1 > eta && lambda1 < 1 - eta && lambda2 > eta && lambda2 < 1 - eta) {
            //vertices doesn't intersect
            return [r1.x + lambda1 * a1.x, r1.y + lambda1 * a1.y]
        }
        return undefined;
    }
}