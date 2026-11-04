# Progress

The state of this checkout, last updated 2026-11-03. It doesn't cover other repositories or deployed services.

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
| 2026-10-30 | At the user's approval, implemented Fleet (D28) using the existing schema/models; confirmed shared manager access in a single company (D27, P07). Added 8 endpoints, Swagger, 115 Fleet integration tests and 3 schema middleware regression tests. Final isolated Docker run: 149/149 tests passed in 5 suites. No main-database access or schema changes. Environment caveats are recorded below. |
| 2026-11-02 | Repaired local test infrastructure under D29: added the opt-in `mysql-test` service to the existing Compose file, reusing MySQL 8 and repository credentials; changed only the port in `.env.test` to 13306. Native Windows `npm run test` passed all 149 tests in 5 suites with default timeout. Development resources and all source/schema/model/test/package/Jest files were verified unchanged against the pre-task snapshot. |
| 2026-11-03 | At the user's correction (D30), restored local development/test execution on the existing `mysql-container` at port 3306. Restored missing `.env`, corrected `.env.test` to actual existing credentials, and restricted setup to exactly `rotarix_test`. With explicit approval (D31), provisioned only missing `rotarix` from unchanged table definitions without DROP. Native `npm run test`: 149/149 passed with default timeout. `npm start`: HTTP 3000, Swagger 200 and successful database read via API. Removed only the obsolete disposable test container/profile; shared container and volumes preserved. |

## Current local environment (2026-11-03)

- Investigation: `.env` was absent, so `npm start` lacked its HTTP port and development connection; `.env.test` still selected the second-instance port. The existing `mysql-container` on port 3306 authenticates with credentials different from the repository's original test placeholders. Environment files were corrected privately to the server's actual credentials; no server account, password or grant was changed.
- Both environments now use `localhost:3306`: `.env` / `rotarix` for development and `.env.test` / exactly `rotarix_test` for integration tests. `.env` remains ignored by Git, with a valid `SERVER_PORT` and a local JWT secret. `.env.example` stays a template; no secrets were copied into documentation or command output.
- The development database was absent. The user explicitly authorized creating `rotarix` from existing table definitions, with no DROP (D31). Created 11 tables, no initial records; no existing database was reset or overwritten and `data/db.sql` was not modified.
- The only source adjustment is the test setup's safety guard: it refuses any database other than `rotarix_test` before connecting. Verified rejection of both `rotarix` and another `_test` name without a connection attempt. No application logic, models, relationships, test cases, Jest configuration, package scripts or dependencies changed.
- Validation on Windows: **149/149 tests in 5/5 suites passed in 28.104 s** using the original `npm run test` and default timeout. Both environment files point to the same existing server on port 3306. Server UUID verification confirmed the intended target.
- Actual `npm start` launched on HTTP port 3000; `/api-docs/` returned 200. A login request for a randomly generated nonexistent account returned `401 invalid_credentials`, confirming a database read through the API without creating or modifying records. Only the API process started for verification was stopped afterward; the HTTP port was confirmed free for the user.
- Read-only fingerprints of all development table definitions and rows matched before/after tests and HTTP verification (11 tables, zero records). The shared MySQL container's ID, image, start time and volume mounts matched the original snapshot. Its observed runtime version is 26.7.0; the existing server/image was not replaced to match the legacy MySQL 8 Compose scaffold.
- Removed the obsolete profile/anchors and restored `docker-compose.yml` to its original definition. After successful validation on port 3306, inspected and removed only `api-mysql-test-1`: its labels identified the old test service, its data was on tmpfs, and it had no named-volume or bind mounts. No volume was removed. Do not run this checkout's Compose commands to adopt/recreate the existing container managed by another project.
- Current commands: `npm start` and `npm run test` in separate clean terminals, with the existing `mysql-container` running. See [`../rules/testing.md`](../rules/testing.md). Changes to development data/schema beyond the initial authorized provisioning still require approval.

## Historical local test infrastructure (2026-11-02; superseded by D30)

The following records describe the previous verified environment, not the current startup instructions.

