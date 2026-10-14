import type { Bone, LayoutSnapshot } from '../types';

export type IssueCode = 'INVALID_SNAPSHOT' | 'INCOMPLETE_CAPTURE' | 'NO_GEOMETRY' | 'WIDTH_CHANGED' |
  'CONTAINER_DRIFT' | 'DUPLICATE_KEY' | 'MISSING_BONE' | 'UNEXPECTED_BONE' | 'BONE_DRIFT' |
  'OVERFLOW' | 'HIDDEN_FOCUSABLE' | 'DUPLICATE_REGION' | 'LOAD_FAILED';

export interface QualityIssue {
  code: IssueCode;
  severity: 'error' | 'warning';
  message: string;
  key?: string;
  deltaPx?: number;
}

export interface QualityReport {
  regionId: string;
  passed: boolean;
  comparable: boolean;
  issues: QualityIssue[];
  metrics: { maxDriftPx: number; changedBones: number; expectedBones: number; actualBones: number };
}

export interface QualityOptions {
  tolerancePx?: number;
  heightTolerancePx?: number;
  widthTolerancePx?: number;
  overflowTolerancePx?: number;
  checkUnexpected?: boolean;
}

export function isLayoutSnapshot(input: unknown): input is LayoutSnapshot {
  if (!input || typeof input !== 'object') return false;
  const s = input as Partial<LayoutSnapshot>;
  const finite = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);
  if (s.version !== 1 || !finite(s.width) || s.width < 0 || !finite(s.height) || s.height < 0 ||
      typeof s.complete !== 'boolean' || !finite(s.visited) || s.visited < 0 ||
      !finite(s.durationMs) || s.durationMs < 0 || !Array.isArray(s.bones)) return false;
  if (s.reason !== undefined && !['max-depth', 'max-elements', 'max-time', 'measurement-unavailable'].includes(s.reason)) return false;
  if (s.complete && s.reason !== undefined) return false;
  return s.bones.every((bone: Bone) => bone && typeof bone.key === 'string' && bone.key.length > 0 &&
    finite(bone.x) && finite(bone.y) && finite(bone.width) && bone.width > 0 &&
    finite(bone.height) && bone.height > 0 && finite(bone.radius) && bone.radius >= 0 &&
    (bone.kind === 'rect' || bone.kind === 'circle'));
}

function tolerance(value: number | undefined, fallback: number, name: string): number {
  const n = value ?? fallback;
  if (!Number.isFinite(n) || n < 0) throw new Error(`${name} must be a finite non-negative number.`);
  return n;
}

export function compareLayouts(expected: LayoutSnapshot, actual: LayoutSnapshot, options: QualityOptions = {}, regionId = 'region'): QualityReport {
  const issues: QualityIssue[] = [];
  const report: QualityReport = { regionId, passed: false, comparable: false, issues,
    metrics: { maxDriftPx: 0, changedBones: 0, expectedBones: 0, actualBones: 0 } };
  const allowed = tolerance(options.tolerancePx, 8, 'tolerancePx');
  const heightAllowed = tolerance(options.heightTolerancePx, 8, 'heightTolerancePx');
  const widthAllowed = tolerance(options.widthTolerancePx, 2, 'widthTolerancePx');
  const overflowAllowed = tolerance(options.overflowTolerancePx, 2, 'overflowTolerancePx');
  if (!isLayoutSnapshot(expected) || !isLayoutSnapshot(actual)) {
    issues.push({ code: 'INVALID_SNAPSHOT', severity: 'error', message: 'A snapshot contains invalid geometry or metadata.' });
    return report;
  }
  report.metrics.expectedBones = expected.bones.length;
  report.metrics.actualBones = actual.bones.length;
  if (!expected.complete || !actual.complete) {
    issues.push({ code: 'INCOMPLETE_CAPTURE', severity: 'error', message: 'Capture was incomplete or measurement was unavailable. Capture the full layout before comparing.' });
  }
  if (!expected.bones.length || !actual.bones.length || expected.width <= 0 || actual.width <= 0 || expected.height <= 0 || actual.height <= 0) {
    issues.push({ code: 'NO_GEOMETRY', severity: 'error', message: 'Both states need visible, non-zero geometry. Unavailable layout cannot prove a match.' });
  }
  if (Math.abs(expected.width - actual.width) > widthAllowed) {
    issues.push({ code: 'WIDTH_CHANGED', severity: 'error', message: 'Container width changed between states. Re-capture both at the same width.', deltaPx: Math.abs(expected.width - actual.width) });
  }
  for (const [phase, snapshot] of [['loading', expected], ['loaded', actual]] as const) {
    const seen = new Set<string>();
    for (const bone of snapshot.bones) {
      if (seen.has(bone.key)) issues.push({ code: 'DUPLICATE_KEY', severity: 'error', key: bone.key, message: `Duplicate geometry key in the ${phase} state.` });
      seen.add(bone.key);
      if (bone.x < -overflowAllowed || bone.y < -overflowAllowed || bone.x + bone.width > snapshot.width + overflowAllowed || bone.y + bone.height > snapshot.height + overflowAllowed) {
        issues.push({ code: 'OVERFLOW', severity: 'error', key: bone.key, message: `A ${phase} element extends beyond the region.` });
      }
    }
  }
  report.comparable = !issues.some(i => ['INCOMPLETE_CAPTURE', 'NO_GEOMETRY', 'WIDTH_CHANGED', 'DUPLICATE_KEY'].includes(i.code));
  if (!report.comparable) return report;
  const heightDelta = Math.abs(expected.height - actual.height);
  if (heightDelta > heightAllowed) issues.push({ code: 'CONTAINER_DRIFT', severity: 'error', message: 'The region height changes when content arrives.', deltaPx: heightDelta });
  const actualByKey = new Map(actual.bones.map(b => [b.key, b]));
  const expectedKeys = new Set(expected.bones.map(b => b.key));
  for (const bone of expected.bones) {
    const next = actualByKey.get(bone.key);
    if (!next) {
      issues.push({ code: 'MISSING_BONE', severity: 'error', key: bone.key, message: 'A placeholder has no matching loaded element.' });
      continue;
    }
    const delta = Math.max(Math.abs(bone.x - next.x), Math.abs(bone.y - next.y),
      Math.abs(bone.width - next.width), Math.abs(bone.height - next.height), Math.abs(bone.radius - next.radius));
    report.metrics.maxDriftPx = Math.max(report.metrics.maxDriftPx, delta);
    if (delta > allowed || bone.kind !== next.kind) {
      report.metrics.changedBones++;
      issues.push({ code: 'BONE_DRIFT', severity: 'error', key: bone.key, message: 'A placeholder differs from the loaded element.', deltaPx: delta });
    }
  }
  if (options.checkUnexpected !== false) {
    for (const bone of actual.bones) if (!expectedKeys.has(bone.key)) issues.push({ code: 'UNEXPECTED_BONE', severity: 'error', key: bone.key, message: 'Loaded content has no matching placeholder.' });
  }
  report.passed = issues.every(i => i.severity !== 'error');
  return report;
}
