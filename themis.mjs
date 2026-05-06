#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { parseArgs } from 'node:util';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import process from 'node:process';

const ROOT = dirname(fileURLToPath(import.meta.url));
const IS_WIN = process.platform === 'win32';

const { values: opts } = parseArgs({
  options: {
    'no-agent':   { type: 'boolean', default: false },
    'no-server':  { type: 'boolean', default: false },
    'no-web':     { type: 'boolean', default: false },
    'agent-port': { type: 'string',  default: '8000' },
    'api-port':   { type: 'string',  default: '3001' },
    'web-port':   { type: 'string',  default: '5173' },
    'python':     { type: 'string',  default: process.env.PYTHON || (IS_WIN ? 'python' : 'python3') },
    help:         { type: 'boolean', short: 'h', default: false },
  },
  allowPositionals: false,
});

if (opts.help) {
  console.log(`Themis launcher

Usage: node themis.mjs [options]

Options:
  --no-agent          Skip Python agent (FastAPI on :8000)
  --no-server         Skip Express server (Node on :3001)
  --no-web            Skip Vite dev server (frontend on :5173)
  --agent-port <p>    Override agent port (default 8000)
  --api-port <p>      Override Express port (default 3001)
  --web-port <p>      Override Vite port (default 5173)
  --python <bin>      Python binary (default: python on Win, python3 elsewhere)
  -h, --help          Show this help
`);
  process.exit(0);
}

const COLORS = { agent: '\x1b[35m', api: '\x1b[36m', web: '\x1b[32m', sys: '\x1b[33m', reset: '\x1b[0m' };
const stamp = (tag) => `${COLORS[tag] || ''}[${tag.padEnd(5)}]${COLORS.reset}`;
const log = (tag, msg) => process.stdout.write(`${stamp(tag)} ${msg}${msg.endsWith('\n') ? '' : '\n'}`);

const services = [];

function start(tag, cmd, args, env = {}) {
  log('sys', `starting ${tag}: ${cmd} ${args.join(' ')}`);
  const child = spawn(cmd, args, {
    cwd: ROOT,
    shell: IS_WIN,
    env: { ...process.env, ...env, FORCE_COLOR: '1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const pipe = (stream) => {
    let buf = '';
    stream.on('data', (chunk) => {
      buf += chunk.toString();
      let i;
      while ((i = buf.indexOf('\n')) !== -1) {
        log(tag, buf.slice(0, i));
        buf = buf.slice(i + 1);
      }
    });
    stream.on('end', () => { if (buf) log(tag, buf); });
  };
  pipe(child.stdout);
  pipe(child.stderr);
  child.on('exit', (code, signal) => {
    log('sys', `${tag} exited (code=${code}, signal=${signal})`);
    if (!shuttingDown) shutdown(code ?? 1);
  });
  services.push({ tag, child });
}

if (!opts['no-agent']) {
  if (!existsSync(resolve(ROOT, 'agent/api.py'))) {
    log('sys', 'agent/api.py not found — skipping agent');
  } else {
    start('agent', opts.python, ['agent/api.py'], {
      PYTHONIOENCODING: 'utf-8',
      PYTHONUNBUFFERED: '1',
      AGENT_PORT: opts['agent-port'],
    });
  }
}

if (!opts['no-server']) {
  start('api', IS_WIN ? 'node.exe' : 'node', ['server.js'], {
    PORT: opts['api-port'],
    AGENT_API_URL: `http://localhost:${opts['agent-port']}`,
  });
}

if (!opts['no-web']) {
  const npx = IS_WIN ? 'npx.cmd' : 'npx';
  start('web', npx, ['vite', '--port', opts['web-port'], '--strictPort']);
}

if (services.length === 0) {
  log('sys', 'nothing to run (all services disabled)');
  process.exit(0);
}

log('sys', `booted ${services.length} service(s) — Ctrl+C to stop`);
log('sys', `frontend:  http://localhost:${opts['web-port']}`);
log('sys', `express:   http://localhost:${opts['api-port']}`);
log('sys', `agent:     http://localhost:${opts['agent-port']}`);

let shuttingDown = false;
function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  log('sys', 'shutting down...');
  for (const { tag, child } of services) {
    if (child.exitCode !== null) continue;
    try {
      if (IS_WIN) spawn('taskkill', ['/pid', child.pid, '/T', '/F']);
      else child.kill('SIGTERM');
      log('sys', `stopped ${tag}`);
    } catch (e) {
      log('sys', `failed to stop ${tag}: ${e.message}`);
    }
  }
  setTimeout(() => process.exit(code), 800).unref();
}

process.on('SIGINT',  () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
