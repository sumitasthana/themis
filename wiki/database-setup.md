# Database setup — a guide for new developers

This is the practical handbook for getting Themis's Postgres running on a fresh machine, understanding what's in it, and refreshing it as the demo data evolves. If you just want the one-liner, see the [root README](../README.md) — this doc is for when something goes wrong, or you need to understand what's happening.

---

## TL;DR

```powershell
git clone https://github.com/sumitasthana/themis.git
cd themis
docker compose up -d
```

That's it. After ~10 seconds you have a Postgres on `localhost:5433` containing 6 alerts, 6 customers, 46 transactions, and 7 stored investigations. Skip the rest of this doc unless you hit a snag.

---

## Architecture at a glance

```
React (Vite, :5173)
   ↓  /api/* (proxied)
Express BFF (:3001)
   ↓  forwards data routes + agent calls
FastAPI agent (:8000)
   ↓  asyncpg / SQLAlchemy
Postgres (:5433, Docker)         ← this guide
```

Everything in the agent stack reads from Postgres. The frontend has no static data anymore — break Postgres and the UI goes blank.

---

## What ships in this repo

| File | What it is | When you touch it |
|---|---|---|
| [`compose.yaml`](../compose.yaml) | Docker Compose service definition for Postgres. Pins `postgres:18`, exposes `5433`, mounts a named volume, and wires `db/*.sql` into the init-scripts hook. | Rarely — only when changing port, image version, or volume name. |
| [`db/schema.sql`](../db/schema.sql) | DDL: every table, foreign key, index, sequence, plus the `alembic_version` table pinned to `0002`. Output of `pg_dump --schema-only`. | After running a new alembic migration — re-dump and commit. |
| [`db/seed.sql`](../db/seed.sql) | DML: `INSERT` statements for every row in every table, with sequence `setval`s preserved. Output of `pg_dump --data-only --column-inserts`. | After meaningful data changes (new investigation runs, new SARs, etc.) — re-dump and commit. |
| [`db/restore.ps1`](../db/restore.ps1) | One-shot script that drops + recreates `themis_app` and applies `schema.sql` then `seed.sql`. Useful when you already have a running container and want a clean slate. | Whenever your local DB has drifted from the committed dumps and you want to start over. |
| [`db/README.md`](../db/README.md) | Short pointer doc for the dumps. | — |
| [`agent/alembic/versions/*.py`](../agent/alembic/versions/) | Source of truth for schema *changes* going forward. `schema.sql` is the materialized current state. | Whenever you change `agent/db/models.py`. |

---

## Three ways to get a working database

Pick the row that matches your situation.

| Situation | Command | What happens |
|---|---|---|
| Fresh clone, no postgres container yet | `docker compose up -d` | Compose creates the `themis_pgdata` volume, brings up `local-postgres`, and runs `schema.sql` + `seed.sql` automatically via the init-scripts hook. ~10 seconds end-to-end. |
| Already have an unseeded `local-postgres` container | `powershell -File db\restore.ps1` | Script drops + recreates `themis_app` inside the running container and applies both SQL files. Does not touch the volume. |
| Already have a seeded DB and just want to reset to committed state | `powershell -File db\restore.ps1` | Same as above — it always drops and recreates `themis_app`, so any local drift is wiped. |
| Want an empty schema with no demo data | `docker compose up -d` with init scripts removed, **or** `cd agent ; python -m alembic upgrade head` against an empty `themis_app` | Tables exist, all empty. Use this for unit testing or when starting a brand-new dataset. |

---

## How the auto-seed actually works

The official `postgres:18` image runs a shell script on container start that checks if `PGDATA` is empty. If it is — i.e. this is a brand-new database — it then iterates `/docker-entrypoint-initdb.d/` in alphabetical order and:

- `*.sql` files are piped to `psql`
- `*.sh` files are sourced
- everything else is ignored with a log line

Our `compose.yaml` mounts:

```yaml
- ./db/schema.sql:/docker-entrypoint-initdb.d/01_schema.sql:ro
- ./db/seed.sql:/docker-entrypoint-initdb.d/02_seed.sql:ro
```

Two important consequences:

1. **The init hook only fires on a truly empty volume.** Running `docker compose up -d` a second time, or after a `docker compose down` (which keeps the volume), does *not* re-seed. To force re-seeding you must wipe the volume: `docker compose down -v`.
2. **Schema changes in `schema.sql` won't apply to an existing volume.** If you bump `db/schema.sql` and want the changes locally, either wipe the volume or run `db/restore.ps1` (which drops the database inside the volume — different from wiping the volume itself).

---

## The lifecycle commands you'll actually use

```powershell
# Bring it up (first time creates volume + auto-seeds)
docker compose up -d

# Stop it (keeps data — next 'up' is fast and skips seeding)
docker compose down

# Stop AND wipe data (next 'up' re-seeds from db/*.sql)
docker compose down -v

# Watch logs (useful when init scripts are running)
docker compose logs -f postgres

# Open a psql session
docker exec -it local-postgres psql -U postgres -d themis_app

# Check what's in there
docker exec local-postgres psql -U postgres -d themis_app -c "SELECT (SELECT count(*) FROM alerts) AS alerts, (SELECT count(*) FROM customers) AS customers, (SELECT count(*) FROM transactions) AS transactions, (SELECT count(*) FROM investigations) AS investigations, (SELECT version_num FROM alembic_version) AS alembic;"
```

Expected counts right after a fresh `compose up`:

```
 alerts | customers | transactions | investigations | alembic
--------+-----------+--------------+----------------+---------
      6 |         6 |           46 |              7 | 0002
```

If your `investigations` count is higher, that's normal — it grows every time you run an investigation through the agent. Your local DB legitimately diverges from the seed; that's why we don't re-seed automatically.

