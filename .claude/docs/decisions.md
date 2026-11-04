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
| **D27** | 2026-11-04 | **A manager only accesses the fleets they created.** Each fleet belongs to the manager who creates it (`fleets.manager_id`). Another manager can't see, edit, deactivate or delete it; the API answers 404, as for any resource that belongs to someone else. |
| **D28** | 2026-11-04 | **Deleting a fleet deletes its vehicles too** (soft delete, so trips, expenses, readings and photos stay in history) and removes their assignments. It's blocked with 409 while any of its vehicles is on a trip. No vehicle is ever left without a fleet. Changes D11, D12 and the M03 text ("ficam sem frota"). |
| **D29** | 2026-11-04 | **Deactivating a fleet makes its vehicles unavailable without changing their own status.** While the fleet is inactive its vehicles can't start trips; when it's reactivated, each vehicle is back to its own status, including those deactivated separately. |
| **D30** | 2026-11-04 | **Deleting a vehicle on a trip is blocked**, like deactivating it (M05). Resolves part of P20. |
| **D31** | 2026-11-04 | **The manager can only raise a vehicle's odometer when editing it.** A higher value is recorded as a manual reading; a lower one is rejected (RN07); changing it during a trip is blocked. |

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
| D11 | A fleet is required when creating or editing a vehicle. A vehicle becomes fleetless only when its fleet is deleted, which also removes the assignments. **Changed by D28:** deleting a fleet deletes its vehicles. | S09, M03 | P01 |
| D12 | No link ever blocks deletion. Deleting a fleet unlinks its vehicles and removes assignments; deleting a vehicle keeps its trips, expenses and photos; deleting a driver anonymizes them. Only **deactivating** a vehicle during a trip is blocked. **Changed by D28 and D30:** deleting a fleet or a vehicle is blocked during a trip, and deleting a fleet deletes its vehicles. | M03, M05, M06, M09 | P02 |
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

The repository uses Node.js/CommonJS, Express 5, Sequelize, Zod, JWT/bcryptjs and Jest/Supertest, with the layered architecture described in `.claude/rules/architecture.md`. These came from the initial scaffolding. Only the auth and users module is implemented. See [`progress.md`](progress.md).

## Not approved yet

- The development plan in [`progress.md`](progress.md), and the validation criteria in [`requirements-analysis.md`](requirements-analysis.md).
- No choice yet on hosting, image storage or how service alerts are configured (P09).
- **Physical schema** ([`data-model.md`](data-model.md), written 2026-10-20 at the user's request): the models and `data/db.sql` exist, but the schema awaits approval. These are applied as proposals:
  - separate tables for refuelings and maintenances (P17, P18);
  - `service_reminders` (P09);
  - Sequelize `DATETIME` timestamps instead of the BIGINT template;
  - camelCase attributes mapped to snake_case columns;
  - kebab-case for multi-word file names.
- **Choices made while building fleets** (`Frotas` branch, applied; review them):
  - Routes: `POST` and `GET /fleets`; `GET`, `PUT` and `DELETE /fleets/:id`; `PATCH /fleets/:id/status` (deactivate and reactivate, idempotent); `GET /fleets/:id/vehicles` and `/fleets/:id/drivers`. All manager-only.
  - A fleet belongs to its creator (D27). `managerId` is set from the token and can't be sent in the body.
  - The list filter defaults to `all`. The name search is a literal, case-insensitive substring.
  - Counts exclude soft-deleted vehicles and users, and count drivers once per fleet. `onTripCount` counts vehicles with a trip in progress.
  - Deleting needs `confirmationName` equal to the stored name, case and spaces included (`400 fleet_name_confirmation_mismatch`). It locks the fleet row and its vehicles, answers `409 fleet_has_trip_in_progress` if any is on a trip, deletes their assignments (soft-deleted vehicles too), soft-deletes the vehicles and deletes the fleet (D28).
  - Vehicle rows return every assigned driver (`assignedDrivers`) plus the driver of the trip in progress (`tripDriver`), which S08 shows.
  - Vehicle rows also return `available`.
  - `SchemaParserMiddleware` takes a third argument for path params and a `stringQueryFields` option that keeps numeric-looking query values (a search for "00123") as text.
- **Choices made while building vehicles** (`feat/vehicles` branch, applied; review them):
  - Routes: `POST /vehicles`; `GET`, `PUT` and `DELETE /vehicles/:id`; `PATCH /vehicles/:id/status`. All manager-only. There's no vehicle list: S08 uses `GET /fleets/:id/vehicles`.
  - A vehicle is reachable only through a fleet of the signed-in manager (D27); otherwise 404 `vehicle_not_found`. A `fleetId` from another manager gives 404 `fleet_not_found`.
  - The plate is stored upper case without the hyphen and must match the old or the Mercosul format. A duplicate gives 409 `plate_already_exists`.
  - Year from 1950 to next year; odometer from 0 to 9,999,999 km. The initial odometer is recorded as a manual reading without a photo.
  - A vehicle can be created in, or moved to, an inactive fleet of the same manager; it's then unavailable (D29). Moving it removes its assignments and is blocked during a trip (`409 vehicle_on_trip`).
  - Deactivating keeps the assignments. Reactivation uses the same endpoint (P20).
  - Deleting needs `confirmationPlate` (case, spaces and hyphen ignored; `400 plate_confirmation_mismatch`) and removes the assignments.
  - The `vehicle_on_trip` message names the driver and the start time in Brasília time, as in M05.
  - `available` = active vehicle, active fleet and no trip in progress. The trips module must use the same rule.
  - Writes lock the fleet(s) first, in id order, then the vehicle. The ownership lookup runs before the transaction, because MariaDB 11.7 (`innodb_snapshot_isolation`) rejects a locking read of a row that changed after the transaction's first plain read.
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
