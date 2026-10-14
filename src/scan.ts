import type { Bone, LayoutSnapshot, ScanOptions } from './types';

function toRadius(style: CSSStyleDeclaration, width: number, height: number): number {
  const radiusStr = style.borderRadius || '0';
  const firstValue = radiusStr.split(' ')[0] ?? '0';
  if (firstValue.endsWith('%')) {
    const percent = parseFloat(firstValue);
    return Math.min((percent / 100) * Math.min(width, height), Math.min(width, height) / 2);
  }
  const raw = parseFloat(firstValue || '0');
  if (Number.isNaN(raw)) return 0;
  return Math.min(raw, Math.min(width, height) / 2);
}

function autoKind(width: number, height: number, radius: number): Bone['kind'] {
  const nearSquare = Math.abs(width - height) <= 2;
  const likelyCircle = nearSquare && radius >= Math.min(width, height) * 0.45;
  return likelyCircle ? 'circle' : 'rect';
}

function explicitLineCount(el: Element): number | null {
  const raw = el.getAttribute('data-skeleton-lines');
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, 100) : null;
}

function limit(value: number | undefined, fallback: number, name: string): number {
  const result = value ?? fallback;
  if (!Number.isFinite(result) || result < 0) throw new Error(`${name} must be a finite non-negative number.`);
  return result;
}

export function captureLayout(root: HTMLElement, options: ScanOptions = {}): LayoutSnapshot {
  const view = root.ownerDocument.defaultView;
  if (!view) throw new Error('Layout capture requires a document with a window.');
  const clock = () => view.performance.now();
  const started = clock();
  const maxDepth = limit(options.maxDepth, 16, 'maxDepth');
  const maxElements = limit(options.maxElements, 500, 'maxElements');
  const maxScanMs = limit(options.maxScanMs, 16, 'maxScanMs');
  const minSize = limit(options.minSize, 2, 'minSize');
  for (const selector of options.ignoreSelectors ?? []) root.matches(selector);
  const rect = root.getBoundingClientRect();
  const bones: Bone[] = [];
  let visited = 0;
  let reason: LayoutSnapshot['reason'];
  const stack: { parent: Element | ShadowRoot; depth: number; key: string; index: number }[] = [
    { parent: root, depth: 0, key: 'root', index: 0 },
  ];
  if (root.shadowRoot) stack.push({ parent: root.shadowRoot, depth: 0, key: 'shadow', index: 0 });
  const rootStyle = view.getComputedStyle(root);
  if (rootStyle.display === 'none' || rootStyle.visibility === 'hidden') stack.length = 0;
  while (stack.length) {
    const frame = stack[stack.length - 1];
    if (!frame) break;
    if (frame.index >= frame.parent.children.length) { stack.pop(); continue; }
    if (visited >= maxElements) { reason = 'max-elements'; break; }
    if (clock() - started > maxScanMs) { reason = 'max-time'; break; }
    const index = frame.index++;
    const el = frame.parent.children.item(index);
    if (!el) continue;
    const depth = frame.depth;
    const path = `${frame.key}/${index}`;
    visited++;
    if (el.hasAttribute('data-skeleton-ignore') || el.hasAttribute('data-no-skeleton') ||
        options.ignoreSelectors?.some(selector => el.matches(selector))) continue;
    const style = view.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.visibility === 'collapse' ||
        (style.opacity !== '' && Number(style.opacity) === 0)) continue;
    const box = el.getBoundingClientRect();
    const key = el.getAttribute('data-loading-key') ?? path;
    const forced = el.getAttribute('data-skeleton-shape');
    const isAtomic = forced === 'circle' || forced === 'rect' || /^(IMG|SVG|VIDEO|CANVAS|INPUT|TEXTAREA|SELECT|BUTTON)$/.test(el.tagName);
    if (!isAtomic && visited >= maxElements && (el.children.length || el.shadowRoot?.children.length)) {
      reason = 'max-elements';
      break;
    }
    const textNodes: Node[] = [];
    if (!isAtomic) {
      for (let node = el.firstChild; node; node = node.nextSibling) {
        if (clock() - started > maxScanMs) { reason = 'max-time'; break; }
        if (node.nodeType === 3 && node.textContent?.trim()) textNodes.push(node);
      }
      if (reason === 'max-time') break;
    }
    if (isAtomic || (el.children.length === 0 && !el.shadowRoot?.children.length && textNodes.length === 0 && style.display !== 'contents')) {
      if (box.width > 0 && box.height > 0 && box.width >= minSize && box.height >= minSize) {
        const radius = toRadius(style, box.width, box.height);
        bones.push({ key, x: box.left - rect.left, y: box.top - rect.top,
          width: box.width, height: box.height, radius,
          kind: forced === 'circle' || forced === 'rect' ? forced : autoKind(box.width, box.height, radius) });
      }
    } else if (textNodes.length) {
      const fontSize = parseFloat(style.fontSize) || 16;
      const lineHeight = parseFloat(style.lineHeight) || fontSize * 1.4;
      const explicit = explicitLineCount(el);
      let measured: DOMRect[] = [];
      if (!explicit) {
        for (const node of textNodes) {
          const range = root.ownerDocument.createRange();
          range.selectNodeContents(node);
          if (typeof range.getClientRects === 'function') measured.push(...Array.from(range.getClientRects()));
        }
      }
      measured = measured.filter(b => b.width > 0 && b.height > 0 && b.width >= minSize && b.height >= minSize);
      if (measured.length) {
        measured.forEach((b, i) => bones.push({ key: `${key}:text:${i}`, x: b.left - rect.left,
          y: b.top - rect.top, width: b.width, height: b.height, radius: 4, kind: 'rect' }));
      } else if (box.width > 0 && box.height > 0 && box.width >= minSize && box.height >= minSize) {
        const lines = explicit ?? Math.min(100, Math.max(1, Math.round(box.height / lineHeight)));
        for (let i = 0; i < lines; i++) {
          const height = Math.min(lineHeight * 0.72, box.height - i * lineHeight);
          if (height <= 0 || height < minSize) break;
          bones.push({ key: `${key}:text:${i}`, x: box.left - rect.left, y: box.top - rect.top + i * lineHeight,
            width: box.width * (i === lines - 1 && lines > 1 ? 0.75 : 1), height, radius: 4, kind: 'rect' });
        }
      }
    }
    if (!isAtomic) {
      if (depth + 1 > maxDepth) {
        if (el.children.length || el.shadowRoot?.children.length) reason ??= 'max-depth';
      } else {
        if (el.shadowRoot?.children.length) stack.push({ parent: el.shadowRoot, depth: depth + 1, key: `${key}/shadow`, index: 0 });
        if (el.children.length) stack.push({ parent: el, depth: depth + 1, key, index: 0 });
      }
    }
  }
  return { version: 1, width: rect.width, height: rect.height, bones, visited,
    durationMs: Math.max(0, clock() - started), complete: !reason, ...(reason ? { reason } : {}) };
}
