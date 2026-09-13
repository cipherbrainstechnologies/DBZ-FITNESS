import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const require = createRequire(fileURLToPath(import.meta.url));
const nextBin = require.resolve('next/dist/bin/next');
const port = process.env.PORT ?? '3000';

const child = spawn(
  process.execPath,
  [nextBin, 'start', '--hostname', '0.0.0.0', '--port', port],
  { stdio: 'inherit', env: process.env },
);

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
