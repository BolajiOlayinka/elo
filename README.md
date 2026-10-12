# EloStats Football

The Universal Football Rating Engine: career points, peak seasons, and era-normalised comparisons for players, keepers, coaches, clubs, and nations.

This repo is a **monolith**. Express serves `/api/v1` and the React SPA from the same process. Vendor football APIs are never called from the HTTP app. Data is downloaded by CLI scripts, stored as JSON, optionally copied to S3, then loaded into Postgres.

## Layout

```
elo_project/
├── elo_web/          React + Vite SPA (landing, ratings, profile, compare)
├── elo_backend/      Express 5, Knex, Postgres, ingest CLIs
├── elo_admin/        placeholder
├── package.json      Heroku / monolith start + web build
└── Procfile          web: node elo_backend/src/index.js
```

## Prerequisites

- Node 22 and npm 10
- Docker (local Postgres + Redis)
- API-Football key for ingest (not needed to run the UI)
- Optional: `DATABASE_URL` (Heroku Postgres), AWS keys for S3 dumps, `FOOTBALL_DATA_KEY`, Wikidata User-Agent

## Local web

```bash
cd elo_web
npm install
npm run dev
```

Vite serves the SPA. Routes:

| Path | Page |
|------|------|
| `/` | Landing |
| `/ratings` | Rankings |
| `/profile/:type/:id` | Profile |
| `/compare` | Side-by-side compare |

## Local API / monolith

```bash
cd elo_backend
cp .env.example .env   # fill keys; never commit .env
docker compose up -d
npm install
npm run mg:latest      # local Docker Postgres on 5447
npm run start-dev
```

Default port is `3000` (`PORT` in `.env`).

| Path | Notes |
|------|--------|
| `GET /api/health` | Always on |
| `/api/v1` | Mounted only when `REDIS_URL` is set; otherwise `503` |
| `/admin/queues` | Bull Board, development + Redis |
| `/` and SPA routes | Built web, or `elo_web/dist` |

Knex **development** always uses local Docker (`DB_HOST` / `DB_PORT=5447`). Production uses `DATABASE_URL` with SSL.

From the repo root, after a web build:

```bash
npm run build:web
npm start
```

`build:web` copies `elo_web/dist` into `elo_backend/public/web`.

## Ingest

Scripts live in `elo_backend`. They write under `elo_backend/data/` (gitignored). They are **not** on the request path.

Download JSON first. Load into the database second. Resume is file-based (`_complete.json` and existing files). Quota / access failures stop the download (exit code 2); run the same command again to continue.

```bash
cd elo_backend

# Probe coverage / keys
npm run probe:api-football
npm run probe:football-data

# One league-season, then the full 922 player-stat seasons
npm run ingest:download:season          # --league 39 --season 2024
npm run ingest:download:all

# Confirm 922/922 on disk before a full live load
npm run ingest:verify

# Load (local Docker unless --live)
npm run ingest:load:season
npm run ingest:load:all                 # local
npm run ingest:load:all:live            # DATABASE_URL + S3

# Career-era context (1980–2008), separate from API-Football
npm run ingest:wikidata:smoke
npm run ingest:wikidata:download
```

`ingest:load:all:live` refuses a partial download unless you pass `--allow-partial`. Do not use `--allow-partial` unless you mean to load a subset.

`--live` uses Heroku `DATABASE_URL` and writes dumps to S3 (`S3_BUCKET=elo-football`, region `eu-north-1`). Load does not call API-Football.

Wikidata is identity and stints for older careers. It does not replace player-match stats. Mapping onto API-Football ids is name + date of birth, then aliases, then club-year overlap — not a later overwrite of `players.id`.

## Environment

Copy `elo_backend/.env.example`. Important names:

- `API_FOOTBALL_KEY`, `FOOTBALL_DATA_KEY`, `WIKIDATA_USER_AGENT`
- `DB_*` for local Docker; `DATABASE_URL` for production
- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_REGION` / `S3_BUCKET`
- `REDIS_URL` (required to mount `/api/v1`)
- `JWT_SECRET`, `WHITELISTED_ORIGINS`, SMTP vars

Do not log or commit secrets.

## Deploy

Heroku expects Node 22. Root `heroku-postbuild` builds the SPA, then installs backend production deps.

```
web: node elo_backend/src/index.js
```

Set `DATABASE_URL`, `REDIS_URL`, and the same secrets as local. The slug ignores `elo_backend/data`.

If GitHub auto-deploy is wired to this repo, `elo_backend` must be a normal folder, not a nested git repository. A nested `.git` inside `elo_backend` will ship as a gitlink and the dyno will not contain backend source. Flatten that, or deploy with `heroku builds:create --dir .` from this root after `heroku login`.

## Data sources

- **API-Football** — match and player-stat seasons (primary Career Points grain). Ultra plan for the one-off 922-season pull, then Pro for updates. ToS: do not resell their data as an API.
- **football-data.org** — limited historical coverage; not a Career Points source on the free key.
- **Wikidata SPARQL** — people and stints, birth years 1935–1993, careers 1980–2008. Respect rate limits and User-Agent.
