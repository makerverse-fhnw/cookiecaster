// Analysis.test.js  (ESM)
import analyzeGraph from '../../src/business-logic/graph-operations/Analysis.js';
import { describe, test, expect } from '@jest/globals';

function makeGraph(nodes = []) {
  return {
    forEachNode(cb) {
      nodes.forEach(cb);
    },
  };
}

// Helper: create a node with two adjacent edges having q control points.
// Analysis.calcAngle uses:
// node.pos and node.adjacent[0].q + node.adjacent[1].q  :contentReference[oaicite:1]{index=1}
function makeAngleNode(pos, q1, q2) {
  return {
    pos,
    adjacent: [{ q: q1 }, { q: q2 }],
  };
}

describe('analyzeGraph (Analysis.js)', () => {
  test('returns critNodes based on angle threshold (< minPhi) and no critSeg when forms.length != 2', () => {
    // crit.angle = 90° => minPhi = PI/2
    const crit = { angle: 90, dist: 1 };

    // Node A has 60° at origin -> critical (< 90°)
    // Choose vectors OA=(1,0) and OB=(0.5, sqrt(3)/2) => 60°
    const nodeCritical = makeAngleNode(
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0.5, y: Math.sqrt(3) / 2 }
    );

    // Node B has exactly 90° -> NOT critical because code uses "< _minPhi"
    const nodeRightAngle = makeAngleNode(
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 }
    );

    // Node C has 120° -> NOT critical
    // vectors (1,0) and (-1/2, sqrt(3)/2) => 120°
    const nodeNotCritical = makeAngleNode(
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: -0.5, y: Math.sqrt(3) / 2 }
    );

    const graph = makeGraph([nodeCritical, nodeRightAngle, nodeNotCritical]);

    // forms length != 2 => distance logic skipped; critSeg should be empty iterator
    const data = { forms: [{ points: [] }] };

    const result = analyzeGraph(graph, data, crit);

    expect(result.critNodes).toHaveLength(1);
    expect(result.critNodes[0]).toBe(nodeCritical);

    // critSeg is returned as an iterator (_critSeg.values())
    const segs = [...result.critSeg];
    expect(segs).toEqual([]);
  });

  test('when forms.length === 2: collects critical segments based on distance threshold and de-duplicates by seg.id', () => {
    // dist=0.3 => minDist (squared) = 0.09
    const crit = { angle: 180, dist: 0.3 }; // angle high so no critNodes; focus on critSeg

    const graph = makeGraph([]); // no nodes needed for this test
    const data = {
      forms: [
        // Form 0: includes a ZERO-LENGTH segment (points[0] == points[1]) to hit lenSq===0 branch
        // Also includes a point that will be checked against form1 segments where projection clamps t to 0 or 1
        { points: [[5, 5], [5, 5], [6, 5], [-1, 0], [2, 0], [0.5, 0.2]] },
        // Form 1: a unit square, includes segment (0,0)->(1,0) which is close to point (0.5,0.2)
        { points: [[0, 0], [1, 0], [1, 1], [0, 1]] },
      ],
    };

    const result = analyzeGraph(graph, data, crit);
    const segs = [...result.critSeg];

    // We expect at least the bottom segment of the square (1,0)->(0,0) or (0,0)->(1,0)
    // to be flagged because point (0.5, 0.2) is 0.2 away (dist^2=0.04 < 0.09).
    // Which segment id gets flagged depends on createSegments indexing:
    // Form1 segments have ids "1,0" (p0->p1), "1,1"(p1->p2), "1,2"(p2->p3), "1,3"(p3->p0). :contentReference[oaicite:2]{index=2}
    const ids = segs.map((s) => s.id);
    expect(ids).toEqual(expect.arrayContaining(['1,0'])); // bottom edge (0,0)->(1,0)

    // Ensure de-duplication: even if multiple points are within threshold to same seg,
    // the Map stores it once by seg.id.
    // We can enforce by re-running with a second close point and verifying size doesn't explode.
    const data2 = {
      forms: [
        { points: [[5, 5], [5, 5], [6, 5], [0.25, 0.1], [0.75, 0.1]] }, // both near bottom segment
        { points: [[0, 0], [1, 0], [1, 1], [0, 1]] },
      ],
    };

    const result2 = analyzeGraph(graph, data2, crit);
    const segs2 = [...result2.critSeg];
    const ids2 = segs2.map((s) => s.id);

    // Bottom segment should still be present
    expect(ids2).toEqual(expect.arrayContaining(['1,0']));

    // Should not contain duplicates of the same id
    const unique = new Set(ids2);
    expect(unique.size).toBe(ids2.length);
  });

test('covers point-to-segment projection clamp branches (t < 0 and t > 1) without adding segments', () => {
  // Tiny threshold so we *expect* no critical segments.
  const crit = { angle: 180, dist: 0.0001 };

  const graph = makeGraph([]);

  // Form0: segment from (-1,1) to (2,1) (horizontal at y=1)
  // Form1: a "square" but capped at y=0.8 so no point lies on y=1.
  // Points in Form0 are chosen so that when tested against Form1's bottom segment (0,0)->(1,0),
  // they produce t<0 and t>1 clamps, but are far away (distance ~1), so nothing gets added.
  const data = {
    forms: [
      { points: [[-1, 1], [2, 1]] },                // points force clamping vs (0,0)->(1,0)
      { points: [[0, 0], [1, 0], [1, 0.8], [0, 0.8]] }, // no point lies on y=1
    ],
  };

  const result = analyzeGraph(graph, data, crit);

  // With dist so tiny and no zero-distance cases, nothing should be flagged.
  expect([...result.critSeg]).toEqual([]);
});

  test('critSeg is cleared between calls (no leakage across analyzeGraph invocations)', () => {
    const graph = makeGraph([]);

    const critLoose = { angle: 180, dist: 1 }; // larger threshold (may add)
    const critTight = { angle: 180, dist: 0.00001 }; // super tight (adds none)

    const dataAdd = {
      forms: [
        { points: [[0.5, 0.2]] },
        { points: [[0, 0], [1, 0], [1, 1], [0, 1]] },
      ],
    };
    const dataNone = {
      forms: [
        { points: [[100, 100]] },
        { points: [[0, 0], [1, 0], [1, 1], [0, 1]] },
      ],
    };

    const r1 = analyzeGraph(graph, dataAdd, critLoose);
    expect([...r1.critSeg].length).toBeGreaterThan(0);

    const r2 = analyzeGraph(graph, dataNone, critTight);
    expect([...r2.critSeg]).toEqual([]);
  });
});
