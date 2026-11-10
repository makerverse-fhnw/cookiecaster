import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { meshToBinarySTL, downloadBinaryStl } from '../../src/utils/ExportToBinarySTL.js';

class MockBlob {
  constructor(parts, opts) {
    this.parts = parts;
    this.type = opts?.type;
  }
}

describe('meshToBinarySTL / downloadBinaryStl (no jsdom)', () => {
  beforeEach(() => {
    jest.restoreAllMocks();

    globalThis.Blob = MockBlob;

    globalThis.URL = {
      createObjectURL: jest.fn(() => 'blob:stl'),
      revokeObjectURL: jest.fn(),
    };

    const a = { href: '', download: '', click: jest.fn() };
    globalThis.document = {
      createElement: jest.fn(() => a),
    };
  });

  test('meshToBinarySTL: empty facets => header+count only (84 bytes) and count=0', () => {
    const blob = meshToBinarySTL({ facets: [] });

    expect(blob).toBeInstanceOf(MockBlob);
    expect(blob.type).toBe('application/octet-stream');

    const buffer = blob.parts[0];
    expect(buffer).toBeInstanceOf(ArrayBuffer);
    expect(buffer.byteLength).toBe(84);

    const view = new DataView(buffer);
    expect(view.getUint32(80, true)).toBe(0);
  });

  test('meshToBinarySTL: 1 facet without normal uses [0,0,0]; buffer size 84+50', () => {
    const blob = meshToBinarySTL({
      facets: [
        {
          // normal missing -> defaults to [0,0,0] :contentReference[oaicite:6]{index=6}
          verts: [
            [1, 2, 3],
            [4, 5, 6],
            [7, 8, 9],
          ],
        },
      ],
    });

    const buffer = blob.parts[0];
    expect(buffer.byteLength).toBe(84 + 50);

    const view = new DataView(buffer);
    expect(view.getUint32(80, true)).toBe(1);

    // normal floats at offset 84
    expect(view.getFloat32(84, true)).toBe(0);
    expect(view.getFloat32(88, true)).toBe(0);
    expect(view.getFloat32(92, true)).toBe(0);
  });

  test('downloadBinaryStl: creates URL, clicks anchor, revokes URL', () => {
    const blob = new MockBlob([new ArrayBuffer(1)], { type: 'application/octet-stream' });

    downloadBinaryStl(blob, 'x.stl');

    expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
    const a = document.createElement.mock.results[0].value;
    expect(a.download).toBe('x.stl');
    expect(a.click).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:stl');
  });
});
