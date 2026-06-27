#!/usr/bin/env node
/**
 * Single-command dev launcher for AlegoMind.
 *
 * Starts the Postgres container, waits for it to be healthy, applies any
 * pending Prisma migrations, then runs the NestJS API and Next.js web app
 * side by side with prefixed, color-coded, timestamped logs so it's obvious
 * which process produced which line. Works the same on macOS and Windows.
 *
 * Usage:
 *   node scripts/dev.js
 *   yarn dev
 */

const { spawn, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');

const ROOT = path.resolve(__dirname, '..');
const IS_WINDOWS = process.platform === 'win32';
const DB_CONTAINER = 'alegomind_db';
const DB_HEALTH_TIMEOUT_MS = 60_000;

// On Windows, commands like `yarn` resolve to a .cmd shim, which only works
// via a shell. Passing shell:true together with an args array triggers
// Node's DEP0190 warning, so instead we join into a single command string
// (safe here — every part is a fixed literal, never user input).
function runSync(parts, opts = {}) {
  if (IS_WINDOWS) return spawnSync(parts.join(' '), { shell: true, encoding: 'utf8', ...opts });
  return spawnSync(parts[0], parts.slice(1), { encoding: 'utf8', ...opts });
}

function runAsync(parts, opts = {}) {
  if (IS_WINDOWS) return spawn(parts.join(' '), { shell: true, ...opts });
  return spawn(parts[0], parts.slice(1), opts);
}

const COLORS = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  gray: '\x1b[90m',
};

const SERVICES = {
  DB: COLORS.gray,
  API: COLORS.cyan,
  WEB: COLORS.magenta,
  DEV: COLORS.yellow,
};

function timestamp() {
  return new Date().toTimeString().slice(0, 8);
}

function log(service, line, isError = false) {
  const color = isError ? COLORS.red : SERVICES[service] || COLORS.reset;
  process.stdout.write(
    `${COLORS.dim}${timestamp()}${COLORS.reset} ${color}[${service}]${COLORS.reset} ${line}\n`,
  );
}

function fail(service, message) {
  log(service, `${COLORS.red}FATAL: ${message}${COLORS.reset}`, true);
  shutdown(1);
}

// ─── Preflight checks ───────────────────────────────────────────────────────

function checkCommand(cmd, args, friendlyName) {
  const result = runSync([cmd, ...args]);
  if (result.error || result.status !== 0) {
    fail(
      'DEV',
      `${friendlyName} is not available on PATH (tried "${cmd} ${args.join(' ')}"). ` +
        `Install/start it and try again. See SETUP.md.`,
    );
  }
  return result.stdout.trim();
}

function ensureEnvFile(envPath, examplePath, label) {
  if (fs.existsSync(envPath)) return;
  if (!fs.existsSync(examplePath)) {
    fail('DEV', `Missing ${label} and no example file to copy from (${examplePath}).`);
  }
  fs.copyFileSync(examplePath, envPath);
  log('DEV', `${COLORS.yellow}Created ${label} from example. Review its values before relying on real integrations (Stripe, SMTP, etc.).${COLORS.reset}`);
}

function preflight() {
  log('DEV', 'Running preflight checks...');
  const dockerVersion = checkCommand('docker', ['--version'], 'Docker');
  log('DEV', `Found ${dockerVersion}`);

  const composeCheck = runSync(['docker', 'compose', 'version']);
  if (composeCheck.error || composeCheck.status !== 0) {
    fail('DEV', 'Docker Compose v2 plugin not found ("docker compose version" failed). Update Docker Desktop.');
  }

  const dockerInfo = runSync(['docker', 'info']);
  if (dockerInfo.error || dockerInfo.status !== 0) {
    fail('DEV', 'Docker daemon is not running. Start Docker Desktop and try again.');
  }

  checkCommand('node', ['--version'], 'Node.js');
  checkCommand('yarn', ['--version'], 'Yarn (run "corepack enable" if this fails)');

  ensureEnvFile(
    path.join(ROOT, 'apps', 'api', '.env'),
    path.join(ROOT, 'apps', 'api', '.env.example'),
    'apps/api/.env',
  );
  ensureEnvFile(
    path.join(ROOT, 'apps', 'web', '.env.local'),
    path.join(ROOT, 'apps', 'web', '.env.local.example'),
    'apps/web/.env.local',
  );

  log('DEV', `${COLORS.green}Preflight OK.${COLORS.reset}`);
}

// ─── Postgres ────────────────────────────────────────────────────────────────

