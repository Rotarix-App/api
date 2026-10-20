# Progress

The state of this checkout, last updated 2026-10-20. It doesn't cover other repositories or deployed services.

## Log

| Date | Work |
|---|---|
| 2026-10-18 | Read the three official sources. Wrote the consolidated context, the RF/RNF/RN/UC analysis, conceptual entities, risks, acceptance criteria, open questions, agent instructions and an index under `ai/`. Renamed the empty `COONTEXTO_GERAL.md` to `CONTEXTO_GERAL.md`. No code changed. |
| 2026-10-20 | Moved all agent material into `.claude/` and rewrote it in English: the `CLAUDE.md` entry point; path-scoped rules for architecture, domain, the HTTP layer, the data layer and testing, derived from the code; and the skills `feature-spec`, `new-domain` and `api-review`, which replace `.github/prompts/`. Moved the official sources verbatim to `docs/sources/` and cut the root `AGENTS.md` down to a pointer. No application code changed. |
| 2026-10-20 | Compared the project against the reference PDFs (identical to `sources/`) and the Figma prototype v1.0 (61 frames). At the user's request, the prototype became the functional source of truth (D09). Wrote `docs/prototype.md`, derived decisions D10–D26, resolved or narrowed P01, P02, P04–P06, P08, P10 and P12–P14, added P17–P21, and rewrote `rules/domain.md`. No application code changed. |
| 2026-10-20 | Removed Socket.IO at the user's request: deleted `src/app/socket/socketio.js`, the socket setup in `src/app/index.js`, and the `socket.io` dependency and its packages in `package-lock.json`; updated the rules and docs. |
| 2026-10-20 | At the user's request, wrote the data model from the prototype: 11 Sequelize models, `models/index.js`, all associations, the full schema in `data/db.sql`, `docs/data-model.md`, and the ERD in `docs/der/`. A script confirmed that the models load and match `db.sql`. |
| 2026-10-20 | At the user's request, built the **auth and users** module, modeled on `economix-api`, and updated the rules and skills to the conventions it established. **Code:** `POST /register`, `POST /login`, `GET`, `PUT` and `DELETE /users/@me`, `PUT /users/@me/password`, with `AuthMiddleware` (JWT, reloads the user, blocks inactive users), `roleMiddleware`, user, vehicle-assignment and trip repositories, auth and user services, shared Zod fields, `utils.error` and `utils.sendError`, and Swagger schemas. **Fixes:** the schema middleware keeps the parsed body, the logger masks passwords, `private.auth` uses `id`, and a failed database connection exits with 1. **Tests:** a `globalSetup` recreates `rotarix_test` from `db.sql`, with a guard on the name; CI now uses `rotarix_test`. 31 tests (28 integration, 3 unit) **pass against the user's local MySQL**, which also validated `db.sql` for the first time. |
| 2026-10-20 | Removed `users.fleet_id` at the user's request: a driver's fleet is now derived from their vehicle assignments, a single source of truth. Updated the model, associations, anonymization, `db.sql`, the Swagger `User` schema, the ERD (source, PNG, SVG) and the docs. |

## What exists

| Files | State |
|---|---|
| `src/index.js`, `src/app/index.js` | Bootstrap with dotenv, Express, CORS, JSON and an HTTP server. Exports the app. The server wasn't started; the app is exercised through Supertest. |
| `src/app/routes/`, `controllers/`, `services/`, `repositories/` | Auth and users module, tested. The vehicle-assignment and trip repositories only have the methods account deletion needs. |
| `src/app/middlewares/` | auth (JWT), role, schema (Zod), logger (masks passwords), private.auth (localhost only). |
| `src/app/config/swagger.js` | `/api-docs`, OpenAPI 3, bearer scheme, shared schemas; documents the 6 auth and users operations. |
| `src/app/database/`, `data/db.sql`, `docs/der/` | 11 models, the full schema and the ERD (`docs/data-model.md`). The schema runs on MySQL 8 (test setup) and awaits approval. |
| `src/tests/` | `globalSetup` builds `rotarix_test`; integration tests for auth and users, a unit test for `roleMiddleware`, and `user.util.js` fixtures. |
| `docker-compose.yml`, `.github/workflows/test.yml` | MySQL 8, plus a CI pipeline (install, then Jest against `rotarix_test`). A CI run hasn't been observed yet. |

## Missing

- Every domain except accounts: fleets, vehicles, drivers and assignments, trips, odometer readings, expenses, refueling, maintenance, service alerts, metrics and the activity feed.
- Image uploads and storage (RNF05, RN08).
- Managers creating drivers with a temporary password (S12). It belongs to the drivers module, not to sign-up.
- No React Native/Expo app in this checkout.
- No evidence of redundant infrastructure, performance tests or client acceptance.

## Known issues

| Severity | Issue |
|---|---|
| High | `data/db.sql` starts with `DROP DATABASE IF EXISTS rotarix`. Only the test setup runs it automatically, and only against `*_test`. Run by hand, it wipes `rotarix`. |
| High | `private.auth.middleware.js` checks only for a localhost IP, so behind a reverse proxy on the same host every request passes. No route uses it yet. |
| Medium | JWTs can't be revoked. After a password change or logout, old tokens stay valid until they expire (7 days). Deleted and deactivated users are still rejected, because the middleware reloads the user. |
| Medium | There's no rate limiting on `POST /login`. |
| Low | `src/index.js` calls `console.clear()` on import, and dotenv 17 logs an "injected env" line for each test file. `express.static('./src/app/public')` points to a folder that doesn't exist. `@jest/test-sequencer` is in `dependencies` instead of `devDependencies`. |
| Info | There's no evidence of TLS or recovery. The production URL in Swagger is configuration only. |

## Validation and limits

- `npm test`: 31 tests passed on 2026-10-20, against `rotarix_test` on the user's local MySQL with the credentials from `.env`.
- The Swagger annotations parse (`swagger-jsdoc`, `failOnErrors`).
- The HTTP server wasn't started, and the app wasn't tested with the mobile client.

## Recommended plan

This is a recommendation, not an approved schedule. The user sets the priorities. Location tracking, chat and offline mode aren't included by inference.

1. Answer P07 (managers, companies and ownership, together with the rest of P06), P12 (finishing a trip after the driver is deactivated), P17–P19 (how maintenance and fuel count as expenses, and the vehicle for records outside a trip) and P22 (account deletion during a trip). Get the missing flows designed (P20). Record whether the client validated the prototype (P16).
2. Approve the data model (`data-model.md`) and the auth choices listed in `decisions.md`.
3. Build fleets, vehicles, drivers (including manager-created drivers) and assignments (S06–S14, M01–M09), with permission tests and the effects of deactivation and deletion (D11–D13, D24).
4. Build image storage, then trips and odometer readings (S25–S30, M12–M13, M18; RN06–RN08, D20), with concurrency safety and mandatory photos.
5. Build expenses, refueling and maintenance (S31–S35, M10–M11; D19, D21) and service alerts (P09). Then the manager metrics and activity feed (S04–S05, S15–S18; D16).
6. Integrate the mobile app, validate the flows with the manager and drivers, and check performance, recovery and the acceptance criteria before delivery.
