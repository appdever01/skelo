import { createContext, useCallback, useContext, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { View, Text, Pressable, StyleSheet, type ViewProps } from 'react-native';
import { hasData } from '../resource';
import { isLayoutSnapshot, type QualityReport } from '../quality/compare';
import { createRegionCheck } from '../core/region-check';
import type { Bone, LayoutSnapshot, Resource } from '../types';
import { captureNativeLayout, type NativeTarget } from './measure';

export * from '../core';
export { captureNativeLayout } from './measure';
export type { NativeMeasurable, NativeTarget } from './measure';

type Registry = { targets: Map<object, NativeTarget>; schedule: () => void };
const CaptureContext = createContext<Registry | null>(null);

export function Geometry({ boneKey, radius = 0, kind = 'rect', onLayout, ...props }: ViewProps & { boneKey: string; radius?: number; kind?: Bone['kind'] }) {
  const registry = useContext(CaptureContext);
  const token = useRef({});
  const ref = useCallback((view: View | null) => {
    if (!registry) return;
    if (view) registry.targets.set(token.current, { key: boneKey, view, radius, kind });
    else registry.targets.delete(token.current);
    registry.schedule();
  }, [registry, boneKey, radius, kind]);
  return <View {...props} collapsable={false} ref={ref} onLayout={event => { onLayout?.(event); registry?.schedule(); }} />;
}

export function MeasuredLayout({ onSnapshot, captureKey, children, onLayout, enabled = true, ...props }: ViewProps & {
  onSnapshot: (snapshot: LayoutSnapshot) => void; captureKey?: string; enabled?: boolean;
}) {
  const root = useRef<View>(null);
  const callback = useRef(onSnapshot);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const revision = useRef(0);
  const active = useRef(false);
  const [registry] = useState<Registry>(() => ({ targets: new Map(), schedule: () => {
    if (!active.current) return;
    clearTimeout(timer.current);
    const current = ++revision.current;
    timer.current = setTimeout(() => {
      void captureNativeLayout(root.current, [...registry.targets.values()]).then(snapshot => {
        if (active.current && revision.current === current) callback.current(snapshot);
      });
    }, 0);
  } }));
  useLayoutEffect(() => {
    callback.current = onSnapshot;
    active.current = enabled;
    if (enabled) registry.schedule();
    return () => { active.current = false; revision.current++; clearTimeout(timer.current); };
  }, [onSnapshot, captureKey, registry, enabled]);
  return <View {...props} ref={root} collapsable={false} onLayout={event => { onLayout?.(event); registry.schedule(); }}>
    <CaptureContext.Provider value={registry}>{children}</CaptureContext.Provider>
  </View>;
}

export interface SkeletonProps {
  template?: ReactNode;
  layout?: LayoutSnapshot;
  minHeight?: number;
  color?: string;
}

export function Skeleton({ template, layout, minHeight = 24, color = '#dde1e5' }: SkeletonProps) {
  if (layout && !isLayoutSnapshot(layout)) throw new Error('Skeleton layout must be a valid version 1 snapshot.');
  const [measured, setMeasured] = useState<LayoutSnapshot>();
  const signature = useRef('');
  const receive = useCallback((next: LayoutSnapshot) => {
    const key = JSON.stringify([next.width, next.height, next.bones, next.complete]);
    if (signature.current !== key) { signature.current = key; setMeasured(next); }
  }, []);
  const effective = layout ?? measured;
  const usable = effective?.complete && effective.width > 0 && effective.height > 0 && effective.bones.length > 0;
  return <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" pointerEvents="none"
    style={{ minHeight, ...(layout ? { height: layout.height } : {}) }}>
    {template !== undefined && !layout ? <MeasuredLayout onSnapshot={receive} style={{ opacity: 0 }}>{template}</MeasuredLayout> : null}
    {usable ? <View style={StyleSheet.absoluteFill}>{effective.bones.map((bone, i) =>
      <Geometry key={`${bone.key}:${i}`} boneKey={bone.key} radius={bone.radius} kind={bone.kind}
        style={{ position: 'absolute', left: `${bone.x / effective.width * 100}%`, top: bone.y,
          width: `${bone.width / effective.width * 100}%`, height: bone.height,
          borderRadius: bone.kind === 'circle' ? bone.width / 2 : bone.radius, backgroundColor: color }} />)}</View>
      : <View style={[StyleSheet.absoluteFill, { backgroundColor: color, borderRadius: 6 }]} />}
  </View>;
}

export interface LoadingRegionProps<T> extends SkeletonProps {
  resource: Resource<T>;
  children: ReactNode | ((data: T) => ReactNode);
  id?: string;
  style?: ViewProps['style'];
  fallback?: ReactNode;
  errorFallback?: (error: unknown) => ReactNode;
  onRetry?: () => void;
  onReport?: (report: QualityReport) => void;
  label?: string;
  refreshLabel?: string;
  errorLabel?: string;
  retryLabel?: string;
}

export function LoadingRegion<T>({ resource, children, id, style, fallback, errorFallback, onRetry, onReport,
  label = 'Loading content', refreshLabel = 'Updating content', errorLabel = 'Could not load this content', retryLabel = 'Try again', ...skeleton }: LoadingRegionProps<T>) {
  const generatedId = useId();
  const checker = useRef<ReturnType<typeof createRegionCheck> | undefined>(undefined);
  if (!checker.current) checker.current = createRegionCheck(id ?? generatedId);
  const status = resource.status;
  useLayoutEffect(() => { if (status === 'pending') checker.current?.start(); }, [status]);
  const receive = useCallback((snapshot: LayoutSnapshot) => {
    const report = checker.current?.capture(status, snapshot);
    if (report) onReport?.(report);
  }, [status, onReport]);
  const available = hasData(resource);
  const error = status === 'error' ? (errorFallback ? errorFallback(resource.error) : <View>
    <Text accessibilityRole="alert">{errorLabel}</Text>
    {onRetry ? <Pressable accessibilityRole="button" onPress={onRetry}><Text>{retryLabel}</Text></Pressable> : null}
  </View>) : null;
  return <View nativeID={id ?? generatedId} style={style}>
    <MeasuredLayout captureKey={status} onSnapshot={receive} enabled={onReport !== undefined}>
      {available ? typeof children === 'function' ? children(resource.data) : children
        : status === 'error' ? error : fallback !== undefined ? fallback : <Skeleton {...skeleton} />}
    </MeasuredLayout>
    {available && status === 'error' ? error : null}
    {status === 'pending' || status === 'refreshing' ? <Text accessibilityLiveRegion="polite" accessibilityState={{ busy: true }}>
      {status === 'pending' ? label : refreshLabel}</Text> : null}
  </View>;
}
