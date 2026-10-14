import { describe, expect, it } from 'vitest';
import { captureNativeLayout, type NativeMeasurable } from '../src/native/measure';
import { compareLayouts, createRegionCheck, unavailableLayout } from '../src/core';
const view = (x: number, y: number, width: number, height: number): NativeMeasurable => ({ measureInWindow: callback => callback(x, y, width, height) });

describe('native public measurements', () => {
  it('uses window coordinates relative to the root and stable registered keys', async () => {
    const snapshot = await captureNativeLayout(view(100, 200, 300, 80), [{ key: 'name', view: view(108, 208, 100, 20), radius: 4 }]);
    expect(snapshot.complete).toBe(true);
    expect(snapshot.bones[0]).toEqual({ key: 'name', x: 8, y: 8, width: 100, height: 20, radius: 4, kind: 'rect' });
    expect(compareLayouts(snapshot, snapshot).passed).toBe(true);
  });
  it('rejects partial, absent, zero, invalid and timed-out measurements', async () => {
    const root = view(0, 0, 100, 50);
    for (const target of [null, view(0, 0, 0, 0), view(NaN, 0, 20, 20), { measureInWindow: () => {} }]) {
      const snapshot = await captureNativeLayout(root, [{ key: 'bad', view: target }], 2);
      expect(snapshot.complete).toBe(false); expect(compareLayouts(snapshot, snapshot).passed).toBe(false);
    }
    expect((await captureNativeLayout(null, [])).complete).toBe(false);
    expect((await captureNativeLayout(root, [])).complete).toBe(false);
  });
  it('cannot pass when loading completed before pending capture', () => {
    const check = createRegionCheck('fast'); check.start();
    expect(check.capture('ready', unavailableLayout())?.passed).toBe(false);
    check.start();
    expect(check.capture('error', unavailableLayout())?.issues[0]?.code).toBe('LOAD_FAILED');
  });
});