- Root cause: local port 3306 was occupied by another Compose project's `mysql-container`, whose configured root password differs from Rotarix's test credentials. Read-only authentication checks confirmed access from the Docker gateway with that container's credentials and a `root@%` account; this was a credential/target mismatch, not a missing remote-root grant. No existing server credentials or grants were changed.
- Reused the existing `docker-compose.yml`: YAML anchors share the development MySQL 8 image and credential definitions with `mysql-test`. The test service is opt-in (`profiles: [test]`), publishes only `127.0.0.1:13306`, creates `rotarix_test`, and keeps its data on disposable tmpfs. It has no development bind/named-volume mounts. The resolved development service and volume definitions are identical to the pre-task configuration.
- Only `MYSQL_PORT` changed in `.env.test`; all other settings and credentials stayed unchanged. No parallel Compose files, launcher scripts, package scripts, dependencies, Jest settings, test setup changes or test-case changes were introduced.
- Startup: `docker compose --profile test up -d --wait mysql-test`. The healthcheck authenticates over TCP against `rotarix_test`, avoiding premature readiness during MySQL initialization. This targeted command does not start/recreate the development service.
- Before testing, verified that the server UUID reached from Windows using `.env.test` matches the dedicated container's server UUID. The database is `rotarix_test`, MySQL is 8.0.46, storage is tmpfs, and no inherited connection overrides were present.
- Validation: **149/149 tests in 5/5 suites passed in 41.054 s**, running the original `npm run test` natively on Windows (Node v26.13.0, Jest 30.4.2). Default Jest timeout and all tests were preserved; no Docker Node runner, temporary source copy or runtime workaround was needed.
- Post-run comparisons confirmed unchanged source, tests/setup, SQL, models, relationships, ERD, package files and Jest config. The existing MySQL container's ID, image, start time and mounts were unchanged. Only the isolated test database was reset by the existing Jest setup.
- The test service is left healthy/running so `npm run test` can be repeated. Stop only it with `docker compose --profile test stop mysql-test`; tmpfs test data is disposable. Do not use project-wide volume removal. See [`../rules/testing.md`](../rules/testing.md) for environment-override handling and CI behavior.

## Fleet implementation (2026-10-30)

Approved scope: S06–S08, M01–M03, RF04/UC02/RN02/RN05 and D10–D13/D23, with single-company shared manager access (D27) and explicit implementation approval (D28).

- Eight manager-only endpoints: `POST /fleets`, `GET /fleets`, `GET /fleets/:id`, `PUT /fleets/:id`, `PATCH /fleets/:id/status`, `DELETE /fleets/:id`, `GET /fleets/:id/vehicles`, `GET /fleets/:id/drivers`.
- New Fleet repository/service/controller/routes; read-only Vehicle repository and targeted extensions to user, trip and assignment repositories. No vehicle/driver/assignment write endpoints were added.
- Literal name search (including numeric names and SQL wildcard characters), status filtering (default `all`), distinct driver counts and ongoing-trip counts; soft-deleted vehicles/users are excluded from display/counts. Fleet vehicle rows expose every assigned driver summary; no arbitrary primary driver is selected.
- Create defaults to active; ordinary editing cannot change status. Status transitions are idempotent and retain links and ongoing trips.
- Editing, status changes and deletion lock Fleet within unmanaged transactions. Deletion checks the exact current name, locks affected vehicles in ID order (including soft-deleted rows), removes only their assignments and hard-deletes Fleet. Existing `ON DELETE SET NULL` unlinks the vehicles. Trips, expenses, photos, readings, refuelings and maintenances remain untouched. Failures roll back the transaction.
- Schema middleware accepts optional parameter schemas and text query exceptions while preserving existing scalar numeric-query behavior. Full Swagger contracts and integration/regression tests were added.
- Existing schema, models, associations, ERD and package lock were preserved. Financial metrics/S08 Resumo and other module implementations remain out of scope.
- Verification: 149 tests passed in 5 suites (115 Fleet tests, 3 new schema middleware tests and 31 existing tests). Final command: `npm test -- --testTimeout=30000`; Node 22 Alpine and MySQL 8.0.46 in temporary Docker containers, using only `rotarix_test`. Code/config/schema were copied unchanged from a read-only workspace mount into the runner's temporary filesystem. The main database was not accessed.

Integration obligations for future modules: Fleet deactivation is persisted here; the future trip-start service must check active Fleet status under a compatible lock to enforce RF04/M02. Vehicle/assignment writers must lock Fleet before vehicles in deterministic ID order to coordinate with deletion. P12 still governs completion after assignment removal or account deactivation. These future behaviors are not implemented by this module.

## What exists

| Files | State |
|---|---|
| `src/index.js`, `src/app/index.js` | Bootstrap with dotenv, Express, CORS, JSON and an HTTP server. Exports the app. The server wasn't started; the app is exercised through Supertest. |
| `src/app/routes/`, `controllers/`, `services/`, `repositories/` | Auth/users and Fleet modules. Vehicle, assignment, trip and user repositories include the targeted reads/cleanup needed by Fleet; other domain APIs remain absent. |
| `src/app/middlewares/` | auth (JWT), role, schema (Zod), logger (masks passwords), private.auth (localhost only). |
| `src/app/config/swagger.js` | `/api-docs`, OpenAPI 3, bearer scheme and shared schemas; documents 6 auth/users and 8 Fleet operations. |
| `src/app/database/`, `data/db.sql`, `docs/der/` | 11 models, the full schema and the ERD (`docs/data-model.md`). The schema runs on MySQL 8 (test setup) and awaits approval. |
| `src/tests/` | Guarded test-database setup; auth/users/Fleet integration tests, role/schema middleware tests and user/Fleet fixtures. |
| `docker-compose.yml`, `.github/workflows/test.yml` | MySQL 8, plus a CI pipeline (install, then Jest against `rotarix_test`). A CI run hasn't been observed yet. |

