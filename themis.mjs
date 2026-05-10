#!/usr/bin/env node
// Themis CLI — manages the four services (Postgres + FastAPI + Express + Vite)
// and runs common dev tasks (warm, investigate).
//
// Usage:
//   themis up [--no-agent|--no-server|--no-web|--no-postgres-check]
//             [--agent-port 8000] [--api-port 3001] [--web-port 5173]
//   themis down                  Kill any process listening on the three app ports
//   themis status                Show which app ports are currently in use
//   themis warm                  POST /api/agent/investigate for every alert
//   themis investigate <alertId> Run one investigation and print recommendation
//   themis --help | -h
//
// Foreground by default. Ctrl+C cleanly tears down everything `up` started.

import { spawn, spawnSync, execSync } from "node:child_process";
import { parseArgs } from "node:util";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import process from "node:process";

const ROOT = dirname(fileURLToPath(import.meta.url));
const IS_WIN = process.platform === "win32";

// ─────────────────────────────────────────────────────────────────────
// Tiny logger
// ─────────────────────────────────────────────────────────────────────
const COLORS = {
  pg: "\x1b[34m", agent: "\x1b[35m", api: "\x1b[36m", web: "\x1b[32m",
  sys: "\x1b[33m", err: "\x1b[31m", ok: "\x1b[32m", reset: "\x1b[0m",
};
const stamp = (tag) => `${COLORS[tag] || ""}[${tag.padEnd(5)}]${COLORS.reset}`;
const log = (tag, msg) =>
  process.stdout.write(`${stamp(tag)} ${msg}${msg.endsWith("\n") ? "" : "\n"}`);

// ─────────────────────────────────────────────────────────────────────
// Argv parsing — split command from options
// ─────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
let command = argv[0] && !argv[0].startsWith("-") ? argv[0] : null;
const rest = command ? argv.slice(1) : argv;

const HELP = `Themis CLI

Usage: themis <command> [options]

Commands:
  up                          Bring up Postgres + FastAPI + Express + Vite (foreground)
  down                        Stop processes on app ports (3001, 5173, optionally 8000)
  status                      Show port occupancy for app services
  warm                        Pre-run investigations for every alert in the DB
  investigate <alertId>       Run one investigation, print result
  -h, --help                  Show this help

Options for \`up\`:
  --no-agent                  Skip FastAPI (port 8000)
  --no-server                 Skip Express   (port 3001)
  --no-web                    Skip Vite      (port 5173)
  --no-postgres-check         Don't probe / start Docker Postgres
  --agent-port <p>            Default 8000
  --api-port <p>              Default 3001
  --web-port <p>              Default 5173
  --postgres-port <p>         Default 5433
  --python <bin>              Default 'python' on Windows, 'python3' elsewhere

Common flow:
  themis up                   # start everything, leaves it running
  themis warm                 # in another terminal: populate investigations
  themis investigate ALERT-0109
`;

if (!command || command === "--help" || command === "-h" || rest.includes("-h") || rest.includes("--help")) {
  process.stdout.write(HELP);
  process.exit(command ? 0 : 1);
}

const PORTS = {
  postgres: process.env.POSTGRES_PORT || "5433",
  agent: "8000",
  api: "3001",
  web: "5173",
};

// Parse `up` flags
function parseUpOptions() {
  const { values } = parseArgs({
    args: rest,
    options: {
      "no-agent":          { type: "boolean", default: false },
      "no-server":         { type: "boolean", default: false },
      "no-web":            { type: "boolean", default: false },
      "no-postgres-check": { type: "boolean", default: false },
      "agent-port":        { type: "string",  default: PORTS.agent },
      "api-port":          { type: "string",  default: PORTS.api },
      "web-port":          { type: "string",  default: PORTS.web },
      "postgres-port":     { type: "string",  default: PORTS.postgres },
      "python":            { type: "string",  default: process.env.PYTHON || (IS_WIN ? "python" : "python3") },
    },
    allowPositionals: false,
  });
  return values;
}

