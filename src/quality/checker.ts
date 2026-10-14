import { captureLayout } from '../scan';
import type { LayoutSnapshot, ScanOptions } from '../types';
import { compareLayouts, type QualityIssue, type QualityOptions, type QualityReport } from './compare';

export function auditHiddenFocus(root: HTMLElement): QualityIssue[] {
  const issues: QualityIssue[] = [];
  const view = root.ownerDocument.defaultView;
  const selector = 'a[href],button,input,select,textarea,summary,[tabindex],[contenteditable="true"]';
  for (const el of root.querySelectorAll<HTMLElement>(selector)) {
    if (el.tabIndex < 0 || el.matches(':disabled') || el.closest('[inert]')) continue;
    let hidden = false;
    for (let current: HTMLElement | null = el; current; current = current.parentElement) {
      const style = view?.getComputedStyle(current);
      if (current.hidden || style?.display === 'none' || style?.visibility === 'hidden' || style?.visibility === 'collapse') {
        hidden = false;
        break;
      }
      if (current.getAttribute('aria-hidden') === 'true' || (style?.opacity !== '' && Number(style?.opacity) === 0)) hidden = true;
    }
    if (hidden) issues.push({ code: 'HIDDEN_FOCUSABLE', severity: 'error',
      key: el.getAttribute('data-loading-key') ?? el.tagName.toLowerCase(),
      message: 'An element hidden from view or assistive technology remains in the keyboard tab order.' });
  }
  return issues;
}

export interface CheckerOptions extends QualityOptions {
  scan?: ScanOptions;
}

function issueReport(regionId: string, issues: QualityIssue[]): QualityReport {
  return { regionId, passed: false, comparable: false, issues,
    metrics: { maxDriftPx: 0, changedBones: 0, expectedBones: 0, actualBones: 0 } };
}

export function createQualityChecker(root: HTMLElement, options: CheckerOptions = {}) {
  const pending = new Map<string, LayoutSnapshot>();
  const emitted = new Map<string, string>();
  return {
    capture(): QualityReport[] {
      const regions = [...(root.matches('[data-loading-region]') ? [root] : []),
        ...root.querySelectorAll<HTMLElement>('[data-loading-region]')];
      const counts = new Map<string, number>();
      regions.forEach(region => {
        const id = region.getAttribute('data-loading-region') ?? '';
        counts.set(id, (counts.get(id) ?? 0) + 1);
      });
      const reports: QualityReport[] = [];
      const active = new Set<string>();
      for (const region of regions) {
        const id = region.getAttribute('data-loading-region') ?? '';
        active.add(id);
        let report: QualityReport | undefined;
        if ((counts.get(id) ?? 0) > 1 || !id) {
          pending.delete(id);
          report = issueReport(id, [{ code: 'DUPLICATE_REGION', severity: 'error', message: 'Every region needs a unique, non-empty ID.' }]);
        } else {
          const content = region.querySelector<HTMLElement>(':scope > [data-loading-content]');
          if (!content) continue;
          const state = region.getAttribute('data-loading-state');
          const focus = auditHiddenFocus(region);
          const scan: ScanOptions = { ...options.scan,
            ignoreSelectors: ['[data-loading-template]', '[data-skeleton-ignore]', '[data-loading-region]', ...(options.scan?.ignoreSelectors ?? [])] };
          if (state === 'pending') {
            const snapshot = captureLayout(content, scan);
            for (const skeleton of content.querySelectorAll<HTMLElement>('[data-loading-capture]')) {
              if (skeleton.closest('[data-loading-region]') !== region) continue;
              const capture = skeleton.getAttribute('data-loading-capture');
              if (capture === 'incomplete' || capture === 'unmeasured') {
                snapshot.complete = false;
                const reason = skeleton.getAttribute('data-loading-capture-reason');
                if (reason === 'max-depth' || reason === 'max-elements' || reason === 'max-time') snapshot.reason = reason;
              }
            }
            pending.set(id, snapshot);
            emitted.delete(id);
            if (focus.length) report = issueReport(id, focus);
          } else if (state === 'error') {
            if (pending.has(id)) report = issueReport(id, [{ code: 'LOAD_FAILED', severity: 'warning', message: 'Loading ended with an error; the loaded layout was not checked.' }, ...focus]);
            else if (focus.length) report = issueReport(id, focus);
            pending.delete(id);
          } else {
            const before = pending.get(id);
            if (before) {
              report = compareLayouts(before, captureLayout(content, scan), options, id);
              report.issues.push(...focus);
              if (focus.length) report.passed = false;
              pending.delete(id);
            } else if (focus.length) report = issueReport(id, focus);
          }
        }
        if (report) {
          const signature = JSON.stringify(report);
          if (emitted.get(id) !== signature) {
            reports.push(report);
            emitted.set(id, signature);
          }
        }
      }
      for (const id of pending.keys()) if (!active.has(id)) pending.delete(id);
      for (const id of emitted.keys()) if (!active.has(id)) emitted.delete(id);
      return reports;
    },
    reset() { pending.clear(); emitted.clear(); },
  };
}
