# Progress

The state of this checkout, last updated 2026-11-14. It doesn't cover other repositories or deployed services.

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
| 2026-11-11 | At the user's request, corrected the unfinished driver module with **D38**, explicitly superseding D32 and the direct ownership/email-link portions of D35. Removed users.manager_id and its self-associations; preserved fleets.manager_id, D13 and vehicle assignments. Driver CRUD/list/search/status is shared among managers, including unassigned/self-registered drivers. PUT/DELETE /drivers/:id/assignments protects existing fleet ownership, requires explicit owner release before cross-manager transfer and preserves ongoing trips. Added transaction rollback/concurrency tests. Preserved D24/D34/D36; prepared opt-in D33 own-trip completion/cancellation middleware without creating trip routes. D37 history serialization now emits only Motorista removido, including nested trip users; request logs contain no raw URL/body/query. Added a manual reviewable migration, not executed on development. Diagnosed the test authentication failure as another Compose project's persistent MySQL instance on port 3306; verified credentials through read-only connections and configured an ignored local test override. Shared setup/bootstrap configuration still refuses every database except rotarix_test. **Final validation: 299 passed, 0 failed, 10 suites**, npm run test -- --testTimeout=60000; Swagger parsed and git diff --check passed. Earlier runs hit intermittent local 5/15-second fixture timeouts; a nested-history serialization failure was corrected before the final run. No production/development reset, credential change, volume deletion or commit. |

## What exists

2026-11-11 update (D38): drivers and assignments S11–S14/M07–M09 now use a shared registry. Detailed diagnosis is in [testing-database.md](testing-database.md).