// ─────────────────────────────────────────────────────────────────────
// Port + process helpers (Windows + POSIX)
// ─────────────────────────────────────────────────────────────────────
function pidsListeningOn(port) {
  try {
    if (IS_WIN) {
      const out = execSync(`netstat -ano -p tcp`, { stdio: ["ignore", "pipe", "ignore"] }).toString();
      const pids = new Set();
      for (const line of out.split("\n")) {
        if (!line.includes("LISTENING")) continue;
        if (!line.includes(`:${port} `) && !line.endsWith(`:${port}`)) continue;
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && /^\d+$/.test(pid)) pids.add(pid);
      }
      return [...pids];
    } else {
      const out = execSync(`lsof -ti :${port} -s TCP:LISTEN`, { stdio: ["ignore", "pipe", "ignore"] }).toString();
      return out.split("\n").filter(Boolean);
    }
  } catch {
    return [];
  }
}

function killPid(pid) {
  try {
    if (IS_WIN) execSync(`taskkill /F /PID ${pid} /T`, { stdio: "ignore" });
    else process.kill(parseInt(pid, 10), "SIGTERM");
    return true;
  } catch {
    return false;
  }
}

async function waitForPort(host, port, ms = 30000, label = "service") {
  const start = Date.now();
  while (Date.now() - start < ms) {
    try {
      const r = await fetch(`http://${host}:${port}/`, { method: "GET" });
      // Any HTTP response (even 404) means the port is up.
      void r;
      return true;
    } catch {
      // not ready yet
    }
    await sleep(300);
  }
  log("err", `${label} did not come up on port ${port} within ${ms}ms`);
  return false;
}

async function waitForFastApiHealth(port, ms = 60000) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    try {
      const r = await fetch(`http://127.0.0.1:${port}/health`);
      if (r.ok) return true;
    } catch {}
    await sleep(400);
  }
  return false;
}

// ─────────────────────────────────────────────────────────────────────
// Postgres (Docker) helpers
// ─────────────────────────────────────────────────────────────────────
function dockerAvailable() {
  return spawnSync("docker", ["info"], { stdio: "ignore" }).status === 0;
}

function postgresContainerStatus() {
  const out = spawnSync(
    "docker",
    ["inspect", "--format={{.State.Status}}", "local-postgres"],
    { encoding: "utf8" }
  );
  if (out.status !== 0) return "missing";
  return (out.stdout || "").trim() || "unknown";
}

function ensurePostgres(port) {
  if (!dockerAvailable()) {
    log("err", "docker not available — start Postgres manually or pass --no-postgres-check");
    return false;
  }
  const status = postgresContainerStatus();
  if (status === "missing") {
    log("pg", "container 'local-postgres' missing — creating");
    const r = spawnSync(
      "docker",
      [
        "run", "-d", "--name", "local-postgres",
        "-e", "POSTGRES_PASSWORD=mysecretpassword",
        "-e", "POSTGRES_DB=themis_app",
        "-p", `${port}:5432`,
        "-v", "themis_pgdata:/var/lib/postgresql",
        "postgres",
      ],
      { stdio: "inherit" }
    );
    if (r.status !== 0) {
      log("err", "failed to create local-postgres container");
      return false;
    }
  } else if (status === "exited" || status === "created" || status === "stopped") {
    log("pg", `container 'local-postgres' is ${status} — starting`);
    spawnSync("docker", ["start", "local-postgres"], { stdio: "ignore" });
  } else if (status === "running") {
    log("pg", "container 'local-postgres' already running");
  } else {
    log("pg", `container in unexpected state: ${status}`);
  }
  return true;
}

