const { spawn } = require('node:child_process');
const chokidar = require('chokidar');

const childArgs = [
  '-r',
  'ts-node/register/transpile-only',
  '-r',
  'tsconfig-paths/register',
  'src/main.ts',
];

let child = null;
let restartTimer = null;
let shuttingDown = false;

function startChild() {
  if (shuttingDown) return;
  child = spawn(process.execPath, childArgs, {
    stdio: 'inherit',
    env: process.env,
  });
  child.once('exit', (code, signal) => {
    child = null;
    if (!shuttingDown && code && signal !== 'SIGTERM') {
      console.error(`[dev-watch] Backend exited with code ${code}`);
    }
  });
}

function restartChild(changedPath) {
  clearTimeout(restartTimer);
  restartTimer = setTimeout(() => {
    console.log(`[dev-watch] Change detected: ${changedPath}`);
    if (!child) {
      startChild();
      return;
    }
    const previous = child;
    previous.once('exit', startChild);
    previous.kill('SIGTERM');
    const forceKill = setTimeout(() => previous.kill('SIGKILL'), 5_000);
    forceKill.unref();
  }, 300);
}

const watcher = chokidar.watch('src', {
  ignoreInitial: true,
  usePolling: true,
  interval: 1_000,
  awaitWriteFinish: {
    stabilityThreshold: 300,
    pollInterval: 100,
  },
});

watcher.on('all', (event, changedPath) => {
  if (
    (event === 'change' || event === 'add' || event === 'unlink') &&
    /\.(ts|graphql)$/.test(changedPath)
  ) {
    restartChild(changedPath);
  }
});

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  clearTimeout(restartTimer);
  await watcher.close();
  if (!child) process.exit(0);
  child.once('exit', () => process.exit(0));
  child.kill(signal);
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));

console.log('[dev-watch] Polling TypeScript and GraphQL files under src');
startChild();
