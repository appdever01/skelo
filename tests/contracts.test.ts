import { describe, expect, it } from 'vitest';
import fixtures from './fixtures/geometry.json';
import { compareLayouts, type LayoutSnapshot } from '../src/core';
describe('shared TypeScript/Dart geometry contract', () => {
  for (const fixture of fixtures) it(fixture.name, () => {
    const report = compareLayouts(fixture.expected as LayoutSnapshot, fixture.actual as LayoutSnapshot);
    expect(report.passed).toBe(fixture.passed);
    expect(report.comparable).toBe(fixture.comparable);
    expect(report.issues.map(i => i.code)).toEqual(fixture.codes);
  });
});
