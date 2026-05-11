# Themis DB restore — applies db/schema.sql then db/seed.sql to a running postgres container.
#
# Usage:
#   pwsh db/restore.ps1                              # uses local-postgres + themis_app
#   pwsh db/restore.ps1 -Container my-pg -Database x

param(
    [string]$Container = 'local-postgres',
    [string]$Database  = 'themis_app',
    [string]$User      = 'postgres'
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$schema = Join-Path $PSScriptRoot 'schema.sql'
$seed   = Join-Path $PSScriptRoot 'seed.sql'

if (-not (Test-Path $schema)) { throw "schema.sql not found at $schema" }
if (-not (Test-Path $seed))   { throw "seed.sql not found at $seed" }

Write-Host "Container : $Container"
Write-Host "Database  : $Database"
Write-Host "User      : $User"

# Verify container is running
$running = docker inspect -f '{{.State.Running}}' $Container 2>$null
if ($running -ne 'true') { throw "Container '$Container' is not running. Start it first (e.g. 'docker start $Container')." }

# Drop & recreate target database for a clean restore
Write-Host "`nResetting database $Database ..."
docker exec $Container psql -U $User -c "DROP DATABASE IF EXISTS $Database;" | Out-Null
docker exec $Container psql -U $User -c "CREATE DATABASE $Database;" | Out-Null

# Copy and apply
Write-Host "Copying SQL files into container ..."
docker cp $schema "${Container}:/tmp/schema.sql" | Out-Null
docker cp $seed   "${Container}:/tmp/seed.sql"   | Out-Null

Write-Host "Applying schema.sql ..."
docker exec $Container psql -U $User -d $Database -v ON_ERROR_STOP=1 -q -f /tmp/schema.sql

Write-Host "Applying seed.sql ..."
docker exec $Container psql -U $User -d $Database -v ON_ERROR_STOP=1 -q -f /tmp/seed.sql

Write-Host "`nRestore complete. Row counts:"
docker exec $Container psql -U $User -d $Database -c "SELECT (SELECT count(*) FROM alerts) AS alerts, (SELECT count(*) FROM customers) AS customers, (SELECT count(*) FROM transactions) AS transactions, (SELECT count(*) FROM investigations) AS investigations, (SELECT version_num FROM alembic_version) AS alembic;"
