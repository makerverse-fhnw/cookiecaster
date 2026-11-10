// AbstractMode.test.js (ESM, Node env, NO jsdom)

import { describe, test, expect, jest, beforeEach } from '@jest/globals';

let AbstractMode;
let d3;

const loadFresh = async () => {
  jest.resetModules();

  // chainable d3.select().classed()
  d3 = {
    select: jest.fn(() => ({
      classed: jest.fn(() => undefined),
    })),
  };

  await jest.unstable_mockModule('d3', () => ({ __esModule: true, ...d3 }));

  ({ default: AbstractMode } = await import('../../src/business-logic/modes/AbstractMode.js'));
};

beforeEach(async () => {
  jest.clearAllMocks();
  await loadFresh();
});

describe('AbstractMode (no jsdom)', () => {
  test('constructor guard: cannot instantiate AbstractMode directly', () => {
    expect(() => new AbstractMode()).toThrow(/abstract/i);
  });

  test('enableButtons toggles disable-mode class for own properties only', () => {
    class Concrete extends AbstractMode {}
    const m = new Concrete();

    // include inherited property to ensure hasOwnProperty filter is applied
    const proto = { inherited: true };
    const values = Object.create(proto);
    values.move = true;
    values.rotate = false;

    m.enableButtons(values);

    expect(d3.select).toHaveBeenCalledWith('#move');
    expect(d3.select).toHaveBeenCalledWith('#rotate');

    // classed("disable-mode", !enabled)
    const moveSel = d3.select.mock.results[0].value;
    const rotSel = d3.select.mock.results[1].value;

    expect(moveSel.classed).toHaveBeenCalledWith('disable-mode', false);
    expect(rotSel.classed).toHaveBeenCalledWith('disable-mode', true);

    // inherited key should NOT be used
    expect(d3.select).not.toHaveBeenCalledWith('#inherited');
  });

  test('default lifecycle methods exist and do not throw', () => {
    class Concrete extends AbstractMode {}
    const m = new Concrete();

    expect(() => m.enable()).not.toThrow();
    expect(() => m.onMouseDown()).not.toThrow();
    expect(() => m.onMouseMove()).not.toThrow();
    expect(() => m.onMouseUp()).not.toThrow();
    expect(() => m.onEscape()).not.toThrow();
    expect(() => m.disable()).not.toThrow();
  });
});
