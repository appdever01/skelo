export type Resource<T> =
  | { status: 'pending'; data?: never; error?: never }
  | { status: 'ready' | 'refreshing'; data: T; error?: never }
  | { status: 'error'; error: unknown; data?: T };

export type ResourceMap = Readonly<Record<string, Resource<unknown>>>;

export interface Bone {
  key: string;
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
  kind: 'rect' | 'circle';
}

export interface LayoutSnapshot {
  version: 1;
  width: number;
  height: number;
  bones: Bone[];
  visited: number;
  durationMs: number;
  complete: boolean;
  reason?: 'max-depth' | 'max-elements' | 'max-time';
}

export interface ScanOptions {
  maxDepth?: number;
  maxElements?: number;
  maxScanMs?: number;
  minSize?: number;
  ignoreSelectors?: readonly string[];
}

export type Animation = 'pulse' | 'shimmer' | 'none';
