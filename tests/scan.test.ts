import { afterEach, describe, expect, it, vi } from 'vitest';
import { captureLayout, createQualityChecker } from '../src/quality';

function box(width: number, height: number, x = 0, y = 0): DOMRect {
  return { x, y, width, height, left: x, top: y, right: x + width, bottom: y + height, toJSON: () => ({}) };
}

function fixture(html: string) {
  const root = document.createElement('div');
  root.innerHTML = html;
  document.body.append(root);
  vi.spyOn(root, 'getBoundingClientRect').mockReturnValue(box(200, 100, 10, 20));
  for (const el of root.querySelectorAll('*')) vi.spyOn(el, 'getBoundingClientRect').mockReturnValue(box(60, 20, 18, 28));
  return root;
}

afterEach(() => { document.body.replaceChildren(); vi.restoreAllMocks(); });

describe('bounded layout scanner with supplied geometry', () => {
  it('uses root-relative coordinates without copying text content', () => {
    const root = fixture('<p data-loading-key="name">Private name</p>');
    const snapshot = captureLayout(root, { maxScanMs: 1000 });
    expect(snapshot.bones[0]?.x).toBe(8);
    expect(snapshot.bones[0]?.y).toBe(8);
    expect(snapshot.bones[0]?.key).toBe('name:text:0');
    expect(JSON.stringify(snapshot)).not.toContain('Private');
    expect(snapshot.complete).toBe(true);
  });
  it('measures nested inline text and ignores whole subtrees', () => {
    const root = fixture('<div>Parent <span>Child</span></div><section data-skeleton-ignore><p>Ignored</p></section>');
    expect(captureLayout(root, { maxScanMs: 1000 }).bones).toHaveLength(2);
  });
  it('classifies rounded images and stops at forced shapes', () => {
    const root = fixture('<img style="border-radius:50%" /><div data-skeleton-shape="circle"><span>Nested</span></div>');
    vi.mocked(root.firstElementChild!.getBoundingClientRect).mockReturnValue(box(40, 40, 10, 20));
    const result = captureLayout(root, { maxScanMs: 1000 });
    expect(result.bones).toHaveLength(2);
    expect(result.bones.every(b => b.kind === 'circle')).toBe(true);
  });
  it('preserves containers with display:contents and skips invisible elements', () => {
    const root = fixture('<div style="display:contents"><span>Shown</span></div><div style="display:none"><p>Hidden</p></div><p style="opacity:0">Invisible</p>');
    expect(captureLayout(root, { maxScanMs: 1000 }).bones).toHaveLength(1);
  });
  it('reports each scan budget instead of silently omitting content', () => {
    const root = fixture('<div><span>Deep</span></div><p>Another</p>');
    expect(captureLayout(root, { maxDepth: 0, maxScanMs: 1000 }).reason).toBe('max-depth');
    expect(captureLayout(root, { maxElements: 1, maxScanMs: 1000 }).reason).toBe('max-elements');
    vi.spyOn(window.performance, 'now').mockReturnValueOnce(0).mockReturnValue(2);
    expect(captureLayout(root, { maxScanMs: 1 }).reason).toBe('max-time');
  });
  it('rejects invalid options and selectors', () => {
    const root = fixture('<p>Text</p>');
    expect(() => captureLayout(root, { maxDepth: -1 })).toThrow();
    expect(() => captureLayout(root, { maxScanMs: Infinity })).toThrow();
    expect(() => captureLayout(root, { ignoreSelectors: ['['] })).toThrow();
  });
  it('does not expand a large sibling list before applying the element budget', () => {
    const root = document.createElement('div');
    root.innerHTML = '<span>Text</span>'.repeat(2000);
    document.body.append(root);
    vi.spyOn(root, 'getBoundingClientRect').mockReturnValue(box(200, 100));
    vi.spyOn(root.firstElementChild!, 'getBoundingClientRect').mockReturnValue(box(60, 20));
    const children = root.children;
    const expanded = vi.fn();
    const bounded = {
      length: children.length,
      item(index: number) { expanded(); return children.item(index); },
      *[Symbol.iterator]() { for (const child of children) { expanded(); yield child; } },
    };
    vi.spyOn(root, 'children', 'get').mockReturnValue(bounded as unknown as HTMLCollection);
    const result = captureLayout(root, { maxElements: 1, maxScanMs: 1000 });
    expect(result.reason).toBe('max-elements');
    expect(result.visited).toBe(1);
    expect(expanded).toHaveBeenCalledOnce();
  });
  it('captures shadow-root leaves when they are open', () => {
    const root = fixture('<section></section>');
    const host = root.firstElementChild!;
    const shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML = '<span>Shadow content</span>';
    vi.spyOn(shadow.firstElementChild!, 'getBoundingClientRect').mockReturnValue(box(60, 20, 18, 28));
    const result = captureLayout(root, { maxScanMs: 1000 });
    expect(result.bones.some(b => b.key.includes('shadow'))).toBe(true);
  });
});

