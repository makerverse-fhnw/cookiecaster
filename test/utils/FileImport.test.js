import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { importCC3File } from '../../src/utils/FileImport.js';

class MockMouseEvent {
  constructor(type) {
    this.type = type;
  }
}

describe('importCC3File (no jsdom)', () => {
  let createdInput;

  beforeEach(() => {
    jest.restoreAllMocks();
    createdInput = undefined;

    globalThis.MouseEvent = MockMouseEvent;
    globalThis.alert = jest.fn();

    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    globalThis.document = {
      createElement: jest.fn((tag) => {
        if (tag !== 'input') throw new Error('unexpected tag');
        createdInput = {
          type: '',
          accept: '',
          onchange: null,
          dispatchEvent: jest.fn(),
        };
        return createdInput;
      }),
    };
  });

  test('success: resolves parsed project when graphJSON exists', async () => {
    const p = importCC3File();

    // simulate file selection
    const file = {
      name: 'ok.cc3',
      text: jest.fn(async () => JSON.stringify({ graphJSON: { a: 1 } })),
    };

    // dispatch click was triggered
    expect(createdInput.dispatchEvent).toHaveBeenCalledTimes(1);

    await createdInput.onchange({ target: { files: [file] } });

    await expect(p).resolves.toEqual({ graphJSON: { a: 1 } });
    expect(console.info).toHaveBeenCalled();
    expect(globalThis.alert).not.toHaveBeenCalled();
  });

  test('edge: no file selected => rejects with "No file selected"', async () => {
    const p = importCC3File();
    await createdInput.onchange({ target: { files: [] } });

    await expect(p).rejects.toBeInstanceOf(Error);
    await expect(p).rejects.toHaveProperty('message', 'No file selected');
  });

  test('edge: invalid JSON => alerts + rejects', async () => {
    const p = importCC3File();

    const file = {
      name: 'bad.cc3',
      text: jest.fn(async () => 'not-json'),
    };

    await createdInput.onchange({ target: { files: [file] } });

    await expect(p).rejects.toBeInstanceOf(Error);
    expect(console.error).toHaveBeenCalled();
    expect(globalThis.alert).toHaveBeenCalledTimes(1);
  });

  test('edge: missing graphJSON => alerts + rejects', async () => {
    const p = importCC3File();

    const file = {
      name: 'nog.cc3',
      text: jest.fn(async () => JSON.stringify({ version: '3.0' })),
    };

    await createdInput.onchange({ target: { files: [file] } });

    await expect(p).rejects.toBeInstanceOf(Error);
    expect(console.error).toHaveBeenCalled();
    expect(globalThis.alert).toHaveBeenCalledTimes(1);
  });

  test('edge: document.createElement throws => promise rejects', async () => {
    globalThis.document.createElement.mockImplementation(() => {
      throw new Error('boom');
    });

    await expect(importCC3File()).rejects.toBeInstanceOf(Error);
    await expect(importCC3File()).rejects.toHaveProperty('message', 'boom');
  });
});
