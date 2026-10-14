import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { LoadingRegion, pending, ready } from 'skelo';
import { compareLayouts } from 'skelo/quality';

const require = createRequire(import.meta.url);
for (const name of ['index', 'next', 'quality/react']) {
  const path = new URL(`./dist/${name}.js`, import.meta.resolve('skelo/package.json'));
  assert.match(await readFile(path, 'utf8'), /^"use client";/);
}
const corePath = new URL('./dist/core/index.js', import.meta.resolve('skelo/package.json'));
assert.doesNotMatch(await readFile(corePath, 'utf8'), /use client|from ["']react|document\./);
const nativePath = new URL('./dist/native/index.js', import.meta.resolve('skelo/package.json'));
assert.doesNotMatch(await readFile(nativePath, 'utf8'), /getBoundingClientRect|MutationObserver|react-dom|_reactInternals|findNodeHandle/);
assert.equal((await import('skelo/core')).ready(0).data, 0);
assert.equal(typeof require('skelo').LoadingRegion, 'function');
assert.equal(typeof require('skelo/next').LoadingRegion, 'function');
assert.equal(typeof (await import('skelo/next')).QualityBoundary, 'function');
assert.equal(typeof require('skelo/quality').captureLayout, 'function');
assert.equal(typeof require('skelo/quality/react').QualityBoundary, 'function');
assert.equal(typeof (await import('skelo/quality/react')).QualityBoundary, 'function');
const html = renderToString(createElement(LoadingRegion, { resource: pending(), template: createElement('button', null, 'Fixture') }, () => { throw new Error('Pending data rendered'); }));
assert.match(html, /inert=""/);
assert.match(html, /aria-busy="true"/);
assert.match(renderToString(createElement(LoadingRegion, { resource: ready(0) }, data => createElement('p', null, `Count: ${data}`))), /Count: 0/);
assert.match(await readFile(new URL(import.meta.resolve('skelo/styles.css')), 'utf8'), /prefers-reduced-motion/);
const layout = { version: 1, width: 100, height: 40, complete: true, visited: 1, durationMs: 0,
  bones: [{ key: 'name', x: 0, y: 0, width: 40, height: 20, radius: 4, kind: 'rect' }] };
assert.equal(compareLayouts(layout, layout).passed, true);
const scratch = await mkdtemp(join(tmpdir(), 'loading-regions-cli-'));
try {
  const before = join(scratch, 'before.json');
  const after = join(scratch, 'after.json');
  await writeFile(before, JSON.stringify(layout));
  await writeFile(after, JSON.stringify(layout));
  const cli = new URL('./dist/cli.js', import.meta.resolve('skelo/package.json'));
  const run = (...args) => spawnSync(process.execPath, [cli.pathname, ...args], { encoding: 'utf8' });
  let result = run(before, after);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).passed, true);
  await writeFile(after, JSON.stringify({ ...layout, height: 70 }));
  result = run(before, after);
  assert.equal(result.status, 1, result.stderr);
  assert.equal(JSON.parse(result.stdout).issues[0].code, 'CONTAINER_DRIFT');
  await writeFile(after, '{invalid');
  assert.equal(run(before, after).status, 2);
  assert.equal(run(before, before, '--tolerance', '-1').status, 2);
  assert.equal(run(before, before, '--unknown', '1').status, 2);
  assert.equal(run('--help').status, 0);
} finally {
  await rm(scratch, { recursive: true, force: true });
}
console.log('Package imports, React SSR, CSS export and CLI exit codes passed.');