2026-11-14: Diagnosed the Fleets 500s against the development connection configured by `.env`: `rotarix` on `localhost:3306`, served by `mysql-container` (`mysql:latest`, not this repository's `mysql:8.0` Compose service). The live `fleets` table lacked `manager_id`; `users.manager_id` was absent as D38 requires, while `vehicles.fleet_id` and `vehicle_assignments` remained. The owner of the only existing fleet was confirmed by the user. Prepared and applied `data/migrations/2026-11-14-restore-fleet-manager.sql` after validating a database backup; restored `fleets.manager_id` and its FK without changing existing fleet/user/vehicle/assignment rows or adding `users.manager_id`. Development API checks passed: register/login, fleet create/list/show/update, deactivate/reactivate, and cross-manager GET/PUT/PATCH returned 404; expired JWT returned 401. The temporary fleet was deleted and the test manager anonymized. **299 tests passed** on `rotarix_test`. |

| Files | State |
|---|---|
| `src/index.js`, `src/app/index.js` | Bootstrap with dotenv, Express, CORS, JSON and an HTTP server. Exports the app. The server wasn't started; the app is exercised through Supertest. |
| `src/app/routes/`, `controllers/`, `services/`, `repositories/` | Auth/users, fleets, vehicles and drivers. Driver profile CRUD is shared; assignment writes protect fleet ownership (D38/D27) and ongoing trips. |
| `src/app/middlewares/` | JWT/roles/Zod; opt-in restricted own-trip completion middleware (D33), private.auth. Logger records only route templates, method/status (D37). |
| `src/app/config/swagger.js` | `/api-docs`, OpenAPI 3, bearer scheme, auth/users/fleet/vehicle/driver operations and shared schemas. Direct driver-link endpoints removed. |
| `src/app/database/`, `data/db.sql`, `docs/der/` | 11 models, the full schema and the ERD (`docs/data-model.md`). The schema runs on MySQL 8 (test setup) and awaits approval. |
| `src/tests/` | Guarded globalSetup builds only rotarix_test; auth/user/fleet/vehicle/driver integrations; role/schema/auth/environment/logger unit tests. Shared loader supports ignored local test credentials. |
| `docker-compose.yml`, `.github/workflows/test.yml` | MySQL 8, plus a CI pipeline (install, then Jest against `rotarix_test`). A CI run hasn't been observed yet. |

## Missing

- The fleet Resumo tab (S08, fleet-scoped metrics), which depends on trips and expenses.
- The vehicle service alert (S10), which waits for P09. The driver's vehicle views (S23–S24) belong to the driver views.
- Trip endpoints, expense/refueling/maintenance endpoints, uploads, service alerts, metrics and the activity feed. Driver CRUD and assignment management are implemented (D38). Odometer persistence already supports vehicle management.
- Image uploads and storage (RNF05, RN08).
- Connecting restricted sessions to future trip finish/cancel routes (D33). `AuthMiddleware.forTripAction` is ready and covered in unit tests; no trip routes were introduced.
- No React Native/Expo app in this checkout.
- No evidence of redundant infrastructure, performance tests or client acceptance.

## Known issues

| Severity | Issue |
|---|---|
| High | `data/db.sql` starts with `DROP DATABASE IF EXISTS rotarix`. Only the test setup runs it automatically, and only against `*_test`. Run by hand, it wipes `rotarix`. |
| Info | The inspected development MySQL container uses `mysql:latest`, while this repository's Compose file specifies `mysql:8.0`; confirm the intended server/image for future environment setup. |
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

1. P06 is resolved by D38. D33/D35 resolve the restricted-session/assignment portions of P12; future trip routes must enforce these under transaction. Answer P23, P17–P19 and the remaining self-deletion portion of P22; design remaining P20 flows and record prototype validation (P16).
2. Approve the data model (`data-model.md`) and the auth choices listed in `decisions.md`.
3. Integrate the implemented fleet, vehicle, driver and assignment endpoints with S06–S14/M01–M09, including their lifecycle rules and protected transfers (D38).
4. Build image storage, then trips and odometer readings (S25–S30, M12–M13, M18; RN06–RN08, D20), with concurrency safety and mandatory photos.
5. Build expenses, refueling and maintenance (S31–S35, M10–M11; D19, D21) and service alerts (P09). Then the manager metrics and activity feed (S04–S05, S15–S18; D16).
6. Integrate the mobile app, validate the flows with the manager and drivers, and check performance, recovery and the acceptance criteria before delivery.

## Files changed for D38 and test infrastructure (2026-11-11)

- Driver CRUD/assignments: `src/app/controllers/driver.controller.js`, `src/app/routes/driver.routes.js`, `src/app/repositories/driver.repository.js`, `src/app/services/driver.service.js`, `src/app/repositories/vehicle-assignment.repository.js`, `src/app/config/swagger.js`.
- Restricted access/history/privacy: `src/app/middlewares/auth.middleware.js`, `src/app/middlewares/logger.middleware.js`, `src/app/services/auth.service.js`, `src/app/services/fleet.service.js`, `src/app/services/vehicle.service.js`, `src/app/repositories/trip.repository.js`, `src/app/repositories/vehicle.repository.js`, `src/app/database/models/user.js`, `src/app/database/models/trip.js`, `src/app/utils/user-history.js`.
- Test configuration/safety: `src/config/environment.js`, `src/index.js`, `jest.config.js`, `src/tests/setup/database.js`, `src/tests/setup/global.js`, `src/tests/sequencer.js`, `.gitignore`; local `.env.test.local` is ignored and must not be committed.
- Tests: `src/tests/entrypoints/drivers/drivers.test.js`, `src/tests/unit/auth.middleware.test.js`, `src/tests/unit/environment.test.js`, `src/tests/unit/logger.middleware.test.js`.
- DER: regenerated `docs/der/der.svg` and `docs/der/der.png` from der.mmd with the local Mermaid browser bundle. Visually checked all eleven tables, fleet manager ownership and the absence of a users manager self-link. Rendering tools were installed only under the OS temporary directory; no project dependency was added.
- Existing database upgrade: `data/migrations/2026-11-11-remove-driver-manager.sql`. Removing the unfinished users manager column/associations restored `data/db.sql`, `src/app/database/models/associations.js` and `docs/der/der.mmd` to their prior model; their lack of a net Git diff does not mean D32 remains implemented.
- Memory/docs: `.claude/CLAUDE.md`, `.claude/docs/data-model.md`, `.claude/docs/decisions.md`, `.claude/docs/requirements-analysis.md`, `.claude/docs/progress.md`, `.claude/docs/testing-database.md`, `.claude/rules/architecture.md`, `.claude/rules/data-layer.md`, `.claude/rules/domain.md`, `.claude/rules/http-layer.md`, `.claude/rules/testing.md`. Official sources remain unchanged.
