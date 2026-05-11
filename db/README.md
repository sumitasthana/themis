## Themis database bootstrap

Two SQL files reproduce the Postgres state on a fresh clone:

- `schema.sql` — DDL (all tables, FKs, indexes, sequences, and `alembic_version`)
- `seed.sql` — DML (`INSERT` statements for every row, `disable-triggers`, sequence `setval`s)

Both are `pg_dump` output and are designed to be applied to an **empty** database in this order.

### Quick start (Docker)

```powershell
# 1. Start a postgres container that matches the DATABASE_URL in .env
docker run -d --name local-postgres `
  -e POSTGRES_PASSWORD=mysecretpassword `
  -e POSTGRES_DB=themis_app `
  -p 5433:5432 postgres:18

# 2. Apply DDL then DML
docker cp db/schema.sql local-postgres:/tmp/schema.sql
docker cp db/seed.sql   local-postgres:/tmp/seed.sql
docker exec local-postgres psql -U postgres -d themis_app -v ON_ERROR_STOP=1 -f /tmp/schema.sql
docker exec local-postgres psql -U postgres -d themis_app -v ON_ERROR_STOP=1 -f /tmp/seed.sql
```

Or run the one-shot script: `pwsh db/restore.ps1`.

### Local psql

```bash
createdb -h localhost -p 5433 -U postgres themis_app
psql -h localhost -p 5433 -U postgres -d themis_app -v ON_ERROR_STOP=1 -f db/schema.sql
psql -h localhost -p 5433 -U postgres -d themis_app -v ON_ERROR_STOP=1 -f db/seed.sql
```

### Alembic interaction

`schema.sql` includes the `alembic_version` table with the current head (`0002`). After restore you can run `alembic upgrade head` against future migrations; it will pick up from there.

If you'd rather build the schema with Alembic instead of `schema.sql`, run `alembic upgrade head` first and then apply **only** `seed.sql`. Both paths leave the database in the same state.

### Refreshing the dumps

After making schema or data changes in your running container:

```powershell
docker exec local-postgres pg_dump -U postgres -d themis_app `
  --schema-only --no-owner --no-privileges --no-comments `
  > db/schema.sql

docker exec local-postgres pg_dump -U postgres -d themis_app `
  --data-only --column-inserts --no-owner --disable-triggers --rows-per-insert=100 `
  > db/seed.sql
```

When using PowerShell's `>` redirection, files are written as UTF-8 with BOM. Strip the BOM before committing (psql tolerates BOM but it adds noise to diffs).
