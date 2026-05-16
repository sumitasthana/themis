# Getting Started with Themis

A plain-English guide to running the Themis platform on your own machine. No prior knowledge of the project assumed.

---

## What is Themis?

Themis is an Anti-Money-Laundering (AML) investigation tool. It has a web interface where you can look at alerts, customers, transactions, and let an AI agent investigate suspicious activity.

To make it work, **four separate programs** need to be running at the same time. Think of it like a relay race — each one passes information to the next:

```
Your browser (the website)
        |
        v
React frontend  ......... port 5173   <- what you actually look at
        |
        v
Express server  ......... port 3001   <- the middleman
        |
        v
Python AI agent ......... port 8000   <- does the thinking
        |
        v
PostgreSQL database ..... port 5433   <- stores all the data
```

If any one of these is not running, the parts above it stop working. So we start them **from the bottom up**: database first, then the AI agent, then the frontend.

---

## Before you start — what you need installed

| Tool | Why | Check it's installed |
|---|---|---|
| **Docker Desktop** | Runs the database in a container so you don't have to install PostgreSQL yourself | `docker --version` |
| **Python 3** | Runs the AI agent | `python --version` |
| **Node.js** | Runs the frontend and the middleman server | `node --version` |

If any command above gives an error, install that tool first.

---

## Step 1 — Start the database

Open a PowerShell terminal in the project folder (`c:\LangChain\Themis`) and run:

```powershell
docker compose up -d
```

**What this does:** downloads PostgreSQL, starts it, and automatically fills it with demo data (6 alerts, 6 customers, 46 transactions, and more). This only takes about 10 seconds.

**Check it worked:**

```powershell
docker exec local-postgres psql -U postgres -d themis_app -c "SELECT count(*) FROM alerts;"
```

You should see the number `6`. If you do, the database is ready.

> **Note:** You only need the seeding to happen once. Later, `docker compose up -d` just starts the existing database again — your data stays.

---

## Step 2 — Start the Python AI agent

Open a **second** PowerShell terminal. Then:

```powershell
cd agent
pip install -r requirements.txt
python -m uvicorn api:app --port 8000
```

**What this does:**
- `cd agent` moves into the agent folder.
- `pip install ...` installs the Python libraries the agent needs (only needed the first time, or when dependencies change).
- The last line actually starts the agent on port 8000.

**Leave this terminal open** — the agent keeps running in it. If you close it, the agent stops.

---

## Step 3 — Start the frontend and middleman server

Open a **third** PowerShell terminal, back in the project root (`c:\LangChain\Themis`):

```powershell
npm install
npm run dev
```

**What this does:**
- `npm install` downloads the JavaScript libraries (only needed the first time).
- `npm run dev` starts **two** things at once: the Express middleman server (port 3001) and the React frontend (port 5173).

**Leave this terminal open too.**

---

## Step 4 — Open the app

Open your web browser and go to:

```
http://localhost:5173
```

The Themis platform should load. You're done.

---

## Quick reference — the daily routine

Once everything is installed, starting Themis again later is just:

| Terminal | Command |
|---|---|
| 1 | `docker compose up -d` |
| 2 | `cd agent` then `python -m uvicorn api:app --port 8000` |
| 3 | `npm run dev` |

You can skip `pip install` and `npm install` after the first time, unless someone tells you the dependencies changed.

---

## Stopping everything

- **Frontend / agent:** click on their terminal windows and press `Ctrl + C`.
- **Database:** run `docker compose down` (this keeps your data) or `docker compose down -v` (this **deletes** the data and re-seeds fresh next time).

---

## When something goes wrong

### The website loads but everything is blank
The frontend can't reach the data. Check that **both** the database (Step 1) and the agent (Step 2) are running. The frontend has no built-in data of its own — it shows nothing if the chain below it is broken.

### "port is already allocated" when starting the database
Something else on your computer is using port 5433. Either stop that other thing, or change the port — but if you change it, you must update it in **both** `compose.yaml` and the `.env` file so they match.

### `relation "alerts" does not exist`
The database started but wasn't filled with data. Easiest fix: wipe and restart it —
```powershell
docker compose down -v
docker compose up -d
```

### The agent terminal shows database connection errors
The database isn't running, or it's on a different port than the `.env` file expects. Make sure Step 1 finished successfully before starting the agent.

### `password authentication failed for user "postgres"`
The demo password is `mysecretpassword`. It's intentionally not a secret for this demo. If you changed it somewhere, make all the places agree again.

---

## A note on security

The `.env` file in this project contains AWS access keys. For a local demo that's workable, but **these should never be treated as safe** — if they are real, active keys, they should be rotated and removed from the repository. The database password (`mysecretpassword`) is a deliberate demo value and is fine to leave as-is for local use.

---

## Want more detail?

- [`wiki/database-setup.md`](wiki/database-setup.md) — deep dive on the database: how seeding works, how to refresh the data, every error you might hit.
- [`CLAUDE.md`](CLAUDE.md) — the technical project overview (architecture, schema, migration phases).
- [`wiki/`](wiki/) — one document per module (frontend, agent API, orchestrator, tools, etc.).
