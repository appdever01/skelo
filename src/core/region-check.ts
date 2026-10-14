import type { LayoutSnapshot, Resource } from '../types';
import { compareLayouts, type QualityOptions, type QualityReport } from '../quality/compare';

export function unavailableLayout(): LayoutSnapshot {
  return { version: 1, width: 0, height: 0, bones: [], visited: 0, durationMs: 0,
    complete: false, reason: 'measurement-unavailable' };
}

export function createRegionCheck(regionId: string, options: QualityOptions = {}) {
  let before: LayoutSnapshot | undefined;
  let waiting = false;
  return {
    start() { waiting = true; before = undefined; },
    capture(status: Resource<unknown>['status'], snapshot: LayoutSnapshot): QualityReport | undefined {
      if (status === 'pending') { waiting = true; before = snapshot; return; }
      if (!waiting) return;
      waiting = false;
      const report = compareLayouts(before ?? unavailableLayout(), snapshot, options, regionId);
      before = undefined;
      if (status === 'error') {
        report.passed = false;
        report.comparable = false;
        report.issues = [{ code: 'LOAD_FAILED', severity: 'warning', message: 'Loading failed; the loaded layout was not checked.' }];
      }
      return report;
    },
  };
}
