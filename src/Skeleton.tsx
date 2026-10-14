import { useEffect, useRef, useState, version, type ReactNode } from 'react';
import { captureLayout } from './scan';
import { isLayoutSnapshot } from './quality/compare';
import type { Animation, LayoutSnapshot, ScanOptions } from './types';

const DEFAULT_OPTIONS: ScanOptions = {};
const inertValue = (Number(version.split('.')[0]) >= 19 ? true : '') as boolean;

function Bones({ layout, animation }: { layout: LayoutSnapshot; animation: Animation }) {
  return <div className="lr-overlay" aria-hidden="true" data-loading-overlay>
    {layout.bones.map((bone, index) => <span key={`${bone.key}:${index}`} data-loading-key={bone.key}
      className={`lr-bone lr-${animation}`} data-skeleton-shape={bone.kind}
      style={{ left: `${bone.x / layout.width * 100}%`, top: bone.y,
        width: `${bone.width / layout.width * 100}%`, height: bone.height,
        borderRadius: bone.kind === 'circle' ? '50%' : bone.radius }} />)}
  </div>;
}

export interface SkeletonProps {
  template?: ReactNode;
  layout?: LayoutSnapshot;
  animation?: Animation;
  scan?: ScanOptions;
  minHeight?: number | string;
}

export function Skeleton({ template, layout, animation = 'pulse', scan = DEFAULT_OPTIONS, minHeight = 24 }: SkeletonProps) {
  if (layout && !isLayoutSnapshot(layout)) throw new Error('Skeleton layout must be a valid version 1 snapshot.');
  const ref = useRef<HTMLDivElement>(null);
  const [measured, setMeasured] = useState<LayoutSnapshot>();
  const signature = useRef('');
  useEffect(() => {
    const root = ref.current;
    if (!root || layout || template === undefined) return;
    const view = root.ownerDocument.defaultView;
    if (!view) return;
    let timer: number | undefined;
    const measure = () => {
      const next = captureLayout(root, scan);
      const key = JSON.stringify([next.width, next.height, next.bones, next.complete, next.reason]);
      if (signature.current !== key) {
        signature.current = key;
        setMeasured(next);
      }
    };
    const schedule = () => {
      view.clearTimeout(timer);
      timer = view.setTimeout(measure, 32);
    };
    measure();
    const resize = typeof view.ResizeObserver === 'function' ? new view.ResizeObserver(schedule) : undefined;
    resize?.observe(root);
    const mutation = new view.MutationObserver(schedule);
    mutation.observe(root, { subtree: true, childList: true, characterData: true, attributes: true });
    view.addEventListener('resize', schedule);
    return () => {
      view.clearTimeout(timer);
      resize?.disconnect();
      mutation.disconnect();
      view.removeEventListener('resize', schedule);
    };
  }, [template, layout, scan]);
  const effective = layout ?? measured;
  const usable = effective && effective.width > 0 && effective.height > 0 && effective.bones.length > 0 && effective.complete;
  const capture = effective && !effective.complete ? 'incomplete' : usable ? 'measured' : (template !== undefined || layout) ? 'unmeasured' : 'fallback';
  return <div className="lr-skeleton" aria-hidden="true" data-loading-capture={capture}
    data-loading-capture-reason={effective?.reason} style={{ minHeight, ...(layout ? { height: layout.height } : {}) }}>
    {template !== undefined && !layout ? <div ref={ref} data-loading-template inert={inertValue} className="lr-template">
      {template}
    </div> : null}
    {usable ? <Bones layout={effective} animation={animation} /> : <div className={`lr-bone lr-fallback lr-${animation}`} data-loading-key="fallback" />}
  </div>;
}
