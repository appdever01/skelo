import assert from 'node:assert/strict';
import { mkdtemp, writeFile, copyFile, readFile, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const archive = join(root, '.local/react-loading-regions-0.2.0.tgz');
const scratch = await mkdtemp(join(tmpdir(), 'skelo-adapters-'));
const run = (command, args) => execFileSync(command, args, { cwd: scratch, stdio: 'pipe', env: { ...process.env, CI: '1' } });
try {
  const install = async dependencies => {
    await rm(join(scratch, 'node_modules'), { recursive: true, force: true });
    await rm(join(scratch, 'pnpm-lock.yaml'), { force: true });
    await writeFile(join(scratch, 'package.json'), JSON.stringify({ private: true, type: 'module', dependencies: {
      'react-loading-regions': `file:${archive}`, ...dependencies,
    } }));
    run('pnpm', ['install', '--ignore-scripts', '--reporter=silent']);
  };
  await install({ vue: '3.5.44', '@vue/server-renderer': '3.5.44' });
  await writeFile(join(scratch, 'vue.mjs'), `import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createSSRApp, h } from 'vue';
import { renderToString } from '@vue/server-renderer';
import { LoadingRegion } from 'react-loading-regions/vue';
import { pending, ready, compareLayouts } from 'react-loading-regions/core';
const require = createRequire(import.meta.url);
assert.throws(() => require.resolve('react'));
assert.equal(require('react-loading-regions/core').ready(0).data, 0);
assert.equal(typeof compareLayouts, 'function');
assert.match(await renderToString(createSSRApp({render: () => h(LoadingRegion, {resource:ready(0)}, {default: ({data}) => h('p', String(data))})})), />0</);
await renderToString(createSSRApp({render: () => h(LoadingRegion, {resource:pending()}, {default: () => { throw new Error('Pending slot rendered'); }})}));
`);
  run(process.execPath, ['vue.mjs']);
  console.log('Packed Vue SSR and core ESM/CommonJS imports passed without React installed.');
  await install({ svelte: '5.57.2', vite: '^7.3.1', '@sveltejs/vite-plugin-svelte': '^6.2.4', 'svelte-check': '^4.7.6', typescript: '^5.9.3' });
  for (const file of ['App.svelte', 'main.ts', 'index.html', 'vite.config.ts']) await copyFile(join(root, 'examples/svelte', file), join(scratch, file));
  await writeFile(join(scratch, 'tsconfig.json'), JSON.stringify({ compilerOptions: { target: 'ES2022', module: 'ESNext', moduleResolution: 'Bundler', strict: true, skipLibCheck: false, allowJs: true }, include: ['App.svelte'] }));
  run('pnpm', ['exec', 'svelte-check', '--tsconfig', 'tsconfig.json']);
  run('pnpm', ['exec', 'vite', 'build']);
  assert.match(await readFile(join(scratch, 'dist/index.html'), 'utf8'), /assets/);
  console.log('Packed Svelte consumer declarations and production build passed without React installed.');
  await install({ react: '19.2.3', 'react-native': '0.86.0', '@types/react': '^19.2.0', typescript: '^5.9.3' });
  await writeFile(join(scratch, 'native.tsx'), `import { Text } from 'react-native';
import { LoadingRegion, Geometry, ready, captureNativeLayout } from 'react-loading-regions/native';
export const region = <LoadingRegion resource={ready('Alex')} onReport={report => console.log(report.passed)}>{name => <Geometry boneKey="name"><Text>{name}</Text></Geometry>}</LoadingRegion>;
export const measure = captureNativeLayout;
`);
  await writeFile(join(scratch, 'tsconfig.native.json'), JSON.stringify({ compilerOptions: { target: 'ES2022', lib: ['ES2022'], module: 'NodeNext', moduleResolution: 'NodeNext', jsx: 'react-jsx', strict: true, skipLibCheck: false, noEmit: true, types: ['react'] }, include: ['native.tsx'] }));
  run('pnpm', ['exec', 'tsc', '-p', 'tsconfig.native.json']);
  run(process.execPath, ['--input-type=module', '-e', "import assert from 'node:assert/strict'; import {createRequire} from 'node:module'; const require=createRequire(import.meta.url); assert.throws(() => require.resolve('react-dom'));"]);
  console.log('Packed native declarations passed without React DOM installed.');

} catch (error) {
  if (error.stdout) console.error(error.stdout.toString());
  if (error.stderr) console.error(error.stderr.toString());
  throw error;
} finally {
  await rm(scratch, { recursive: true, force: true });
}
