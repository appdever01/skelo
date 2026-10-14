import { captureLayout } from '../scan';
import { createQualityChecker, type CheckerOptions } from '../quality/checker';
import type { LayoutSnapshot, ScanOptions } from '../types';
import type { QualityReport } from '../quality/compare';

export function observeLayout(root: HTMLElement, scan: ScanOptions, callback: (layout: LayoutSnapshot) => void) {
  return observe(root, () => callback(captureLayout(root, scan)), 32);
}

export function observeQuality(root: HTMLElement, options: CheckerOptions, callback: (report: QualityReport) => void) {
  const checker = createQualityChecker(root, options);
  const stop = observe(root, () => checker.capture().forEach(callback), 0);
  return () => { stop(); checker.reset(); };
}

function observe(root: HTMLElement, run: () => void, delay: number) {
  const view = root.ownerDocument.defaultView;
  if (!view) return () => {};
  let timer: number | undefined;
  const schedule = () => {
    view.clearTimeout(timer);
    timer = view.setTimeout(run, delay);
  };
  run();
  const mutation = new view.MutationObserver(schedule);
  mutation.observe(root, { subtree: true, childList: true, characterData: true, attributes: true });
  const resize = typeof view.ResizeObserver === 'function' ? new view.ResizeObserver(schedule) : undefined;
  resize?.observe(root);
  view.addEventListener('resize', schedule);
  return () => {
    view.clearTimeout(timer);
    mutation.disconnect();
    resize?.disconnect();
    view.removeEventListener('resize', schedule);
  };
}
