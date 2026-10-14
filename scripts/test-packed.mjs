import assert from 'node:assert/strict';
import { copyFile, mkdtemp, writeFile, readFile, rm, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const { version } = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const archive = fileURLToPath(new URL(`../.local/skelo-${version}.tgz`, import.meta.url));
const packageSpec = process.env.SKELO_PACKAGE_SPEC ?? `file:${archive}`;
if (!process.env.SKELO_PACKAGE_SPEC) await access(archive);
const smoke = new URL('./smoke-package.mjs', import.meta.url);
const compiler = fileURLToPath(new URL('../node_modules/typescript/bin/tsc', import.meta.url));
const scratch = await mkdtemp(join(tmpdir(), 'loading-regions-consumer-'));
try {
  await copyFile(smoke, join(scratch, 'smoke.mjs'));
  await writeFile(join(scratch, 'consumer.tsx'), `import { LoadingProvider, LoadingRegion, ready, type Resource } from 'skelo';
import { QualityBoundary } from 'skelo/quality/react';
import { compareLayouts, type LayoutSnapshot } from 'skelo/quality';
const name: Resource<string> = ready('Alex');
export const direct = <LoadingRegion resource={name}>{value => <p>{value.toUpperCase()}</p>}</LoadingRegion>;
export const shared = <LoadingProvider resources={{ name }}><LoadingRegion needs="name">{data => <p>{String(data.name)}</p>}</LoadingRegion></LoadingProvider>;
export const checked = <QualityBoundary onReport={report => console.log(report.passed)}>{direct}</QualityBoundary>;
export const check = (a: LayoutSnapshot, b: LayoutSnapshot) => compareLayouts(a, b);
`);
  await writeFile(join(scratch, 'consumer.cts'), `import { ready } from 'skelo';
import { compareLayouts } from 'skelo/quality';
export const resource = ready(0);
export const checker = compareLayouts;
`);
  await writeFile(join(scratch, 'tsconfig.json'), JSON.stringify({ compilerOptions: {
    target: 'ES2022', module: 'NodeNext', moduleResolution: 'NodeNext', jsx: 'react-jsx',
    strict: true, noEmit: true, skipLibCheck: false,
  }, include: ['consumer.tsx', 'consumer.cts'] }));
  for (const reactVersion of ['18.3.1', '19.3.0']) {
    const major = reactVersion.split('.')[0];
    await rm(join(scratch, 'node_modules'), { recursive: true, force: true });
    await rm(join(scratch, 'pnpm-lock.yaml'), { force: true });
    await writeFile(join(scratch, 'package.json'), JSON.stringify({ private: true, type: 'module',
      dependencies: { 'skelo': packageSpec, react: reactVersion, 'react-dom': reactVersion },
      devDependencies: { '@types/react': `^${major}.0.0`, '@types/react-dom': `^${major}.0.0` } }));
    execFileSync('pnpm', ['install', '--ignore-scripts', '--reporter=silent'], { cwd: scratch, stdio: 'pipe' });
    const output = execFileSync(process.execPath, [join(scratch, 'smoke.mjs')], { cwd: scratch, encoding: 'utf8' });
    assert.match(output, /passed/);
    execFileSync(process.execPath, [compiler, '--project', join(scratch, 'tsconfig.json')], { cwd: scratch, stdio: 'pipe' });
    console.log(`Packed consumer passed with React ${reactVersion}: ESM, CommonJS, SSR, types, CSS and CLI.`);
  }
} finally {
  await rm(scratch, { recursive: true, force: true });
}
