import { describe, expect, it } from 'vitest';
import { auditHiddenFocus, compareLayouts, isLayoutSnapshot } from '../src/quality';
import type { LayoutSnapshot } from '../src/types';

export function sample(): LayoutSnapshot {
  return { version: 1, width: 200, height: 80, complete: true, visited: 2, durationMs: 1,
    bones: [{ key: 'name', x: 8, y: 8, width: 100, height: 20, radius: 4, kind: 'rect' }] };
}

describe('quality comparison', () => {
  it('passes matching measured states and reports drift', () => {
    expect(compareLayouts(sample(), sample()).passed).toBe(true);
    const actual = sample();
    actual.bones[0]!.y = 24;
    const result = compareLayouts(sample(), actual);
    expect(result.passed).toBe(false);
    expect(result.metrics.maxDriftPx).toBe(16);
    expect(result.issues[0]?.code).toBe('BONE_DRIFT');
  });
  it('uses stable keys instead of element ordering', () => {
    const before = sample();
    before.bones.push({ ...before.bones[0]!, key: 'bio', y: 40 });
    const after = { ...before, bones: [...before.bones].reverse() };
    expect(compareLayouts(before, after).passed).toBe(true);
  });
  it('rejects zero-layout and incomplete captures instead of producing a false pass', () => {
    expect(compareLayouts({ ...sample(), width: 0, bones: [] }, { ...sample(), width: 0, bones: [] }).issues.some(i => i.code === 'NO_GEOMETRY')).toBe(true);
    const report = compareLayouts({ ...sample(), complete: false, reason: 'max-elements' }, sample());
    expect(report.comparable).toBe(false);
    expect(report.passed).toBe(false);
  });
  it('reports changed container context, height, missing elements, duplicates and overflow', () => {
    expect(compareLayouts(sample(), { ...sample(), width: 320 }).comparable).toBe(false);
    expect(compareLayouts(sample(), { ...sample(), height: 110 }).issues.some(i => i.code === 'CONTAINER_DRIFT')).toBe(true);
    const missing = sample();
    missing.bones[0]!.key = 'other';
    expect(compareLayouts(sample(), missing).issues.map(i => i.code)).toEqual(['MISSING_BONE', 'UNEXPECTED_BONE']);
    const duplicate = sample();
    duplicate.bones.push(duplicate.bones[0]!);
    expect(compareLayouts(sample(), duplicate).issues.some(i => i.code === 'DUPLICATE_KEY')).toBe(true);
    const overflow = sample();
    overflow.bones[0]!.x = 190;
    expect(compareLayouts(sample(), overflow).issues.some(i => i.code === 'OVERFLOW')).toBe(true);
  });
  it('validates external snapshots and tolerances', () => {
    expect(isLayoutSnapshot(sample())).toBe(true);
    expect(isLayoutSnapshot({ ...sample(), durationMs: NaN })).toBe(false);
    expect(isLayoutSnapshot({ ...sample(), complete: true, reason: 'max-elements' })).toBe(false);
    expect(compareLayouts({ ...sample(), complete: true, reason: 'max-elements' }, sample()).passed).toBe(false);
    expect(isLayoutSnapshot({ ...sample(), bones: [{ ...sample().bones[0], width: -1 }] })).toBe(false);
    expect(compareLayouts(null as unknown as LayoutSnapshot, sample()).issues[0]?.code).toBe('INVALID_SNAPSHOT');
    expect(() => compareLayouts(sample(), sample(), { tolerancePx: -1 })).toThrow();
    const actual = sample();
    actual.bones[0]!.width += 4;
    expect(compareLayouts(sample(), actual, { tolerancePx: 4 }).passed).toBe(true);
    expect(compareLayouts(sample(), actual, { tolerancePx: 3 }).passed).toBe(false);
  });
});

describe('hidden keyboard controls', () => {
  it('finds hidden focusable controls and ignores inert or disabled controls', () => {
    const root = document.createElement('div');
    root.innerHTML = '<div aria-hidden="true"><button>Bad</button></div><div aria-hidden="true" inert><button>Safe</button></div><div aria-hidden="true"><button disabled>Disabled</button><button tabindex="-1">Removed</button></div>';
    document.body.append(root);
    expect(auditHiddenFocus(root)).toHaveLength(1);
    root.remove();
  });
  it('does not flag display-none elements as tabbable and catches transparent controls', () => {
    const root = document.createElement('div');
    root.innerHTML = '<div style="display:none"><button>Hidden</button></div><div style="opacity:0"><a href="#">Transparent</a></div>';
    document.body.append(root);
    expect(auditHiddenFocus(root)).toHaveLength(1);
    root.remove();
  });
  it('checks hidden ancestors outside the supplied region', () => {
    const outside = document.createElement('div');
    outside.setAttribute('aria-hidden', 'true');
    outside.innerHTML = '<div><button>Hidden by ancestor</button></div>';
    document.body.append(outside);
    expect(auditHiddenFocus(outside.firstElementChild as HTMLElement)).toHaveLength(1);
    outside.style.display = 'none';
    expect(auditHiddenFocus(outside.firstElementChild as HTMLElement)).toHaveLength(0);
    outside.remove();
  });
});
