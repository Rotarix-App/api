# Decisions

Started 2026-10-18. Every entry here is either stated in the official sources, confirmed by the user with a date, or derived from the Figma prototype under D09. A documented decision isn't necessarily implemented.

## Confirmed by the user

| ID | Date | Decision | Confirmed by | Resolves |
|---|---|---|---|---|
| — | 2026-10-18 | Build persistent project memory from the three sources, keeping traceability and the official files intact. | user | - |
| — | 2026-10-18 | Inspect the code without changing it. Implement features only after a later approval. | user | - |
| — | 2026-10-18 | Ask for approval before major architectural decisions and destructive operations. | user | - |
| — | 2026-10-20 | Consolidate the agent instructions, rules, skills and memory under `.claude/`, written in English. | user | - |
| — | 2026-10-20 | Remove Socket.IO from the project. The API has no real-time channel; don't add one without asking. | user | - |
| — | 2026-10-20 | Build the auth and users endpoints and repositories using `economix-api` (the user's earlier API) as the architectural reference, and update the skills to match. | user | - |
| — | 2026-10-20 | Integration tests may recreate `rotarix_test` on the user's local MySQL. | user | - |
| — | 2026-10-20 | A driver's fleet is **derived from their vehicle assignments** (`vehicle_assignments → vehicles.fleet_id`), not stored: `users` has no `fleet_id`. "One driver, one fleet" (D13) is a rule the service enforces when assignments are saved. | user | - |
| **D09** | 2026-10-20 | **The Figma prototype "Rotarix — Protótipo Mobile" (v1.0, 2026-09-26) is the source of truth for functionality**: screens, flows, fields and behavior. Where the official documents diverge, follow the prototype. The official documents still govern non-functional requirements and any rule the prototype doesn't contradict. See [`prototype.md`](prototype.md). | user | - |
| **D27** | 2026-11-04 | **A manager only accesses the fleets they created.** Each fleet belongs to the manager who creates it (`fleets.manager_id`). Another manager can't see, edit, deactivate or delete it; the API answers 404, as for any resource that belongs to someone else. | user | - |
| **D28** | 2026-11-04 | **Deleting a fleet deletes its vehicles too** (soft delete, so trips, expenses, readings and photos stay in history) and removes their assignments. It's blocked with 409 while any of its vehicles is on a trip. No vehicle is ever left without a fleet. Changes D11, D12 and the M03 text ("ficam sem frota"). | user | - |
| **D29** | 2026-11-04 | **Deactivating a fleet makes its vehicles unavailable without changing their own status.** While the fleet is inactive its vehicles can't start trips; when it's reactivated, each vehicle is back to its own status, including those deactivated separately. | user | - |
| **D30** | 2026-11-04 | **Deleting a vehicle on a trip is blocked**, like deactivating it (M05). Resolves part of P20. | user | - |
| **D31** | 2026-11-04 | **The manager can only raise a vehicle's odometer when editing it.** A higher value is recorded as a manual reading; a lower one is rejected (RN07); changing it during a trip is blocked. | user | - |
| **D32** | 2026-11-16 | **Each driver has at most one responsible manager** (`users.manager_id`, NULL for managers). Creating a driver in S12 makes the creator responsible; self sign-up (S03) leaves it NULL. A manager links a driver without a manager by exact email (`POST /drivers/link`); drivers without a manager are never listed. Only the responsible manager lists, reads, edits, deactivates, reactivates, deletes or assigns the driver; anyone else gets 404 `driver_not_found` (as D27). | user | P06 |
| **D33** | 2026-11-16 | **An inactive driver with an ongoing trip keeps a restricted session** solely to finish or cancel that own trip (RF06: deactivation is allowed and the trip stays active). Both actions check trip ownership, not assignments. Afterwards all access is blocked. While the trip lasts, the driver's `tripStatus` stays `in_progress`, so the app warns the manager. | user | P12 |
| **D34** | 2026-11-16 | **Deleting a driver's data during an ongoing trip returns 409** `driver_has_trip_in_progress`. Deactivate, let the driver finish, then delete (as D28, D30). | user | P22 (manager deletion only) |
| **D35** | 2026-11-16 | **Managers never change another manager's assignments.** Transfer: the responsible manager releases the driver, which removes their assignments and sets `manager_id` to NULL; the new manager then links them by email. Release during an ongoing trip is blocked, and replacing assignments can't remove the ongoing trip vehicle (409). | user | P12; RF07 |
| **D36** | 2026-11-16 | **Driver status changes are idempotent**, like fleets and vehicles. Reactivation never restores the assignments removed by deactivation (D24); the driver comes back free without vehicles. A deleted driver can't be reactivated. | user | P20 (driver reactivation) |
| **D37** | 2026-11-16 | **A deleted driver appears in history only as "Motorista removido"**: historical joins include deleted users (paranoid: false) but expose no id, contact or CNH. Photos are kept. Storage keys never contain name, email, phone or CNH. Request logs keep no email or phone. | user | P14 (partly) |
| **D39** | 2026-11-16 | **An inactive driver can't receive assignments**: 409 `driver_inactive`. Reactivate first, then assign. | user | — |
| **D40** | 2026-11-16 | **Photos are uploaded separately** (`POST /photos`, multipart, stored on local disk under `UPLOAD_DIR` with an opaque UUID key) and records reference them by id (`odometerPhotoId`). Reusable by expenses, refuelings and maintenance, and lets the app retry only the upload. | user | Partly P10 (storage) |
| **D41** | 2026-11-16 | **A trip's spend total (S27, S30, cost per km) sums its expenses and refuelings.** **Changed by D45:** maintenances count too. | user | Partly P17 |
| **D42** | 2026-11-16 | **Outside a trip, the driver picks the vehicle** of an expense, refueling or maintenance (`vehicleId`, one of their assigned vehicles). During a trip the trip's vehicle is used and `vehicleId` is ignored. The single vehicle card of S32–S34 becomes a picker when there's more than one. | user | P19 |
| **D43** | 2026-11-16 | **"Combustível" is recorded only as a refueling (S33)**, with odometer and photo. A plain expense (S32) accepts Pedágio, Alimentação, Borracharia and Manutenção de urgência. | user | P18 |
| **D44** | 2026-11-16 | **The receipt photo of a plain expense is optional**, like the invoice of refueling and maintenance (D26). | user | P10 (receipt) |
| **D45** | 2026-11-16 | **Every maintenance (preventive, corrective, urgent) counts in spend totals under the "Manutenção de urgência" category**, shown as maintenance in the breakdown. The trip total includes maintenances too. | user | P17 |
| **D46** | 2026-11-16 | **Only the driver edits and deletes their own expenses, at any time**; the manager only views. Refuelings and maintenances can't be edited or deleted, because they record odometer readings (RN07). | user | P21 |
| **D47** | 2026-11-16 | **Service reminders are registered by the manager per vehicle** (title, due odometer, optional interval). A preventive maintenance completes the vehicle's due reminder with the lowest due odometer and, if it has an interval, schedules the next one from the maintenance odometer. The configuration screen still has to be drawn in the Figma. | user | P09 |

Rejected on 2026-11-16: a shared driver registry for all managers (proposed as D38 on 2026-11-11 without the user's confirmation). D32 applies instead.

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

The repository uses Node.js/CommonJS, Express 5, Sequelize, Zod, JWT/bcryptjs and Jest/Supertest, with the layered architecture described in `.claude/rules/architecture.md`. These came from the initial scaffolding. Auth/users, fleets, vehicles and drivers/assignments are implemented; see [`progress.md`](progress.md) for validation and limits.

## Not approved yet

- The development plan in [`progress.md`](progress.md), and the validation criteria in [`requirements-analysis.md`](requirements-analysis.md).
- No choice yet on hosting or how service alerts are configured (P09). Image storage is local disk (D40); backups and a move to object storage are open (RNF04, P15).
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

- **Choices made while building trips and photos** (2026-11-16, applied; review them):
  - Routes: `POST /photos`, `GET /photos/:id` (uploader only); `POST` and `GET /trips`, `GET /trips/current`, `GET /trips/:id`, `POST /trips/:id/photos`, `POST /trips/:id/finish`, `POST /trips/:id/cancel`. All driver-only; the manager's trip view comes with the activity feed (S18).
  - Photos: JPEG, PNG or WebP detected from the file bytes (the client's type and name are ignored), up to 10 MB; one record per photo (409 `photo_already_used`); the start/finish photo must be the driver's own and of kind `odometer`. Photos uploaded but never linked stay on disk (no cleanup yet).
  - `POST /trips/:id/photos` exists so a driver deactivated during the trip (D33) can upload the final odometer photo; `/finish`, `/cancel` and this upload use `AuthMiddleware.forTripAction`, so anyone other than the driver of that trip in progress (managers included, and a trip already ended) gets 404 `trip_not_found`.
  - Start checks, in order: vehicle assigned to the driver (404), driver active, no trip of the driver (409 `driver_has_trip_in_progress`), vehicle free (409 `vehicle_on_trip`, "Este veículo está em viagem com …"), vehicle and fleet active (409 `vehicle_unavailable`), odometer ≥ current (400 `odometer_below_last_reading`, S25 text).
  - Locks: start takes the driver row, the fleet, the vehicle, then the photo (same order as the driver and vehicle services); finish/cancel take the vehicle, then the trip. The unique `active_*` columns remain the RN06 backstop.
  - The history filter is `all` (default, includes cancelled), `in_progress` or `finished` (S29). Duration of a trip in progress is the elapsed time so far; distance and cost per km are null until it's finished. The odometer-photo count covers the trip's start and end photos, as in the S30 sample.
  - The M18 confirmation is client-side; the API has no field for it.

- **Choices made while building the remaining driver and manager endpoints** (2026-11-16, applied; review them):
  - Driver: `GET /users/@me/vehicles` and `/users/@me/vehicles/:id` (S23–S24) with `tripStatus` `free`, `on_trip`, `unavailable` (another driver's trip, with that driver's name) or `inactive` (vehicle or fleet); the detail's recent history is the driver's own last 5 trips and 5 refuelings on that vehicle.
  - Records: `POST /expenses`, `GET`/`PUT`/`DELETE /expenses/:id`, `POST /refuelings`, `GET /refuelings/:id`, `POST /maintenances`, `GET /maintenances/:id`, `GET /users/@me/spending?month=` (S31, month in Brasília time). The refueling total is liters × price per liter, rounded to cents. On edit, an omitted `receiptPhotoId` keeps the receipt and `null` removes it; a removed or replaced receipt is deleted. Outside a trip, a vehicle on a trip with another driver can't receive records (409 `vehicle_on_trip`).
  - A preventive maintenance completes only a reminder already due (due odometer ≤ maintenance odometer), the one with the lowest due odometer.
  - Reminders: `GET`/`POST /vehicles/:id/reminders`, `PUT`/`DELETE /vehicles/:id/reminders/:reminderId`, manager-only; completed reminders can't be edited (409 `reminder_completed`). `GET /vehicles/:id` now returns `serviceAlerts`.
  - Manager: `GET /metrics` (S04–S05 and the S08 Resumo tab with `fleetId`), `GET /activity/trips`, `/activity/trips/:id`, `/activity/expenses` (all record types, `category` filter) and `/activity/maintenances` (S15–S18). Period: `days` 7, 30 (default) or 90, or `from`/`to` up to 366 days, in Brasília time. Trips count those started in the period; km and cost per km use trips finished in it, over all spend in the period. `changePercent` is null when the previous period had no spend. Records of a deleted fleet's vehicles drop out of manager views, since those vehicles lose their fleet.
  - `GET /photos/:id` also serves the manager who owns the vehicle of the record the photo belongs to (S18).

## Recording a new decision

When the user answers an open question (see [`requirements-analysis.md`](requirements-analysis.md#open-questions)) or approves a proposal, add a row:

| ID | Date | Decision | Confirmed by | Resolves |
|---|---|---|---|---|
| D40 | YYYY-MM-DD | … | user | Pxx |

Then update the rules and docs it affects, and set the question's status to **Resolved → Dxx**. If the prototype changes, update [`prototype.md`](prototype.md) and review D10–D26.
