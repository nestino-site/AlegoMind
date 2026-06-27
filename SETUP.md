# AlegoMind — Local Dev Setup (macOS + Windows)

This repo was originally developed on macOS. It now also runs on Windows.
This doc covers the exact toolchain required and a debugging reference for
when something doesn't start.

## Stack

- **API**: NestJS (`apps/api`), port `3000`, prefix `/api`, versioned routes (`/api/v1/...`)
- **Web**: Next.js (`apps/web`), port `3001`
- **DB**: Postgres 16, via Docker (`docker-compose.yml`), port `5432`
- Package manager: **Yarn 1.22.x** (pinned via Corepack), workspaces in `apps/*`

## One-time machine setup

| Tool | Windows | macOS | Verify |
|---|---|---|---|
| Node.js ≥ 20 | `nvm-windows` → `nvm install 20` (or use the 24.x already installed) | `nvm install 20` | `node --version` |
| Yarn 1.22.x | `corepack enable` (ships with Node) | `corepack enable` | `yarn --version` |
| Docker Desktop | Install with **WSL2 backend** enabled | Install Docker Desktop | `docker info` (must not error) |

No Python, no global installs beyond the above. `yarn install` at the repo
root installs everything for both `apps/api` and `apps/web` (Yarn workspaces).

### Windows-only note: native modules

`bcrypt` and `sharp` ship platform-specific compiled binaries (`.node`
files). If `node_modules` is ever copied from a Mac (e.g. via a zip/drive
transfer instead of a fresh clone), those binaries are macOS-only and will
crash on Windows with errors like `invalid ELF header` or `not a valid Win32
application`. Fix:

```sh
rm -rf node_modules apps/api/node_modules apps/web/node_modules
yarn install
yarn workspace @alegomind/api prisma:generate
```

This was already done once for this checkout — `yarn install` was re-run
on Windows so `bcrypt`/`sharp`/Prisma engines now match this machine.

## Running everything

```sh
yarn install                 # first time only, or after pulling new deps
yarn dev                     # starts Postgres, runs migrations, starts API + Web
```

`yarn dev` runs `scripts/dev.js`, which:

1. Checks Docker, Node, and Yarn are available and Docker is running.
2. Creates `apps/api/.env` and `apps/web/.env.local` from their `.example`
   files if missing.
3. Starts the Postgres container and waits for its healthcheck.
4. Runs `prisma migrate deploy` (applies any pending migrations).
5. Starts the API (`nest start --watch`) and Web (`next dev`) together.
6. Prefixes every log line with `[DB]` / `[API]` / `[WEB]` / `[DEV]` plus a
   timestamp, so you always know which process produced a given line.

Press **Ctrl+C** to stop the API and Web processes. The Postgres container
is left running (so the next `yarn dev` is fast) — stop it explicitly with
`docker compose down` if you want a clean slate.

If API or Web crashes, the script prints the last ~25 lines from that
service plus a checklist of likely causes (see below) before exiting.

## Debugging notes — error → likely cause → fix

| Symptom | Likely cause | Fix |
|---|---|---|
| `invalid ELF header` / `not a valid Win32 application` / segfault on API start | Native module (`bcrypt`, `sharp`, Prisma engine) compiled for the wrong OS | `rm -rf node_modules apps/*/node_modules && yarn install && yarn workspace @alegomind/api prisma:generate` |
| `yarn: command not found` | Corepack not enabled | `corepack enable` |
| `docker: command not found` or `docker info` errors | Docker Desktop not installed or not running | Install/start Docker Desktop; on Windows ensure WSL2 backend is enabled |
| `[DB] Failed to start the Postgres container` | Port `5432` already used by another Postgres (e.g. a native install) | `docker compose down` then check `netstat -ano \| findstr :5432` (Windows) / `lsof -i :5432` (Mac) for the conflicting process |
| `Error: P1001: Can't reach database server at localhost:5432` | Postgres container not running/healthy, or `DATABASE_URL` host is wrong | `docker compose ps` — should show `alegomind_db` as `healthy`. `DATABASE_URL` in `apps/api/.env` must use `localhost`, not a container name, since the API runs on the host, not in Docker |
| `EADDRINUSE :3000` or `:3001` | Another process already using that port | Windows: `netstat -ano \| findstr :3000` then `taskkill /PID <pid> /F`. Mac: `lsof -i :3000` then `kill <pid>` |
| Prisma client out of sync with schema (`Unknown field`, etc.) | Forgot to regenerate the client after a schema change or fresh install | `yarn workspace @alegomind/api prisma:generate` |
| CORS errors in the browser console | `CORS_ORIGIN` in `apps/api/.env` doesn't match the Web origin | Should be `http://localhost:3001` for local dev |
| Web can't reach the API (network errors in the browser) | `NEXT_PUBLIC_API_URL` in `apps/web/.env.local` wrong, or API didn't start | Should be `http://localhost:3000/api/v1`; check `[API]` logs for startup errors |
| 401s right after signing in worked before | `JWT_SECRET` / `JWT_REFRESH_SECRET` changed or `.env` regenerated | Tokens signed with the old secret are invalid; sign in again |

## Known pre-existing issue (not Windows-specific)

`apps/api/package.json` mixes NestJS v10 (`@nestjs/common`, `@nestjs/core`
at `^10.3.0`) with `@nestjs/websockets` / `@nestjs/platform-socket.io` at
`^11.1.26`. `yarn install` prints peer-dependency warnings for this. It
currently works, but it's a latent risk — if the messaging/websockets
feature breaks in a way that looks dependency-related, this mismatch is the
first thing to check. Not something this setup pass changed or fixed.
