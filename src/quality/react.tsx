import { useEffect, useRef, type ReactNode } from 'react';
import { createQualityChecker, type CheckerOptions } from './checker';
import type { QualityReport } from './compare';

export interface QualityBoundaryProps {
  children: ReactNode;
  onReport: (report: QualityReport) => void;
  options?: CheckerOptions;
  enabled?: boolean;
  className?: string;
}

const DEFAULT_OPTIONS: CheckerOptions = {};

export function QualityBoundary({ children, onReport, options = DEFAULT_OPTIONS, enabled = true, className }: QualityBoundaryProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const callback = useRef(onReport);
  const optionsKey = JSON.stringify(options);
  useEffect(() => { callback.current = onReport; }, [onReport]);
  useEffect(() => {
    const root = rootRef.current;
    const view = root?.ownerDocument.defaultView;
    if (!enabled || !root || !view) return;
    const checker = createQualityChecker(root, options);
    let timer: number | undefined;
    const run = () => { checker.capture().forEach(report => callback.current(report)); };
    const schedule = () => {
      view.clearTimeout(timer);
      timer = view.setTimeout(run, 0);
    };
    run();
    const observer = new view.MutationObserver(schedule);
    observer.observe(root, { childList: true, subtree: true, attributes: true, characterData: true });
    const resize = typeof view.ResizeObserver === 'function' ? new view.ResizeObserver(schedule) : undefined;
    resize?.observe(root);
    view.addEventListener('resize', schedule);
    return () => {
      observer.disconnect();
      resize?.disconnect();
      view.clearTimeout(timer);
      view.removeEventListener('resize', schedule);
      checker.reset();
    };
  }, [enabled, optionsKey]);
  return <div ref={rootRef} className={className} data-loading-quality>{children}</div>;
}