// ─────────────────────────────────────────────────────────────────────
// `up` — boot all services
// ─────────────────────────────────────────────────────────────────────
async function cmdUp() {
  const opts = parseUpOptions();
  const services = [];
  let shuttingDown = false;

  function start(tag, cmd, args, env = {}) {
    log("sys", `starting ${tag}: ${cmd} ${args.join(" ")}`);
    const child = spawn(cmd, args, {
      cwd: ROOT,
      shell: IS_WIN,
      env: { ...process.env, ...env, FORCE_COLOR: "1" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    const pipe = (stream) => {
      let buf = "";
      stream.on("data", (chunk) => {
        buf += chunk.toString();
        let i;
        while ((i = buf.indexOf("\n")) !== -1) {
          log(tag, buf.slice(0, i));
          buf = buf.slice(i + 1);
        }
      });
      stream.on("end", () => { if (buf) log(tag, buf); });
    };
    pipe(child.stdout);
    pipe(child.stderr);
    child.on("exit", (code, signal) => {
      log("sys", `${tag} exited (code=${code}, signal=${signal})`);
      if (!shuttingDown) shutdown(code ?? 1);
    });
    services.push({ tag, child });
    return child;
  }

  function shutdown(code = 0) {
    if (shuttingDown) return;
    shuttingDown = true;
    log("sys", "shutting down...");
    for (const { tag, child } of services) {
      if (child.exitCode !== null) continue;
      try {
        if (IS_WIN) spawn("taskkill", ["/pid", child.pid, "/T", "/F"]);
        else child.kill("SIGTERM");
        log("sys", `stopped ${tag}`);
      } catch (e) {
        log("err", `failed to stop ${tag}: ${e.message}`);
      }
    }
    setTimeout(() => process.exit(code), 800).unref();
  }

  process.on("SIGINT", () => shutdown(0));
  process.on("SIGTERM", () => shutdown(0));

  // 1. Postgres
  if (!opts["no-postgres-check"]) {
    if (!ensurePostgres(opts["postgres-port"])) {
      log("err", "Postgres check failed; aborting. Use --no-postgres-check to skip.");
      process.exit(1);
    }
  }

  // 2. FastAPI agent
  if (!opts["no-agent"]) {
    if (!existsSync(resolve(ROOT, "agent/api.py"))) {
      log("err", "agent/api.py not found");
      process.exit(1);
    }
    start("agent", opts.python, [
      "-m", "uvicorn", "api:app",
      "--host", "127.0.0.1",
      "--port", opts["agent-port"],
      "--log-level", "warning",
      "--app-dir", "agent",
    ], {
      // PYTHONUTF8 is the fix for the Windows cp1252 emoji crash on startup
      PYTHONUTF8: "1",
      PYTHONIOENCODING: "utf-8",
      PYTHONUNBUFFERED: "1",
    });

    log("sys", "waiting for agent /health...");
    const ok = await waitForFastApiHealth(opts["agent-port"], 60000);
    if (!ok) {
      log("err", "agent did not become healthy");
      shutdown(1);
      return;
    }
    log("ok", `agent ready on :${opts["agent-port"]}`);
  }

  // 3. Express BFF
  if (!opts["no-server"]) {
    start("api", IS_WIN ? "node.exe" : "node", ["server.js"], {
      PORT: opts["api-port"],
      AGENT_API_URL: `http://localhost:${opts["agent-port"]}`,
    });
    await waitForPort("127.0.0.1", opts["api-port"], 15000, "express");
    log("ok", `express ready on :${opts["api-port"]}`);
  }

  // 4. Vite frontend
  if (!opts["no-web"]) {
    const npx = IS_WIN ? "npx.cmd" : "npx";
    start("web", npx, ["vite", "frontend", "--port", opts["web-port"], "--strictPort"]);
  }

  if (services.length === 0) {
    log("sys", "no services started (all flags disabled)");
    process.exit(0);
  }

  log("sys", `booted ${services.length} service(s) — Ctrl+C to stop`);
  log("sys", `frontend:  http://localhost:${opts["web-port"]}`);
  log("sys", `express:   http://localhost:${opts["api-port"]}`);
  log("sys", `agent:     http://localhost:${opts["agent-port"]}`);
  log("sys", `postgres:  localhost:${opts["postgres-port"]}`);
}

// ─────────────────────────────────────────────────────────────────────
// `down` — kill anything on the app ports
// ─────────────────────────────────────────────────────────────────────
function cmdDown() {
  const ports = [PORTS.api, PORTS.web, PORTS.agent];
  let killed = 0;
  for (const port of ports) {
    const pids = pidsListeningOn(port);
    if (pids.length === 0) {
      log("sys", `port ${port}: nothing listening`);
      continue;
    }
    for (const pid of pids) {
      const ok = killPid(pid);
      log(ok ? "ok" : "err", `port ${port}: pid ${pid} ${ok ? "stopped" : "kill failed"}`);
      if (ok) killed++;
    }
  }
  log("sys", `down complete (${killed} process(es) stopped). Postgres container left running.`);
}

// ─────────────────────────────────────────────────────────────────────
// `status` — port occupancy
// ─────────────────────────────────────────────────────────────────────
function cmdStatus() {
  const rows = [
    ["agent (FastAPI)",   PORTS.agent],
    ["api (Express)",     PORTS.api],
    ["web (Vite)",        PORTS.web],
    ["postgres (Docker)", PORTS.postgres],
  ];
  for (const [label, port] of rows) {
    const pids = pidsListeningOn(port);
    const tag = pids.length ? "ok" : "sys";
    const state = pids.length ? `up (pid ${pids.join(", ")})` : "not listening";
    log(tag, `${label.padEnd(20)} :${port}  ${state}`);
  }
  if (dockerAvailable()) {
    const pgState = postgresContainerStatus();
    log(pgState === "running" ? "ok" : "sys", `local-postgres container: ${pgState}`);
  }
}

// ─────────────────────────────────────────────────────────────────────
// `warm` — investigate every alert that doesn't have a recent run
// ─────────────────────────────────────────────────────────────────────
async function callExpress(path, init = {}) {
  const url = `http://localhost:${PORTS.api}${path}`;
  const r = await fetch(url, init);
  if (!r.ok) throw new Error(`${r.status} ${r.statusText} for ${path}`);
  return r.json();
}

async function cmdWarm() {
  log("sys", "warm: fetching alerts...");
  let alerts;
  try {
    alerts = await callExpress("/api/alerts");
  } catch (e) {
    log("err", `cannot reach Express on :${PORTS.api} — is \`themis up\` running? (${e.message})`);
    process.exit(1);
  }
  log("sys", `warm: ${alerts.length} alert(s) total`);

  for (const a of alerts) {
    let runs = [];
    try {
      runs = await callExpress(`/api/investigations/alert/${a.id}`);
    } catch {}
    if (runs.length > 0) {
      log("ok", `${a.id}: already has ${runs.length} run(s) — skipping`);
      continue;
    }
    log("sys", `${a.id}: investigating...`);
    const t0 = Date.now();
    try {
      const result = await callExpress("/api/agent/investigate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alert_id: a.id }),
      });
      const ms = Date.now() - t0;
      log("ok", `${a.id}: ${result.recommendation} (conf ${result.confidence}%) in ${ms}ms`);
    } catch (e) {
      log("err", `${a.id}: ${e.message}`);
    }
  }
  log("ok", "warm complete");
}

// ─────────────────────────────────────────────────────────────────────
// `investigate <alertId>` — run one
// ─────────────────────────────────────────────────────────────────────
async function cmdInvestigate() {
  const alertId = rest[0];
  if (!alertId) {
    log("err", "missing alert id. Usage: themis investigate <alertId>");
    process.exit(1);
  }
  log("sys", `investigating ${alertId}...`);
  try {
    const result = await callExpress("/api/agent/investigate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alert_id: alertId }),
    });
    log("ok", `recommendation: ${result.recommendation} (conf ${result.confidence}%)`);
    log("sys", `investigation_id: ${result.investigation_id}`);
    log("sys", `journal steps: ${(result.journal || []).length}`);
    if (result.errors && result.errors.length) log("err", `errors: ${result.errors.join("; ")}`);
  } catch (e) {
    log("err", `investigate failed: ${e.message}`);
    process.exit(1);
  }
}

// ─────────────────────────────────────────────────────────────────────
// Dispatch
// ─────────────────────────────────────────────────────────────────────
const dispatch = {
  up: cmdUp,
  down: cmdDown,
  status: cmdStatus,
  warm: cmdWarm,
  investigate: cmdInvestigate,
};

const fn = dispatch[command];
if (!fn) {
  log("err", `unknown command: ${command}`);
  process.stdout.write(HELP);
  process.exit(1);
}
await fn();