describe('region checker lifecycle with supplied geometry', () => {
  it('compares a region once after completion and captures the next load afresh', () => {
    const root = fixture('<div data-loading-region="profile" data-loading-state="pending"><div data-loading-content><p data-loading-key="name">Alex</p></div></div>');
    const checker = createQualityChecker(root, { scan: { maxScanMs: 1000 } });
    expect(checker.capture()).toEqual([]);
    root.firstElementChild!.setAttribute('data-loading-state', 'ready');
    expect(checker.capture()[0]?.passed).toBe(true);
    expect(checker.capture()).toEqual([]);
    root.firstElementChild!.setAttribute('data-loading-state', 'pending');
    checker.capture();
    root.firstElementChild!.setAttribute('data-loading-state', 'ready');
    vi.mocked(root.querySelector('p')!.getBoundingClientRect).mockReturnValue(box(90, 20, 18, 28));
    expect(checker.capture()[0]?.issues.some(i => i.code === 'BONE_DRIFT')).toBe(true);
  });
  it('isolates regions and flags duplicate IDs and failed loads', () => {
    const root = fixture('<div data-loading-region="same" data-loading-state="pending"><div data-loading-content><p>One</p></div></div><div data-loading-region="same" data-loading-state="ready"><div data-loading-content><p>Two</p></div></div>');
    const checker = createQualityChecker(root);
    expect(checker.capture()[0]?.issues[0]?.code).toBe('DUPLICATE_REGION');
    root.children[1]!.remove();
    checker.capture();
    root.firstElementChild!.setAttribute('data-loading-state', 'error');
    expect(checker.capture()[0]?.issues[0]?.code).toBe('LOAD_FAILED');
  });
  it('never passes a zero-layout completion', () => {
    const root = document.createElement('div');
    root.innerHTML = '<div data-loading-region="empty" data-loading-state="pending"><div data-loading-content><p>Text</p></div></div>';
    const checker = createQualityChecker(root);
    checker.capture();
    root.firstElementChild!.setAttribute('data-loading-state', 'ready');
    expect(checker.capture()[0]?.passed).toBe(false);
    expect(checker.capture()).toEqual([]);
  });
  it('preserves incomplete template evidence when measuring a rendered fallback', () => {
    const root = fixture('<div data-loading-region="profile" data-loading-state="pending"><div data-loading-content><div data-loading-capture="incomplete" data-loading-capture-reason="max-elements"><p data-loading-key="name">Alex</p></div></div></div>');
    const checker = createQualityChecker(root, { scan: { maxScanMs: 1000 } });
    checker.capture();
    root.firstElementChild!.setAttribute('data-loading-state', 'ready');
    const report = checker.capture()[0];
    expect(report?.passed).toBe(false);
    expect(report?.issues.some(i => i.code === 'INCOMPLETE_CAPTURE')).toBe(true);
  });
});
