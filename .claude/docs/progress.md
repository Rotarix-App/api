# Progress

The state of this checkout, last updated 2026-11-16. It doesn't cover other repositories or deployed services.

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
| 2026-11-03 | On the `Frotas` branch, a teammate built the **fleets** module (S06–S08, M01–M03; RF04, RN02, RN05, D10–D13, D23): 8 manager-only endpoints, Swagger, 115 integration tests and 3 unit tests for `SchemaParserMiddleware`, which now validates path params. The test setup now accepts only `rotarix_test`. |
| 2026-11-04 | At the user's request, reviewed and fixed the `Frotas` branch. Restored `.env.test` and the docs that described one developer's machine. Removed D27–D31, which hadn't been confirmed by the user, and put their content back as open questions and proposals (P07 stays open). Added `tripDriver` to the fleet's vehicle rows (S08 shows who is driving), moved the id param schema to `utils/schemas.js` and formatted the fleet controller and vehicle repository like the reference module. **149 tests passed** against `rotarix_test` on the user's local MariaDB 11.7. |
| 2026-11-04 | The user decided D27 (resolves P07): a manager only accesses the fleets they created. Added `fleets.manager_id` (FK users) to the model, `db.sql` (now `users` is created before `fleets`) and `der.mmd`; every fleet endpoint is scoped to the signed-in manager, and another manager's fleet gives 404. **157 tests passed** on the user's local MariaDB 11.7. `der.png` and `der.svg` weren't regenerated (the Mermaid CLI run wasn't allowed in that session). Opened P23 (a deleted manager's fleets) and narrowed P06. |
| 2026-11-04 | On `feat/vehicles`, at the user's request: the manager's **vehicles** module (S09–S10, M04–M06) with `POST /vehicles` and `GET`, `PUT`, `PATCH .../status` and `DELETE /vehicles/:id`, the odometer-reading repository, Swagger and 83 integration tests; one more fleet test covers the blocked deletion. The user decided D28–D31: deleting a fleet now deletes its vehicles and is blocked during a trip; an inactive fleet makes its vehicles unavailable; deleting a vehicle on a trip is blocked; the odometer can only go up. `GET /fleets/:id/vehicles` now returns `available`. **241 tests passed** three times in a row on the user's local MariaDB 11.7. |
| 2026-11-11 | On the `Motorista` branch (merged 2026-11-16), a teammate built the driver module with **D38**, explicitly superseding D32 and the direct ownership/email-link portions of D35. Removed users.manager_id and its self-associations; preserved fleets.manager_id, D13 and vehicle assignments. Driver CRUD/list/search/status is shared among managers, including unassigned/self-registered drivers. PUT/DELETE /drivers/:id/assignments protects existing fleet ownership, requires explicit owner release before cross-manager transfer and preserves ongoing trips. Added transaction rollback/concurrency tests. Preserved D24/D34/D36; prepared opt-in D33 own-trip completion/cancellation middleware without creating trip routes. D37 history serialization now emits only Motorista removido, including nested trip users; request logs contain no raw URL/body/query. Added a manual reviewable migration, not executed on development. Diagnosed the test authentication failure as another Compose project's persistent MySQL instance on port 3306; verified credentials through read-only connections and configured an ignored local test override. Shared setup/bootstrap configuration still refuses every database except rotarix_test. **Final validation: 299 passed, 0 failed, 10 suites**, npm run test -- --testTimeout=60000; Swagger parsed and git diff --check passed. Earlier runs hit intermittent local 5/15-second fixture timeouts; a nested-history serialization failure was corrected before the final run. No production/development reset, credential change, volume deletion or commit. |
| 2026-11-16 | At the user's request, reviewed the merged `Motorista` delivery. Removed the committed `.env.test.local` (another developer's credentials, which broke `npm test`), restored `docker-compose.yml` and `.env.example`, and deleted the machine-specific migrations and `testing-database.md`. Restored `utils.logError` (the new version logged raw `sqlMessage`, which can contain emails). Removed requirement IDs from Swagger and test names. Decisions D32–D38 had been recorded as confirmed without the user: the user confirmed D32–D37 and D39 and rejected D38 (shared registry). Implemented D32 again: `users.manager_id` (schema, model, associations, der.mmd), every driver endpoint scoped to the responsible manager (404 otherwise), `POST /drivers/link` by exact email, release clears the manager (D35), 409 `driver_inactive` (D39), `tripStatus` stays `in_progress` after deactivation during a trip (D33). Added tests for edit validation, duplicate email, status/confirmation validation, linking (including a concurrent link) and inactive assignment. **315 passed, 10 suites** with `MYSQL_PASSWORD= npm test` on the local MySQL; Swagger parses with `failOnErrors`. |
| 2026-11-16 | At the user's request, compared the implemented endpoints with the Figma (S01–S03, S06–S14, S19–S20, S36–S37, M01–M09, M14–M17, M19–M21). Fields, filters, counts, statuses and messages match. Fixed `DELETE /users/@me`, which now requires `confirmation: "EXCLUIR"` as M15/M17 and D23 require (400 `invalid_schema` or `confirmation_mismatch`). `User.toJSON` no longer exposes `managerId`. Recorded the prototype gaps as P24. **317 passed, 10 suites**; Swagger parses. |
| 2026-11-16 | At the user's request, built the driver's **trips** module against the Figma (S21–S22, S25–S30, M12–M13, M18) and the **photo upload** it needs. The user decided D40 (separate upload, local disk) and D41 (trip total = expenses + refuelings). **Code:** `POST /photos` and `GET /photos/:id` (multer, type detected from the bytes, UUID keys under `UPLOAD_DIR`); `POST` and `GET /trips`, `GET /trips/current`, `GET /trips/:id` (records and S30 summary), `POST /trips/:id/photos`, `/finish` and `/cancel`, the last three open to the D33 restricted session. Start and finish lock driver, fleet, vehicle and trip rows before checking RN06/RN07 and write the odometer reading and `current_odometer` in the same transaction. Added `multer`. **Tests:** 12 photo and 41 trip integration tests, including two concurrent starts on one vehicle and a driver deactivated mid-trip. **370 passed, 12 suites** with `MYSQL_PASSWORD= npm test`; the trips suite passed two more times; Swagger parses with `failOnErrors`. |

