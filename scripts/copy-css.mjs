import { copyFile, chmod } from 'node:fs/promises';

await copyFile(new URL('../src/styles.css', import.meta.url), new URL('../dist/styles.css', import.meta.url));
await chmod(new URL('../dist/cli.js', import.meta.url), 0o755);