function startDatabase() {
  log('DB', 'Starting Postgres container (docker compose up -d postgres)...');
  const up = runSync(['docker', 'compose', 'up', '-d', 'postgres'], { cwd: ROOT });
  if (up.status !== 0) {
    log('DB', up.stderr || up.stdout, true);
    fail('DB', 'Failed to start the Postgres container. Is port 5432 already in use by another Postgres instance?');
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForDatabaseHealthy() {
  log('DB', 'Waiting for Postgres healthcheck...');
  const start = Date.now();
  while (Date.now() - start < DB_HEALTH_TIMEOUT_MS) {
    const inspect = runSync(['docker', 'inspect', '--format', '{{.State.Health.Status}}', DB_CONTAINER]);
    const status = inspect.stdout.trim();
    if (status === 'healthy') {
      log('DB', `${COLORS.green}Postgres is healthy.${COLORS.reset}`);
      return;
    }
    if (status === 'unhealthy') {
      const logs = runSync(['docker', 'logs', '--tail', '30', DB_CONTAINER]);
      log('DB', logs.stdout + logs.stderr, true);
      fail('DB', 'Postgres container reported unhealthy. See container logs above.');
    }
    await sleep(500);
  }
  fail('DB', `Postgres did not become healthy within ${DB_HEALTH_TIMEOUT_MS / 1000}s.`);
}

function applyMigrations() {
  log('API', 'Applying pending Prisma migrations (prisma migrate deploy)...');
  const migrate = runSync(['yarn', 'workspace', '@alegomind/api', 'prisma:migrate:deploy'], { cwd: ROOT });
  process.stdout.write(migrate.stdout || '');
  if (migrate.status !== 0) {
    log('API', migrate.stderr || '', true);
    fail(
      'API',
      'Prisma migrate deploy failed. Check DATABASE_URL in apps/api/.env and that it points at ' +
        'localhost:5432 (not a container hostname) when the API runs on the host.',
    );
  }
}

// ─── Child processes (API + WEB) ────────────────────────────────────────────

const children = [];
let shuttingDown = false;
const recentLogs = { API: [], WEB: [] };

function remember(service, line) {
  const buf = recentLogs[service];
  if (!buf) return;
  buf.push(line);
  if (buf.length > 25) buf.shift();
}

function pipeOutput(service, stream, isError) {
  const rl = readline.createInterface({ input: stream });
  rl.on('line', (line) => {
    remember(service, line);
    log(service, line, isError);
  });
}

function spawnService(service, command, args, extraEnv = {}) {
  log(service, `Starting: ${command} ${args.join(' ')}`);
  const child = runAsync([command, ...args], {
    cwd: ROOT,
    env: { ...process.env, ...extraEnv },
  });
  child.service = service;
  pipeOutput(service, child.stdout, false);
  pipeOutput(service, child.stderr, true);

  child.on('exit', (code, signal) => {
    if (shuttingDown) return;
    log(
      service,
      `${COLORS.red}Process exited unexpectedly (code=${code}, signal=${signal}).${COLORS.reset}`,
      true,
    );
    log(service, `${COLORS.yellow}--- last ${recentLogs[service].length} lines from ${service} ---${COLORS.reset}`);
    recentLogs[service].forEach((l) => log(service, l, true));
    log(
      'DEV',
      hintFor(service),
    );
    shutdown(1);
  });

  children.push(child);
  return child;
}

function hintFor(service) {
  if (service === 'API') {
    return (
      `${COLORS.yellow}API crash checklist: (1) Is Postgres healthy? "docker compose ps". ` +
      `(2) Does apps/api/.env have a valid DATABASE_URL? (3) Did "prisma generate" run after install? ` +
      `(4) Is port 3000 already in use?${COLORS.reset}`
    );
  }
  if (service === 'WEB') {
    return (
      `${COLORS.yellow}Web crash checklist: (1) Is port 3001 already in use? ` +
      `(2) Does apps/web/.env.local have NEXT_PUBLIC_API_URL set correctly? ` +
      `(3) Did the API fail to start (check [API] logs above)?${COLORS.reset}`
    );
  }
  return '';
}

function startApi() {
  return spawnService('API', 'yarn', ['workspace', '@alegomind/api', 'start:dev']);
}

function startWeb() {
  return spawnService('WEB', 'yarn', ['workspace', '@alegomind/web', 'dev']);
}

// ─── Shutdown ────────────────────────────────────────────────────────────────

function killChild(child) {
  if (!child || child.killed || child.exitCode !== null) return;
  if (IS_WINDOWS) {
    // shell:true on Windows spawns cmd.exe -> yarn.cmd -> node; a plain
    // child.kill() only kills cmd.exe and leaves the real process running.
    // taskkill /T walks the whole process tree.
    runSync(['taskkill', '/pid', String(child.pid), '/T', '/F']);
  } else {
    child.kill('SIGINT');
  }
}

function shutdown(exitCode) {
  if (shuttingDown) return;
  shuttingDown = true;
  log('DEV', 'Shutting down API and web processes...');
  children.forEach(killChild);
  log(
    'DEV',
    `${COLORS.gray}Postgres container left running for fast restarts. Run "docker compose down" to stop it.${COLORS.reset}`,
  );
  setTimeout(() => process.exit(exitCode), 300);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  log('DEV', `${COLORS.green}AlegoMind dev launcher${COLORS.reset} (platform: ${process.platform})`);
  preflight();
  startDatabase();
  await waitForDatabaseHealthy();
  applyMigrations();
  startApi();
  startWeb();
  log('DEV', `${COLORS.green}All services starting. API on :3000, Web on :3001. Press Ctrl+C to stop.${COLORS.reset}`);
}

main();
