# Decisions

Started 2026-10-18. Every entry here is either stated in the official sources, confirmed by the user with a date, or derived from the Figma prototype under D09. A documented decision isn't necessarily implemented.

## Confirmed by the user

| ID | Date | Decision |
|---|---|---|
| — | 2026-10-18 | Build persistent project memory from the three sources, keeping traceability and the official files intact. |
| — | 2026-10-18 | Inspect the code without changing it. Implement features only after a later approval. |
| — | 2026-10-18 | Ask for approval before major architectural decisions and destructive operations. |
| — | 2026-10-20 | Consolidate the agent instructions, rules, skills and memory under `.claude/`, written in English. |
| — | 2026-10-20 | Remove Socket.IO from the project. The API has no real-time channel; don't add one without asking. |
| — | 2026-10-20 | Build the auth and users endpoints and repositories using `economix-api` (the user's earlier API) as the architectural reference, and update the skills to match. |
| — | 2026-10-20 | Integration tests may recreate `rotarix_test` on the user's local MySQL. |
| — | 2026-10-20 | A driver's fleet is **derived from their vehicle assignments** (`vehicle_assignments → vehicles.fleet_id`), not stored: `users` has no `fleet_id`. "One driver, one fleet" (D13) is a rule the service enforces when assignments are saved. |
| **D09** | 2026-10-20 | **The Figma prototype "Rotarix — Protótipo Mobile" (v1.0, 2026-09-26) is the source of truth for functionality**: screens, flows, fields and behavior. Where the official documents diverge, follow the prototype. The official documents still govern non-functional requirements and any rule the prototype doesn't contradict. See [`prototype.md`](prototype.md). |

### Fleet approval and access scope

| ID | Date | Decision | Confirmed by | Resolves |
|---|---|---|---|---|
| D27 | 2026-10-30 | The current version operates as a single company. All active authenticated managers share access to all company fleets and may perform the Fleet operations allowed by RF04/RN02, regardless of creator. No multi-tenancy or schema changes are required. Shared Fleet access was first confirmed on 2026-10-28 and clarified on 2026-10-30. | user | P07 |
| D28 | 2026-10-30 | Implement the Fleet plan approved in this conversation: CRUD, search/filter, distinct counts, status changes, exact-name deletion confirmation, transactional assignment cleanup and read-only vehicle/driver lists. Reuse existing models, schema and architecture. Financial metrics and implementation of other modules are excluded. Follow documented verification against the test database; never reset the main database. | user | Fleet implementation approval; Fleet API reactivation under P20 |

Future review for D27: reconsider this policy before independent companies, restricted manager responsibilities or changes to manager onboarding. The current registration flow lets users choose the manager role; D27 grants each active manager account access to every fleet, including edit, deactivation and typed-confirmation deletion. Verify cross-manager access and driver denial in acceptance tests. Future company isolation requires an approved authorization design, allocation of existing data and a migration plan, rather than simply adding a company column. P06 (visibility of self-registered drivers) is not resolved by this Fleet-only approval.

Approved Fleet contract details (D28): omitted status filter means `all`; name searches use literal substrings, including numeric names and `%`/`_`; counts exclude soft-deleted vehicles/users and count drivers distinctly. `onTripCount` counts currently linked non-deleted vehicles with an ongoing trip. Mutation responses return persisted Fleet fields; list/detail add counts. Status changes are idempotent. Deletion compares the exact current stored name, case and spaces included, under a Fleet row lock. Vehicle rows return all assigned driver summaries rather than choosing one arbitrarily. Relationship writes in future modules must lock Fleet first, then affected vehicles in deterministic ID order; trip start must recheck Fleet status under a compatible lock. This approval does not implement those future writers or resolve P12/P17.

### Local test infrastructure

| ID | Date | Decision | Confirmed by | Resolves |
|---|---|---|---|---|
| D29 | 2026-11-02 | Repair local test execution by reusing Rotarix's existing Docker configuration, credentials, MySQL 8, Jest and test setup. An isolated test instance is allowed when needed. Preserve development data/volumes, schema, models, relationships, business logic and tests; avoid parallel configuration files, credential changes and new dependencies. Validate the connection and full suite, and document results. **The second-container implementation is superseded by D30.** | user | Historical local test environment authorization |
| D30 | 2026-11-03 | Use only the existing `mysql-container` at `localhost:3306`: local `npm start` uses the development database through `.env`, and local `npm run test` uses exactly `rotarix_test` through `.env.test`. Correct environment files to the existing server's actual credentials without changing accounts or passwords. Remove obsolete test infrastructure only after confirming it is disposable and unnecessary. Preserve the shared container/volumes, existing development data, schema definitions, models, relationships, business logic and test cases. Stop for approval before operations that could affect development data. | user | Supersedes D29's separate MySQL service/port |
| D31 | 2026-11-03 | The existing server has no `rotarix` database. Create only that missing development database and its tables from the existing `data/db.sql` definitions, omitting all DROP statements and preserving every other database and volume. | user, explicit response to the provisioning question | Initial development database provisioning |

Historical D29 implementation: a second MySQL service with disposable data and alternate port was verified, then rejected by the user in favor of the existing instance (D30). Its profile/anchors were removed, the repository Compose file was restored, and only the confirmed disposable test container was removed, without removing volumes. Do not reinstate this workflow.

Current D30 implementation: `.env` is local and ignored by Git; `.env.test` selects `rotarix_test`; both connect to the existing instance using its actual credentials. Package scripts and Jest timeout are unchanged. The setup's destructive target guard now accepts exactly `rotarix_test`, rejecting all other names before opening a database connection. The existing container remains managed by its original Compose project; do not recreate it through this checkout's legacy Compose definition. See [`../rules/testing.md`](../rules/testing.md).

## From the official sources

| ID | Decision | Source |
|---|---|---|
| D01 | A mobile app for managers and drivers. The web admin panel and offline mode are out of this version. | TAP 1.10; ER Scope |
| D02 | React Native for Android and iOS, with structured data in MySQL. | ER RNF05–RNF06; PI 3 |
| D03 | Tooling: JavaScript, Expo, Figma, VS Code, Git/GitHub and Swagger. MySQL runs on a self-hosted server. | PI 2–3 |
| D04 | Each user has one immutable role, and operational access is limited by role and assignment. | ER RF01, RN01–RN03 |
| D05 | Unique plates, one fleet per vehicle, one trip in progress per driver and per vehicle, odometer readings that never decrease, and a mandatory odometer photo for each reading. | ER RN04–RN08 |
| D06 | When a driver is deleted, their trip and expense history is kept without identification. | ER RF03, RF06; M09, M17 |
| D07 | Secure communication, protected passwords, linked image storage and redundancy or recovery. | ER RNF02, RNF04, RNF05; TAP 1.13 |
| D08 | Timeline 2026-08-17 → 2026-11-25. The prototype is validated before coding, and development runs in weekly increments. | TAP 1.4; PI 3 |

## From the prototype (under D09)

Screen references (Sxx and Mxx) are explained in [`prototype.md`](prototype.md).

| ID | Decision | Prototype | Resolves or changes |
|---|---|---|---|
| D10 | A fleet has a name, **one** "base or region" field and an optional description. The fleet list has search by name, a status filter, and vehicle, driver and on-trip counts. | S06–S07 | Changes RF04 (base and region were two fields) |
| D11 | A fleet is required when creating or editing a vehicle. A vehicle becomes fleetless only when its fleet is deleted, which also removes the assignments. | S09, M03 | P01 |
| D12 | No link ever blocks deletion. Deleting a fleet unlinks its vehicles and removes assignments; deleting a vehicle keeps its trips, expenses and photos; deleting a driver anonymizes them. Only **deactivating** a vehicle during a trip is blocked. | M03, M05, M06, M09 | P02 |
| D13 | A driver is assigned to **one fleet at a time** and to one or more of its vehicles. A vehicle can have several drivers. Inactive fleets can't be chosen. Saving is the confirmation. The fleet is derived from the assigned vehicles, not stored (2026-10-20). | S11, S13, S14 | Narrows RF07 |
| D14 | Drivers can sign up themselves (S03) or be created by a manager with a **temporary password** that they change later (S12). After creating a driver, the manager goes straight to assignments. | S03, S12 | Partly P06 |
| D15 | Drivers edit their own name, email, phone, CNH number and CNH category. Managers edit their own name, email and phone. Managers also edit driver data through the driver form. | S20, S37, M07 | P05; changes RF03 |
| D16 | Metrics are manager-only. Filters: period (7, 30 or 90 days, or custom) and fleet. Indicators: total spend with the change against the previous period, spend by category, trips, km, cost per km, spend per 5-day bucket, cost per km for each vehicle, and odometer alerts. Managers also get a read-only activity feed (trips, expenses, maintenance) and trip details with odometer photos. Drivers get a per-trip summary only. | S04–S05, S15–S18, S30 | P08 |
| D17 | Location tracking and chat or messaging are out of scope. | absent | P04 |
| D18 | Only drivers record maintenance, and only on assigned vehicles. Managers view it. | S34, S17 | Changes UC08 |
| D19 | Expenses, refueling and maintenance can be recorded with or without a trip in progress; during a trip they link to it automatically. Refueling has its own form (liters, price per liter, computed total, odometer, gas station) and counts in spend as **Combustível**. Maintenance has its own form (type Preventiva/Corretiva/Urgência, service, amount, workshop, odometer). | S21–S22, S32–S34 | P13 (sub-question P19) |
| D20 | Trip lifecycle: **start** (an assigned vehicle not on a trip, origin, destination, initial odometer ≥ last reading, required photo; the start time is automatic) → **in progress** → **finish** (final odometer, required photo, optional notes, confirmation; the final odometer can't change afterwards) or **cancel** by the driver (ends without an arrival record; expenses kept). A summary follows the finish. | S25–S30, M12, M13, M18 | Partly P12; extends RF10 |
| D21 | Drivers can edit and delete their own expenses. Deleting removes the amount from the trip's spend and deletes the receipt. | M10–M11 | Extends RF11 (limits: P21) |
| D22 | Record dates and times are set automatically; no form asks for them. | S25, S32–S35 | Changes RF11 |
| D23 | Destructive actions need typed confirmation: the fleet name, the plate, or `EXCLUIR` (for deleting driver data and for deleting your own account). | M03, M06, M09, M15, M17 | Details RF03–RF06 |
| D24 | Deactivating a driver removes their fleet and vehicle assignments and blocks their app access. A trip in progress continues. | M08 | Extends RF06 (open part: P12) |
| D25 | Deleting a manager's account erases their personal data but keeps the company's fleets and vehicles. | M15 | Partly P14 |
| D26 | The odometer photo is required for refueling and maintenance; the invoice photo is optional ("recomendado"). | S33–S34 | Partly P10 |

## Technical evidence, not decisions

The repository uses Node.js/CommonJS, Express 5, Sequelize, Zod, JWT/bcryptjs and Jest/Supertest, with the layered architecture described in `.claude/rules/architecture.md`. These came from the initial scaffolding. Implementation and verification status are recorded in [`progress.md`](progress.md).

## Not approved yet

- The development plan in [`progress.md`](progress.md), and the validation criteria in [`requirements-analysis.md`](requirements-analysis.md).
- No choice yet on hosting, image storage or how service alerts are configured (P09).
- **Physical schema** ([`data-model.md`](data-model.md), written 2026-10-20 at the user's request): the models and `data/db.sql` exist, but the schema awaits approval. These are applied as proposals:
  - single-company Fleet access is now confirmed by D27; other outstanding schema proposals remain unapproved;
  - separate tables for refuelings and maintenances (P17, P18);
  - `service_reminders` (P09);
  - Sequelize `DATETIME` timestamps instead of the BIGINT template;
  - camelCase attributes mapped to snake_case columns;
  - kebab-case for multi-word file names.
- **Choices made while building auth and users** (applied; review them):
  - Error objects carry `httpStatus` (`utils.error`), and controllers send them with `utils.sendError`.
  - Routes: `POST /register` and `POST /login` (both return `{ token, user }`); `GET`, `PUT` and `DELETE /users/@me`; `PUT /users/@me/password`.
  - JWT `{ sub, role }` expiring in 7 days; logout is client-side; no token revocation.
  - Password policy: 8–72 characters with upper case, lower case and a digit (from economix-api).
  - Phone: digits only, 10–11 with the area code; the app strips the mask.
  - Full name: at least two words.
  - Login returns one `invalid_credentials` error for an unknown email and for a wrong password.
  - Managers' CNH fields are ignored. Drivers must send their CNH when they edit their profile (`cnh_required`).
  - Changing the password requires the current one and a confirmation (RF03). The screen isn't designed yet (P20).
  - Deleting an account is blocked with `trip_in_progress` while the driver has a trip in progress (P22).

## Recording a new decision

When the user answers an open question (see [`requirements-analysis.md`](requirements-analysis.md#open-questions)) or approves a proposal, add a row:

| ID | Date | Decision | Confirmed by | Resolves |
|---|---|---|---|---|
| D32 | YYYY-MM-DD | … | user | Pxx |

Then update the rules and docs it affects, and set the question's status to **Resolved → Dxx**. If the prototype changes, update [`prototype.md`](prototype.md) and review D10–D26.
