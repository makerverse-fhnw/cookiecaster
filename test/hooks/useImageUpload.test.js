import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';

let useImageUpload;

// async helper
const tick = () => new Promise((r) => setImmediate(r));

// FileReader mock plumbing
let lastFileReader;
class MockFileReader {
  constructor() {
    this.onload = null;
    lastFileReader = this;
  }
  readAsDataURL(file) {
    setImmediate(() => {
      if (this.onload) this.onload({ target: { result: `data:${file.name}` } });
    });
  }
}

// Image mock plumbing
let lastImage;
class MockImage {
  constructor() {
    this.onload = null;
    this.naturalWidth = 0;
    this.naturalHeight = 0;
    lastImage = this;
  }
  set src(_v) {
    // tests trigger onload manually
  }
}

function makeCanvas() {
  const ctx = { drawImage: jest.fn() };
  const canvas = {
    width: 0,
    height: 0,
    getContext: jest.fn(() => ctx),
    toDataURL: jest.fn(() => 'data:cropped'),
    __ctx: ctx,
  };
  return canvas;
}

async function loadHookWithReactMock(useStateInitials) {
  jest.resetModules();

  // captured setters (by call order):
  // 0 isUploadOpen, 1 previewUrl, 2 uploadMode, 3 isDragActive
  const stateSetters = [jest.fn(), jest.fn(), jest.fn(), jest.fn()];

  let call = 0;
  const reactMock = {
    useState: jest.fn((init) => {
      const idx = call++;
      const initial =
        useStateInitials && idx < useStateInitials.length
          ? useStateInitials[idx]
          : typeof init === 'function'
            ? init()
            : init;
      return [initial, stateSetters[idx]];
    }),
    useCallback: jest.fn((fn) => fn),
    useRef: jest.fn((init) => ({ current: init })),
  };

  await jest.unstable_mockModule('react', () => ({
    __esModule: true,
    useState: reactMock.useState,
    useCallback: reactMock.useCallback,
    useRef: reactMock.useRef,
  }));

  const mod = await import('../../src/ui/pages/Start/hooks/useImageUpload.js');
  useImageUpload = mod.default;

  return { reactMock, stateSetters };
}