## Missing

- Domain APIs beyond accounts and Fleet: vehicles, drivers and assignments, trips, odometer readings, expenses, refueling, maintenance, service alerts, metrics and the activity feed.
- Image uploads and storage (RNF05, RN08).
- Managers creating drivers with a temporary password (S12). It belongs to the drivers module, not to sign-up.
- No React Native/Expo app in this checkout.
- No evidence of redundant infrastructure, performance tests or client acceptance.

## Known issues

| Severity | Issue |
|---|---|
| High | `data/db.sql` starts with `DROP DATABASE IF EXISTS rotarix`. Only the guarded test setup runs it automatically, rewriting database statements to exactly `rotarix_test`. Run by hand, it wipes `rotarix`. |
| High | `private.auth.middleware.js` checks only for a localhost IP, so behind a reverse proxy on the same host every request passes. No route uses it yet. |
| Medium | JWTs can't be revoked. After a password change or logout, old tokens stay valid until they expire (7 days). Deleted and deactivated users are still rejected, because the middleware reloads the user. |
| Medium | There's no rate limiting on `POST /login`. |
| Low | `src/index.js` calls `console.clear()` on import, and dotenv 17 logs an "injected env" line for each test file. `express.static('./src/app/public')` points to a folder that doesn't exist. `@jest/test-sequencer` is in `dependencies` instead of `devDependencies`. |
| Info | There's no evidence of TLS or recovery. The production URL in Swagger is configuration only. |

## Validation and limits

- **2026-11-03:** native Windows `npm run test` passed all 149 tests in 5 suites in 28.104 s on the existing MySQL at port 3306, with default timeout. Actual `npm start`, HTTP port and database read verified. Development data/structure unchanged since the explicitly authorized initial creation; shared container/volume identities preserved. Prior second-container instructions are superseded by D30.
- **2026-11-02:** native Windows `npm run test` passed 149/149 tests in 5 suites against the dedicated Compose test service, with the original command and default timeout. The 2026-10-30 Windows/runtime limitations below are historical and were not reproduced in the current installed environment. Connection identity, test storage isolation, preserved credentials and development resources were checked before/after execution; `git diff --check` passed.
- **2026-10-30:** all 149 tests passed in 5 suites (46.268 s) in the isolated Docker environment described above. This covers shared manager access, driver/inactive-account denial, validation, distinct counts, relationship reads, lifecycle transitions, exact-name confirmation, history preservation, rollback on injected database failure and concurrent rename/delete operations. Auth/users regressions passed.
- **Environment caveats:** Node was unavailable on PATH, so a portable Node runtime was used for static checks. Native Windows Jest startup failed loading `unrs-resolver`'s Windows binding (`ERR_DLOPEN_FAILED`, error 126). The first Docker run against the direct workspace mount passed 148/149 tests; one existing auth test exceeded the default 5-second timeout. The final full run used a temporary local copy and the CLI-only 30-second timeout above. No Jest configuration or dependency-version changes were made.
- **2026-10-30 static checks:** JavaScript syntax checked; Swagger parsed with `failOnErrors`, all 8 Fleet operations and 71 local references validated. `git diff --check` passed. SQL, models, associations, ERD and `package-lock.json` are unchanged.
- `npm test`: 31 tests passed on 2026-10-20, against `rotarix_test` on the user's local MySQL with the credentials from `.env`.
- The Swagger annotations parse (`swagger-jsdoc`, `failOnErrors`).
- The HTTP server wasn't started, and the app wasn't tested with the mobile client.

## Recommended plan

This is a recommendation, not an approved schedule. The user sets the priorities. Location tracking, chat and offline mode aren't included by inference.

1. P07 is resolved by D27. Answer the remaining P06 (self-registered drivers), P12 (finishing a trip after the driver is deactivated), P17–P19 (how maintenance and fuel count as expenses, and the vehicle for records outside a trip) and P22 (account deletion during a trip). Get the remaining missing flows designed (P20). Record whether the client validated the prototype (P16).
2. Approve the data model (`data-model.md`) and the auth choices listed in `decisions.md`.
3. Fleet was authorized and implemented separately (D28). Build vehicles, drivers (including manager-created drivers) and assignments (S09–S14, M04–M09) only after authorization, with permission tests and lifecycle effects (D11–D13, D24).
4. Build image storage, then trips and odometer readings (S25–S30, M12–M13, M18; RN06–RN08, D20), with concurrency safety and mandatory photos.
5. Build expenses, refueling and maintenance (S31–S35, M10–M11; D19, D21) and service alerts (P09). Then the manager metrics and activity feed (S04–S05, S15–S18; D16).
6. Integrate the mobile app, validate the flows with the manager and drivers, and check performance, recovery and the acceptance criteria before delivery.
