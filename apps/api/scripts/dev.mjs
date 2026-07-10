import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const tscBin = require.resolve('typescript/bin/tsc');

const run = (command, args, options = {}) =>
  new Promise((resolve) => {
    const childProcess = spawn(command, args, {
      stdio: 'inherit',
      cwd: process.cwd(),
      shell: false,
      ...options
    });

    childProcess.on('exit', (code) => {
      resolve(code ?? 1);
    });
  });

const startWatchers = () => {
  const typeScriptWatcher = spawn(process.execPath, [tscBin, '-p', 'tsconfig.json', '--watch', '--preserveWatchOutput'], {
    stdio: 'inherit',
    cwd: process.cwd(),
    shell: false
  });

  const serverProcess = spawn(process.execPath, ['dist/main.js'], {
    stdio: 'inherit',
    cwd: process.cwd(),
    shell: false
  });

  const stopChildren = () => {
    typeScriptWatcher.kill();
    serverProcess.kill('SIGTERM');
  };

  process.on('SIGINT', stopChildren);
  process.on('SIGTERM', stopChildren);
};

const main = async () => {
  const initialBuildCode = await run(process.execPath, [tscBin, '-p', 'tsconfig.json']);

  if (initialBuildCode !== 0) {
    process.exit(initialBuildCode);
  }

  startWatchers();
};

void main();