describe('useImageUpload (ESM, no jsdom)', () => {
  let setPictureUrl;
  let setTemporaryUrl;
  let toggleBackground;
  let intl;

  let alertSpy;
  let errorSpy;

  beforeEach(() => {
    jest.clearAllMocks();

    // Node globals the hook expects
    globalThis.FileReader = MockFileReader;
    globalThis.Image = MockImage;

    const canvas = makeCanvas();
    globalThis.document = {
      createElement: jest.fn((tag) => {
        if (tag !== 'canvas') throw new Error(`Unexpected createElement: ${tag}`);
        return canvas;
      }),
    };

    // Ensure alert exists
    globalThis.alert = jest.fn();

    alertSpy = jest.spyOn(globalThis, 'alert').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    setPictureUrl = jest.fn();
    setTemporaryUrl = jest.fn();
    toggleBackground = jest.fn();
    intl = { formatMessage: jest.fn(() => 'UPLOAD_ERROR') };
  });

  afterEach(() => {
    alertSpy.mockRestore?.();
    errorSpy.mockRestore?.();
  });

  test('openUpload sets isUploadOpen true', async () => {
    const { stateSetters } = await loadHookWithReactMock([false, null, 'shrink', false]);
    const api = useImageUpload({ setPictureUrl, setTemporaryUrl, toggleBackground, intl });

    api.openUpload();
    expect(stateSetters[0]).toHaveBeenCalledWith(true);
  });

  test('closeUpload resets isUploadOpen, previewUrl, uploadMode; clears file input value when ref.current exists', async () => {
    const { stateSetters } = await loadHookWithReactMock([true, 'data:x', 'scale', true]);
    const api = useImageUpload({ setPictureUrl, setTemporaryUrl, toggleBackground, intl });

    api.fileInputRef.current = { value: 'something' };

    api.closeUpload();

    expect(stateSetters[0]).toHaveBeenCalledWith(false);
    expect(stateSetters[1]).toHaveBeenCalledWith(null);
    expect(stateSetters[2]).toHaveBeenCalledWith('shrink');
    expect(api.fileInputRef.current.value).toBe('');
  });

  test('closeUpload does not throw when fileInputRef.current is null', async () => {
    await loadHookWithReactMock([true, 'data:x', 'scale', true]);
    const api = useImageUpload({ setPictureUrl, setTemporaryUrl, toggleBackground, intl });

    api.fileInputRef.current = null;
    expect(() => api.closeUpload()).not.toThrow();
  });

  test('selectFile: early return when no file selected', async () => {
    const { stateSetters } = await loadHookWithReactMock([false, null, 'shrink', false]);
    const api = useImageUpload({ setPictureUrl, setTemporaryUrl, toggleBackground, intl });

    api.selectFile({ target: { files: [] } });
    expect(stateSetters[1]).not.toHaveBeenCalled();
  });

  test('selectFile: uses FileReader and sets previewUrl from reader result', async () => {
    const { stateSetters } = await loadHookWithReactMock([false, null, 'shrink', false]);
    const api = useImageUpload({ setPictureUrl, setTemporaryUrl, toggleBackground, intl });

    api.selectFile({ target: { files: [{ name: 'a.png' }] } });

    await tick();

    expect(lastFileReader).toBeDefined();
    expect(stateSetters[1]).toHaveBeenCalledWith('data:a.png');
  });

  test('handleDragOver prevents default/propagation and sets isDragActive true', async () => {
    const { stateSetters } = await loadHookWithReactMock([false, null, 'shrink', false]);
    const api = useImageUpload({ setPictureUrl, setTemporaryUrl, toggleBackground, intl });

    const e = { preventDefault: jest.fn(), stopPropagation: jest.fn() };
    api.handleDragOver(e);

    expect(e.preventDefault).toHaveBeenCalled();
    expect(e.stopPropagation).toHaveBeenCalled();
    expect(stateSetters[3]).toHaveBeenCalledWith(true);
  });

  test('handleDragLeave prevents default/propagation and sets isDragActive false', async () => {
    const { stateSetters } = await loadHookWithReactMock([false, null, 'shrink', true]);
    const api = useImageUpload({ setPictureUrl, setTemporaryUrl, toggleBackground, intl });

    const e = { preventDefault: jest.fn(), stopPropagation: jest.fn() };
    api.handleDragLeave(e);

    expect(e.preventDefault).toHaveBeenCalled();
    expect(e.stopPropagation).toHaveBeenCalled();
    expect(stateSetters[3]).toHaveBeenCalledWith(false);
  });

  test('handleDrop: early return when no dropped file; still disables drag active', async () => {
    const { stateSetters } = await loadHookWithReactMock([false, null, 'shrink', true]);
    const api = useImageUpload({ setPictureUrl, setTemporaryUrl, toggleBackground, intl });

    const e = {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      dataTransfer: { files: [] },
    };
    api.handleDrop(e);

    expect(stateSetters[3]).toHaveBeenCalledWith(false);
    expect(stateSetters[1]).not.toHaveBeenCalled();
  });

  test('handleDrop: reads dropped file and sets previewUrl via FileReader', async () => {
    const { stateSetters } = await loadHookWithReactMock([false, null, 'shrink', true]);
    const api = useImageUpload({ setPictureUrl, setTemporaryUrl, toggleBackground, intl });

    const e = {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      dataTransfer: { files: [{ name: 'drop.jpg' }] },
    };
    api.handleDrop(e);

    expect(stateSetters[3]).toHaveBeenCalledWith(false);

    await tick();

    expect(stateSetters[1]).toHaveBeenCalledWith('data:drop.jpg');
  });

  test('confirmUpload: early return when previewUrl is null', async () => {
    await loadHookWithReactMock([false, null, 'shrink', false]);
    const api = useImageUpload({ setPictureUrl, setTemporaryUrl, toggleBackground, intl });

    await api.confirmUpload();

    expect(setPictureUrl).not.toHaveBeenCalled();
    expect(setTemporaryUrl).not.toHaveBeenCalled();
    expect(toggleBackground).not.toHaveBeenCalled();
  });

  test('confirmUpload: non-scale mode sets urls to previewUrl, toggles background, then closeUpload', async () => {
    const { stateSetters } = await loadHookWithReactMock([true, 'data:img', 'shrink', false]);
    const api = useImageUpload({ setPictureUrl, setTemporaryUrl, toggleBackground, intl });

    api.fileInputRef.current = { value: 'x' };

    await api.confirmUpload();

    expect(setPictureUrl).toHaveBeenCalledWith('data:img');
    expect(setTemporaryUrl).toHaveBeenCalledWith('data:img');
    expect(toggleBackground).toHaveBeenCalledWith(true);

    // closeUpload side effects
    expect(stateSetters[0]).toHaveBeenCalledWith(false);
    expect(stateSetters[1]).toHaveBeenCalledWith(null);
    expect(stateSetters[2]).toHaveBeenCalledWith('shrink');
    expect(api.fileInputRef.current.value).toBe('');
  });

  test('confirmUpload: scale mode crops (landscape aspect>1) and sets cropped url', async () => {
    await loadHookWithReactMock([true, 'data:img', 'scale', false]);
    const api = useImageUpload({ setPictureUrl, setTemporaryUrl, toggleBackground, intl });

    lastImage = undefined;

    const p = api.confirmUpload();

    // cropImage created Image
    expect(lastImage).toBeDefined();

    lastImage.naturalWidth = 400;
    lastImage.naturalHeight = 200; // aspect 2 (>1)
    lastImage.onload();

    await p;

    expect(setPictureUrl).toHaveBeenCalledWith('data:cropped');
    expect(setTemporaryUrl).toHaveBeenCalledWith('data:cropped');
    expect(toggleBackground).toHaveBeenCalledWith(true);
  });

  test('confirmUpload: scale mode crops (portrait aspect<=1) uses width as square size', async () => {
    await loadHookWithReactMock([true, 'data:img', 'scale', false]);
    const api = useImageUpload({ setPictureUrl, setTemporaryUrl, toggleBackground, intl });

    const canvas = globalThis.document.createElement('canvas');

    const p = api.confirmUpload();

    expect(lastImage).toBeDefined();

    lastImage.naturalWidth = 100;
    lastImage.naturalHeight = 300; // aspect <= 1
    lastImage.onload();

    await p;

    expect(canvas.width).toBe(100);
    expect(canvas.height).toBe(100);
    expect(canvas.getContext).toHaveBeenCalledWith('2d');
    expect(canvas.__ctx.drawImage).toHaveBeenCalled();
  });

});
