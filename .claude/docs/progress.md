# Progress

A static diagnosis of this checkout, last updated 2026-10-20. It doesn't cover other repositories or deployed services.

## Log

| Date | Work |
|---|---|
| 2026-10-18 | Read the three official sources. Wrote the consolidated context, the RF/RNF/RN/UC analysis, conceptual entities, risks, acceptance criteria, open questions, agent instructions and an index under `ai/`. Renamed the empty `COONTEXTO_GERAL.md` to `CONTEXTO_GERAL.md`. No code changed. |
| 2026-10-20 | Moved all agent material into `.claude/` and rewrote it in English: the `CLAUDE.md` entry point; path-scoped rules for architecture, domain, the HTTP layer, the data layer and testing, derived from the code; and the skills `feature-spec`, `new-domain` and `api-review`, which replace `.github/prompts/`. Moved the official sources verbatim to `docs/sources/` and cut the root `AGENTS.md` down to a pointer. No application code changed. |
| 2026-10-20 | Compared the project against the reference PDFs (identical to `sources/`) and the Figma prototype v1.0 (61 frames). At the user's request, the prototype became the functional source of truth (D09). Wrote `docs/prototype.md`, derived decisions D10–D26, resolved or narrowed P01, P02, P04–P06, P08, P10 and P12–P14, added P17–P21, and rewrote `rules/domain.md`. No application code changed. |
| 2026-10-20 | Removed Socket.IO at the user's request: deleted `src/app/socket/socketio.js`, the socket setup in `src/app/index.js`, and the `socket.io` dependency and its packages in `package-lock.json`; updated the rules and docs. Checked with `node --check` and `npm ls --package-lock-only`; the server wasn't started because dependencies aren't installed. |
| 2026-10-20 | At the user's request, wrote the data model from the prototype: 11 Sequelize models, `models/index.js` (the only safe way to import them; direct imports break the associations), all associations, the full schema in `data/db.sql`, `docs/data-model.md`, and the ERD in `docs/der/` (Mermaid source plus PNG and SVG). Checked with a script: all models load through `models/index.js`, the associations resolve, and every model's columns and nullability match `db.sql`. The SQL was **not** run against MySQL: Docker Desktop was off. Installed `node_modules` with `npm ci`. Updated the rules and the `new-domain` templates. |

## What exists (not run)

| Files | Observed state |
|---|---|
| `src/index.js`, `src/app/index.js` | Bootstrap with dotenv, Express, CORS, JSON and an HTTP server. Exports the app. |
| `src/app/handlers/routes.handler.js` | Auto-mounts route files. The folder holds only `.gitkeep`. |
| `src/app/config/swagger.js` | `/api-docs`, OpenAPI 3, bearer scheme. No business endpoints are annotated. |
| `src/app/database/index.js` | Sequelize/MySQL configuration. It connects only when imported, and a working connection hasn't been verified. |
| `src/app/database/models/`, `data/db.sql`, `docs/der/` | 11 models and their associations, the full schema and the ERD (see `docs/data-model.md`). They load and match each other; the schema hasn't been run against MySQL and awaits approval. |
| `src/app/middlewares/` | Zod validation, request logger, localhost-only guard. No user or JWT authentication. |
| `docker-compose.yml`, `.github/workflows/test.yml` | MySQL 8, plus a CI pipeline (install, SQL script, Jest). A successful CI run hasn't been verified. |
| `jest.config.js`, `src/tests/setup/global.js`, `src/tests/sequencer.js` | Test infrastructure with no `*.test.js` files. |

## Missing

- No RF01–RF13 functionality. Controllers, services, repositories and routes contain only `.gitkeep`; only the data model exists.
- No authentication or authorization, operational management, uploads, odometer photos, metrics, alerts or anonymization.
- No React Native/Expo app in this checkout.
- No evidence of redundant infrastructure, performance tests or client acceptance.

## Known issues

| Severity | Issue |
|---|---|
| High | `data/db.sql` starts with `DROP DATABASE IF EXISTS rotarix`. CI runs it, which is fine on a throwaway service, but locally it wipes data. |
| High | The request logger prints the full `req.body` and `req.query`, which will expose passwords and personal data once login and uploads exist. |
| High | `private.auth.middleware.js` checks only for a localhost IP. That doesn't meet RNF02, and behind a reverse proxy on the same host every request passes. It also returns `error_id` instead of `id`. |
| Medium | The schema middleware discards the body parse result, so Zod transforms and defaults never reach `req.body`. `req.query = ...` is a no-op in Express 5 because `req.query` is a getter. Needs runtime confirmation. |
| Medium | The test database is inconsistent. CI uses `rotarix` through environment variables, while local `.env.test` uses `rotarix_test`, which no script creates. `global.js` doesn't set up a schema. |
| Medium | If the database connection fails, `process.exit()` runs with no code, so the process exits with status 0 and the failure looks like a clean exit. |
| Low | `src/index.js` calls `console.clear()` on import, including during tests. `express.static('./src/app/public')` points to a folder that doesn't exist. `@jest/test-sequencer` is in `dependencies` instead of `devDependencies`. |
| Info | There's no evidence of TLS or recovery. The production URL in Swagger is configuration only. |

## Validation and limits

Static inspection of all code, test configuration, the workflow, the SQL script and the former prompts. Dependencies are installed (2026-10-20), but there are no test suites. Nobody has run `npm test`, started the server or applied the SQL script. The models were loaded and compared with `db.sql` by a script, without a database. No feature is classified as done.

## Recommended plan

This is a recommendation, not an approved schedule. The user sets the priorities. Location tracking, chat and offline mode aren't included by inference.

1. Answer P07 (managers, companies and ownership, together with the rest of P06), P12 (finishing a trip after the driver is deactivated) and P17–P19 (how maintenance and fuel count as expenses, and the vehicle for records outside a trip). Get the missing flows designed (P20). Record whether the client validated the prototype (P16). Get the approval to implement.
2. Approve the data model (`data-model.md`) or adjust it to the answers from step 1, and run `db.sql` on a throwaway MySQL to validate it. Specify the HTTP contracts and authorization from `prototype.md`, and settle how service errors map to HTTP status. Set up an isolated test database without running the destructive script against existing data.
3. Build accounts (S01–S03, S19–S20, S36–S37: sign-up, login, profile, password, logout, deletion) with hashing, authorization and tests. Redact the logger first.
4. Build fleets, vehicles, drivers and assignments (S06–S14, M01–M09), with permission tests and the effects of deactivation and deletion (D11–D13, D24).
5. Build image storage, then trips and odometer readings (S25–S30, M12–M13, M18; RN06–RN08, D20), with concurrency safety and mandatory photos.
6. Build expenses, refueling and maintenance (S31–S35, M10–M11; D19, D21) and service alerts (P09). Then the manager metrics and activity feed (S04–S05, S15–S18; D16).
7. Integrate the mobile app, validate the flows with the manager and drivers, and check performance, recovery and the acceptance criteria before delivery.