---

## Refreshing the dumps

You'll need to do this after either of:

- A new alembic migration in `agent/alembic/versions/` — `schema.sql` needs to mirror the new tables/columns.
- A meaningful change to seed data — new alert, edited customer, etc.

```powershell
# 1. Re-dump schema. Strips ownership, privileges, and noisy comments.
docker exec local-postgres pg_dump -U postgres -d themis_app `
  --schema-only --no-owner --no-privileges --no-comments `
  > db\schema.sql

# 2. Re-dump data. --column-inserts keeps diffs reviewable;
#    --disable-triggers lets the load skip FK ordering;
#    --rows-per-insert=100 batches inserts for smaller diffs.
docker exec local-postgres pg_dump -U postgres -d themis_app `
  --data-only --column-inserts --no-owner --disable-triggers --rows-per-insert=100 `
  > db\seed.sql
```

PowerShell's `>` redirection writes UTF-8 **with BOM** on Windows. psql tolerates the BOM but it pollutes diffs. Strip it before committing:

```powershell
$enc = New-Object System.Text.UTF8Encoding $false
foreach ($f in 'db\schema.sql','db\seed.sql') {
  $txt = [IO.File]::ReadAllText("c:\LangChain\Themis\$f")
  [IO.File]::WriteAllText("c:\LangChain\Themis\$f", $txt, $enc)
}
```

Then validate the dump round-trips before committing:

```powershell
powershell -File db\restore.ps1 -Database themis_smoke_test
docker exec local-postgres psql -U postgres -c "DROP DATABASE themis_smoke_test;"
```

If `restore.ps1` errors out partway through, your dump has a problem — usually a missing FK target or a sequence that doesn't match its column. Fix and re-dump; don't commit broken SQL.

---

## Alembic vs `schema.sql` — when to use which

These coexist on purpose.

- **Alembic** (`agent/alembic/versions/*.py`) is the source of truth for schema *evolution*. Each migration is a forward-only diff. Production-ish deploys would run `alembic upgrade head` to roll forward without touching data.
- **`db/schema.sql`** is the materialized current state, regenerated after every migration. It's the fast path for fresh clones — one psql apply instead of N migrations — and it embeds the current alembic version so future migrations know where to start.

A new dev cloning the repo never runs alembic for the initial setup. They get the dumped schema, alembic_version is pre-set to `0002`, and `alembic upgrade head` from there is a no-op until someone adds `0003`.

If you add `0003_*.py` and forget to refresh `db/schema.sql`, new clones will be on `0002` while the codebase expects `0003`. Tests will fail in confusing ways. Always re-dump after a migration.

---

## Common problems

### `port is already allocated`

Something else is on `5433`. Either stop that thing or change the port in `compose.yaml` *and* in `.env`'s `DATABASE_URL` / `DATABASE_URL_SYNC`. Both have to agree.

### `relation "alerts" does not exist`

The schema wasn't applied. Two causes:

1. The volume already existed (so the init hook didn't fire) and was empty. Run `db/restore.ps1`, or `docker compose down -v && docker compose up -d`.
2. `schema.sql` errored during init and only some tables were created. Check `docker compose logs postgres` — look for `psql: error:` lines.

### `relation "alembic_version" exists` when running `alembic upgrade head`

Expected. `schema.sql` includes that table. Alembic just sees you're already at `0002` and does nothing — which is correct.

### Seed data looks stale / I edited something and don't see it

Your local DB has diverged from `db/seed.sql`. If you want to reset to what's committed: `powershell -File db\restore.ps1`. If you want to *keep* your changes and update the dump: run the pg_dump commands in the "Refreshing the dumps" section.

### `password authentication failed for user "postgres"`

The container's `POSTGRES_PASSWORD` is `mysecretpassword` (this is a demo password, intentionally not a secret — it's in `compose.yaml`, the README, and `.env`). If you've overridden it via env vars or a different `.env`, align them.

### `pg_dump: error: server version: 18.x; pg_dump version: 14.x`

You're calling host-installed `pg_dump`, not the container's. Either use `docker exec local-postgres pg_dump …` (recommended) or install a matching pg_dump locally.

### Compose says `init scripts ignored` for `README.md` and `restore.ps1`

We mount only `schema.sql` and `seed.sql` explicitly, not the whole `db/` directory, so this shouldn't happen. If it does, you're on an older `compose.yaml` — pull main.

---

## Sharing your work with another developer

Once you've made changes locally that you want a teammate to inherit:

1. Make sure your local DB is in a state you'd want them to clone from.
2. Re-dump (see "Refreshing the dumps").
3. `git add db/schema.sql db/seed.sql && git commit -m "db: refresh dumps after <reason>"`
4. Push. They run `docker compose down -v && docker compose up -d` (the `-v` is essential — without it their old volume blocks the new seed).

A friendlier message for them: "pull main, then `docker compose down -v && docker compose up -d`."

---

## What this setup deliberately doesn't do

- **No production-grade secrets handling.** The DB password is in the repo. Fine for a demo; not fine for prod. Don't lift this compose file as-is into a real deployment.
- **No replication, backup, or PITR.** Single-node Postgres on a Docker volume. Wipe the volume and the data is gone — that's why we commit the dumps.
- **No automatic dump refresh.** There's no hook that re-dumps after every change. It's a manual step, by design — most local changes (experimental queries, throwaway investigation runs) shouldn't end up in the committed seed.
- **No cross-platform parity guarantees.** The compose file is tested on Docker Desktop on Windows. It *should* work on macOS/Linux Docker, but the `restore.ps1` script is Windows-only. If you're on Linux/macOS, run the `docker cp` + `psql -f` commands from [`db/README.md`](../db/README.md) directly.
