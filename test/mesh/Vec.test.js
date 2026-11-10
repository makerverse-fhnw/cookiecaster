// Vec.test.js (ESM, Node env, NO jsdom)

import { describe, test, expect } from '@jest/globals';
import { Vec2, Vec3 } from '../../src/entities/mesh/Vec.js';

describe('Vec2', () => {
  test('static constants', () => {
    expect(Vec2.ZERO.x).toBe(0);
    expect(Vec2.ZERO.y).toBe(0);
    expect(Vec2.ONE.x).toBe(1);
    expect(Vec2.ONE.y).toBe(1);
    expect(Vec2.UNIT_X.x).toBe(1);
    expect(Vec2.UNIT_X.y).toBe(0);
    expect(Vec2.UNIT_Y.x).toBe(0);
    expect(Vec2.UNIT_Y.y).toBe(1);
  });

  test('add/sub/scale', () => {
    const a = new Vec2(1, 2);
    const b = new Vec2(3, 4);

    expect(a.add(b)).toEqual(expect.objectContaining({ _x: 4, _y: 6 }));
    expect(b.sub(a)).toEqual(expect.objectContaining({ _x: 2, _y: 2 }));
    expect(a.scale(3)).toEqual(expect.objectContaining({ _x: 3, _y: 6 }));
  });

  test('dot/cross', () => {
    const a = new Vec2(2, 3);
    const b = new Vec2(5, 7);

    expect(a.dot(b)).toBe(2 * 5 + 3 * 7);
    expect(a.cross(b)).toBe(2 * 7 - 3 * 5);
  });

  test('lengthSquared/length', () => {
    const v = new Vec2(3, 4);
    expect(v.lengthSquared()).toBe(25);
    expect(v.length()).toBe(5);
  });

  test('normalize (non-zero)', () => {
    const v = new Vec2(3, 4).normalize();
    // Should be (0.6, 0.8)
    expect(v.x).toBeCloseTo(0.6, 10);
    expect(v.y).toBeCloseTo(0.8, 10);
  });

  test('normalize edge case: zero vector results in non-finite components (documents current behavior)', () => {
    const v = new Vec2(0, 0).normalize();
    // Current implementation scales by 1/0 => Infinity * 0 => NaN
    expect(Number.isFinite(v.x)).toBe(false);
    expect(Number.isFinite(v.y)).toBe(false);
  });

  test('toVec3 default z and custom z', () => {
    const v = new Vec2(1, 2);

    const a = v.toVec3();
    expect(a.x).toBe(1);
    expect(a.y).toBe(2);
    expect(a.z).toBe(0);

    const b = v.toVec3(9);
    expect(b.z).toBe(9);
  });
});

describe('Vec3', () => {
  test('static constants', () => {
    expect(Vec3.ZERO.x).toBe(0);
    expect(Vec3.ZERO.y).toBe(0);
    expect(Vec3.ZERO.z).toBe(0);
    expect(Vec3.ONE.x).toBe(1);
    expect(Vec3.ONE.y).toBe(1);
    expect(Vec3.ONE.z).toBe(1);
    expect(Vec3.UNIT_X.x).toBe(1);
    expect(Vec3.UNIT_Y.y).toBe(1);
    expect(Vec3.UNIT_Z.z).toBe(1);
  });

  test('add/sub/scale', () => {
    const a = new Vec3(1, 2, 3);
    const b = new Vec3(4, 5, 6);

    const add = a.add(b);
    expect(add.x).toBe(5);
    expect(add.y).toBe(7);
    expect(add.z).toBe(9);

    const sub = b.sub(a);
    expect(sub.x).toBe(3);
    expect(sub.y).toBe(3);
    expect(sub.z).toBe(3);

    const s = a.scale(2);
    expect(s.x).toBe(2);
    expect(s.y).toBe(4);
    expect(s.z).toBe(6);
  });

  test('dot/cross', () => {
    const a = new Vec3(1, 2, 3);
    const b = new Vec3(4, 5, 6);

    expect(a.dot(b)).toBe(1 * 4 + 2 * 5 + 3 * 6);

    const c = a.cross(b);
    // (2*6-3*5, 3*4-1*6, 1*5-2*4) = (-3, 6, -3)
    expect(c.x).toBe(-3);
    expect(c.y).toBe(6);
    expect(c.z).toBe(-3);
  });

  test('lengthSquared/length', () => {
    const v = new Vec3(2, 3, 6);
    expect(v.lengthSquared()).toBe(4 + 9 + 36);
    expect(v.length()).toBeCloseTo(Math.sqrt(49), 10);
  });

  test('normalize (non-zero)', () => {
    const v = new Vec3(0, 3, 4).normalize();
    expect(v.x).toBeCloseTo(0, 10);
    expect(v.y).toBeCloseTo(3 / 5, 10);
    expect(v.z).toBeCloseTo(4 / 5, 10);
  });

  test('normalize edge case: zero vector results in non-finite components (documents current behavior)', () => {
    const v = new Vec3(0, 0, 0).normalize();
    expect(Number.isFinite(v.x)).toBe(false);
    expect(Number.isFinite(v.y)).toBe(false);
    expect(Number.isFinite(v.z)).toBe(false);
  });
});
