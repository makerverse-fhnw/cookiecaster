import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { exportCC3File } from '../../src/utils/FileExport.js';

class MockBlob {
  constructor(parts, opts) {
    this.parts = parts;
    this.type = opts?.type;
  }
}

class MockMouseEvent {
  constructor(type) {
    this.type = type;
  }
}

describe('exportCC3File (no jsdom)', () => {
  let createdAnchor;

  beforeEach(() => {
    jest.restoreAllMocks();

    globalThis.MouseEvent = MockMouseEvent;
    globalThis.alert = jest.fn();

    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    globalThis.Blob = MockBlob;

    globalThis.URL = {
      createObjectURL: jest.fn(() => 'blob:mock'),
      revokeObjectURL: jest.fn(),
    };

    createdAnchor = { href: '', download: '', dispatchEvent: jest.fn() };
    globalThis.document = {
      createElement: jest.fn((tag) => {
        if (tag !== 'a') throw new Error('unexpected tag');
        return createdAnchor;
      }),
    };

    jest.spyOn(Date, 'now').mockReturnValue(123);
    jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2025-01-01T00:00:00.000Z');
  });

  test('edge: no graphData => warns and returns early', () => {
    exportCC3File(null, 'x');
    expect(console.warn).toHaveBeenCalled();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  test('success: creates cc3 blob, sanitizes name, clicks anchor, revokes URL', () => {
    exportCC3File({ g: 1 }, '  bad<>:"/\\|?* name  ');

    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(createdAnchor.dispatchEvent).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock');
    expect(console.info).toHaveBeenCalled();

    // filename shape checks (don’t depend on underscore count)
    expect(createdAnchor.download).toMatch(/^bad.*name_123\.cc3$/);

    // ensure no illegal filename characters remain
    // (Windows-illegal: < > : " / \ | ? * )
    expect(createdAnchor.download).not.toMatch(/[<>:"/\\|?*]/);

    // blob contains JSON
    const blobArg = URL.createObjectURL.mock.calls[0][0];
    expect(blobArg).toBeInstanceOf(MockBlob);
    expect(blobArg.type).toBe('application/json');

    const json = String(blobArg.parts[0]);
    expect(json).toContain('"graphJSON"');
    expect(json).toContain('"g": 1');
    });


  test('edge: sanitize name to default when empty/whitespace', () => {
    exportCC3File({ g: 1 }, '   ');
    expect(createdAnchor.download).toContain('cookiecaster_123.cc3');
  });

  test('edge: failure inside try => alerts export error', () => {
    URL.createObjectURL.mockImplementation(() => {
      throw new Error('boom');
    });

    exportCC3File({ g: 1 }, 'x');

    expect(console.error).toHaveBeenCalled();
    expect(globalThis.alert).toHaveBeenCalledTimes(1);
  });
});