## What exists

2026-11-16 update (D32): each driver belongs to one responsible manager (S11–S14/M07–M09).


| Files | State |
|---|---|
| `src/index.js`, `src/app/index.js` | Bootstrap with dotenv, Express, CORS, JSON and an HTTP server. Exports the app. The server wasn't started; the app is exercised through Supertest. |
| `src/app/routes/`, `controllers/`, `services/`, `repositories/` | Auth/users, fleets, vehicles, drivers, trips and photos. Drivers are scoped to their responsible manager (D32); assignment writes protect fleet ownership (D27) and ongoing trips. |
| `src/app/middlewares/` | JWT/roles/Zod; opt-in restricted own-trip completion middleware (D33), private.auth. Logger records only route templates, method/status (D37). |
| `src/app/config/swagger.js` | `/api-docs`, OpenAPI 3, bearer scheme, auth/users/fleet/vehicle/driver operations and shared schemas. `POST /drivers/link` links a driver without a manager by email. |
| `src/app/database/`, `data/db.sql`, `docs/der/` | 11 models, the full schema and the ERD (`docs/data-model.md`). The schema runs on MySQL 8 (test setup) and awaits approval. |
| `src/tests/` | Guarded globalSetup builds only rotarix_test; auth/user/fleet/vehicle/driver integrations; role/schema/auth/environment/logger unit tests. Shared loader supports ignored local test credentials. |
| `docker-compose.yml`, `.github/workflows/test.yml` | MySQL 8, plus a CI pipeline (install, then Jest against `rotarix_test`). A CI run hasn't been observed yet. |

## Missing

- The fleet Resumo tab (S08, fleet-scoped metrics), which depends on trips and expenses.
- The vehicle service alert (S10), which waits for P09. The driver's vehicle views (S23–S24) belong to the driver views.
- The driver's vehicle list and detail (S23–S24). S25 needs it to choose the vehicle; until then the app has no endpoint listing the driver's assigned vehicles with availability.
- Expense/refueling/maintenance endpoints (the trip detail already reads expenses and refuelings), service alerts, metrics and the activity feed, including the manager's trip view with odometer photos (S18; `GET /photos/:id` is uploader-only for now). Driver CRUD and assignment management are implemented (D32). Odometer persistence already supports vehicle management.
- Backups or object storage for photos (RNF04–RNF05); they live on the API host's disk (D40).
- No React Native/Expo app in this checkout.
- No evidence of redundant infrastructure, performance tests or client acceptance.

## Known issues

| Severity | Issue |
|---|---|
| High | `data/db.sql` starts with `DROP DATABASE IF EXISTS rotarix`. Only the test setup runs it automatically, and only against `*_test`. Run by hand, it wipes `rotarix`. |
| Low | `docs/der/der.png` and `der.svg` predate `users.manager_id`; regenerate them from `der.mmd`. |
| Medium | Photos uploaded but never linked to a record stay on disk; there's no cleanup job. Photo files have no backup (P15). |
| Low | `GET /trips` has no pagination; the history grows without limit. |
| Low | `POST /trips/:id/finish`, `/cancel` and `/photos` answer 404 `trip_not_found` (not 403) to managers and for trips already ended, because `forTripAction` only lets the driver of the trip in progress through. |
| Open | A deleted manager's drivers keep pointing at that manager, so no one can manage them (P23). |
| High | `private.auth.middleware.js` checks only for a localhost IP, so behind a reverse proxy on the same host every request passes. No route uses it yet. |
| Medium | JWTs can't be revoked. After a password change or logout, old tokens stay valid until they expire (7 days). Deleted and deactivated users are still rejected, because the middleware reloads the user. |
| Medium | There's no rate limiting on `POST /login`. |
| Low | `src/index.js` calls `console.clear()` on import, and dotenv 17 logs an "injected env" line for each test file. `express.static('./src/app/public')` points to a folder that doesn't exist. `@jest/test-sequencer` is in `dependencies` instead of `devDependencies`. |
| Info | There's no evidence of TLS or recovery. The production URL in Swagger is configuration only. |

