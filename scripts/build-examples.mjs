import { execFileSync } from 'node:child_process';
for (const name of ['next', 'vue', 'svelte']) {
  execFileSync('pnpm', ['--dir', `examples/${name}`, 'build'], { stdio: 'inherit' });
}
execFileSync('pnpm', ['--dir', 'examples/expo', 'export'], { stdio: 'inherit', env: { ...process.env, CI: '1' } });
