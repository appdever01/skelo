import { readFile } from 'node:fs/promises';
import { compareLayouts, isLayoutSnapshot } from './quality/compare';

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    console.log('Usage: loading-regions-check <loading.json> <loaded.json> [--tolerance <px>]\nCompare geometry snapshots captured at the same container width. Exit: 0 pass, 1 mismatch, 2 invalid input.');
    return;
  }
  const [beforePath, afterPath, flag, value, ...extra] = args;
  if (!beforePath || !afterPath || (flag !== undefined && flag !== '--tolerance') || (flag && value === undefined) || extra.length) {
    throw new Error('Use --help for the expected arguments.');
  }
  const tolerancePx = value === undefined ? 8 : Number(value);
  if (!Number.isFinite(tolerancePx) || tolerancePx < 0 || value?.trim() === '') throw new Error('Tolerance must be a non-negative finite number.');
  const before: unknown = JSON.parse(await readFile(beforePath, 'utf8'));
  const after: unknown = JSON.parse(await readFile(afterPath, 'utf8'));
  if (!isLayoutSnapshot(before) || !isLayoutSnapshot(after)) throw new Error('Input files must contain valid version 1 layout snapshots.');
  const report = compareLayouts(before, after, { tolerancePx });
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = report.passed ? 0 : 1;
}

main().catch((error: unknown) => {
  console.error(JSON.stringify({ error: error instanceof Error ? error.message : 'Invalid input.' }));
  process.exitCode = 2;
});