## Validation and limits

- 2026-11-11: `npm.cmd run test -- --testTimeout=60000`: **299 passed, 0 failed, 10 suites**, 237.456 seconds, against only rotarix_test on the running local MySQL. Default Jest test timeout is 15 seconds; the final local run explicitly used 60 seconds because legacy login/password/fleet fixtures intermittently exceeded 15 seconds. Assertions, bcrypt cost and database integrity checks were preserved. This is not an RNF01 performance certification or a MySQL 8 CI run.
- Future trip endpoints must explicitly opt into `AuthMiddleware.forTripAction('finish' | 'cancel')` and repeat ownership/status checks within their write transaction. No current route permits inactive users. Upload/storage remains unimplemented; enforce D37 opaque storage keys there. Personal information printed in receipt/invoice images remains open (P14); P22 self-deletion and P23 manager-owned orphan fleets were not resolved by inference.

- `npm test`: 241 tests passed three times on 2026-11-04 on `feat/vehicles`, against `rotarix_test` on the user's local MariaDB 11.7 with the credentials from `.env`. CI (MySQL 8) hasn't been observed for this branch.
- `npm test`: 157 tests passed on 2026-11-04 on the `Frotas` branch (after D27), against `rotarix_test` on the user's local MariaDB 11.7 (a Windows service, not the Docker MySQL 8) with the credentials from `.env`. CI (MySQL 8) hasn't been observed for this branch.
- `npm test`: 31 tests passed on 2026-10-20, against `rotarix_test` on the user's local MySQL with the credentials from `.env`.
- The Swagger annotations parse (`swagger-jsdoc`, `failOnErrors`).
- The HTTP server wasn't started, and the app wasn't tested with the mobile client.

## Recommended plan

This is a recommendation, not an approved schedule. The user sets the priorities. Location tracking, chat and offline mode aren't included by inference.

1. P06 is resolved by D32. D33/D35 resolve the restricted-session/assignment portions of P12, now enforced by the trip routes. Answer P23, P17–P19 and the remaining self-deletion portion of P22; design remaining P20 flows and record prototype validation (P16).
2. Approve the data model (`data-model.md`) and the auth choices listed in `decisions.md`.
3. Integrate the implemented fleet, vehicle, driver and assignment endpoints with S06–S14/M01–M09, including their lifecycle rules and transfers by release and link (D35).
4. ~~Build image storage, then trips~~ (done 2026-11-16). Next: the driver's vehicles (S23–S24), which S25 needs to pick a vehicle.
5. Build expenses, refueling and maintenance (S31–S35, M10–M11; D19, D21) and service alerts (P09). Then the manager metrics and activity feed (S04–S05, S15–S18; D16).
6. Integrate the mobile app, validate the flows with the manager and drivers, and check performance, recovery and the acceptance criteria before delivery.

## Files changed for drivers and test infrastructure (2026-11-11, revised 2026-11-16)

- Driver CRUD/assignments: `src/app/controllers/driver.controller.js`, `src/app/routes/driver.routes.js`, `src/app/repositories/driver.repository.js`, `src/app/services/driver.service.js`, `src/app/repositories/vehicle-assignment.repository.js`, `src/app/config/swagger.js`.
- Restricted access/history/privacy: `src/app/middlewares/auth.middleware.js`, `src/app/middlewares/logger.middleware.js`, `src/app/services/auth.service.js`, `src/app/services/fleet.service.js`, `src/app/services/vehicle.service.js`, `src/app/repositories/trip.repository.js`, `src/app/repositories/vehicle.repository.js`, `src/app/database/models/user.js`, `src/app/database/models/trip.js`, `src/app/utils/user-history.js`.
- Test configuration/safety: `src/config/environment.js`, `src/index.js`, `jest.config.js`, `src/tests/setup/database.js`, `src/tests/setup/global.js`, `src/tests/sequencer.js`, `.gitignore`. `.env.test.local` is optional, private and must never be committed.
- Tests: `src/tests/entrypoints/drivers/drivers.test.js`, `src/tests/unit/auth.middleware.test.js`, `src/tests/unit/environment.test.js`, `src/tests/unit/logger.middleware.test.js`.
- DER: `docs/der/der.mmd` has `users.manager_id` again (2026-11-16); the PNG/SVG still need regenerating.
- Memory/docs: `.claude/CLAUDE.md`, `.claude/docs/data-model.md`, `.claude/docs/decisions.md`, `.claude/docs/requirements-analysis.md`, `.claude/docs/progress.md`, `.claude/rules/architecture.md`, `.claude/rules/data-layer.md`, `.claude/rules/domain.md`, `.claude/rules/http-layer.md`, `.claude/rules/testing.md`. Official sources remain unchanged.
