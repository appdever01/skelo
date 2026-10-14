import type { Bone, LayoutSnapshot } from '../types';
import { unavailableLayout } from '../core/region-check';

export interface NativeMeasurable {
  measureInWindow(callback: (x: number, y: number, width: number, height: number) => void): void;
}

export interface NativeTarget {
  key: string;
  view: NativeMeasurable | null;
  radius?: number;
  kind?: Bone['kind'];
}

export async function captureNativeLayout(root: NativeMeasurable | null, targets: readonly NativeTarget[], timeoutMs = 100): Promise<LayoutSnapshot> {
  if (!Number.isFinite(timeoutMs) || timeoutMs < 0) throw new Error('timeoutMs must be finite and non-negative.');
  const started = Date.now();
  const measure = (view: NativeMeasurable | null) => new Promise<{ x: number; y: number; width: number; height: number } | undefined>(resolve => {
    const timer = setTimeout(() => resolve(undefined), timeoutMs);
    try {
      if (!view) { clearTimeout(timer); resolve(undefined); return; }
      view.measureInWindow((x, y, width, height) => {
        clearTimeout(timer);
        resolve([x, y, width, height].every(Number.isFinite) && width > 0 && height > 0 ? { x, y, width, height } : undefined);
      });
    } catch { clearTimeout(timer); resolve(undefined); }
  });
  const [container, ...boxes] = await Promise.all([measure(root), ...targets.map(t => measure(t.view))]);
  if (!container) return { ...unavailableLayout(), durationMs: Date.now() - started };
  const bones: Bone[] = [];
  targets.forEach((target, i) => {
    const box = boxes[i];
    if (box) bones.push({ key: target.key, x: box.x - container.x, y: box.y - container.y,
      width: box.width, height: box.height, radius: target.radius ?? 0, kind: target.kind ?? 'rect' });
  });
  const complete = targets.length > 0 && boxes.every(Boolean);
  return { version: 1, width: container.width, height: container.height, bones, visited: targets.length,
    durationMs: Date.now() - started, complete, ...(!complete ? { reason: 'measurement-unavailable' as const } : {}) };
}
