# Data model

The physical schema, derived from what the prototype shows and collects (`prototype.md`, D09), plus basic control fields. Written 2026-10-20.

- **Status:** the models and `data/db.sql` exist; the schema has never been run against a database.
- **Approval:** the schema is a proposal until the user approves it. The assumptions are listed [at the end](#assumptions-to-confirm).

| Artifact | Path |
|---|---|
| Sequelize models | `src/app/database/models/*.js` (import them from `src/app/database/models`, never file by file) |
| Associations | `src/app/database/models/associations.js` |
| SQL schema | `data/db.sql` (destructive: starts with `DROP DATABASE`) |
| ERD image | [`docs/der/der.png`](../../docs/der/der.png) and [`der.svg`](../../docs/der/der.svg), from [`der.mmd`](../../docs/der/der.mmd) |

## Conventions

- **Names:** model attributes are camelCase and columns are snake_case (`underscored: true`), so the API's JSON is camelCase. Enum values are English snake_case.
- **Control fields:** every table has `created_at` and `updated_at` (`DATETIME`, managed by Sequelize). `users` and `vehicles` also have `deleted_at` (soft delete, `paranoid: true`).
- **Record time:** the prototype has no date inputs (D22), so `created_at` is when a record happened. Trips also have `started_at` and `ended_at`.
- **Money:** `DECIMAL(10,2)`. mysql2 returns `DECIMAL` values as strings.
- **Odometer:** whole kilometers (`INT UNSIGNED`).
- **Constraints:** uniqueness, foreign keys and checks live in `data/db.sql`. The models only declare types, `allowNull` and defaults.
- **Imports:** load models through `src/app/database/models`. Requiring a model file directly before the database module has loaded breaks the associations ("called with something that's not a subclass of Sequelize.Model").

## Tables

### fleets (S06–S07)

| Column | Type | Null | Notes |
|---|---|---|---|
| id | INT | — | PK |
| name | VARCHAR(100) | — | |
| base_region | VARCHAR(120) | — | One field, "Base ou região" (D10) |
| description | VARCHAR(255) | ✓ | Optional |
| status | ENUM active, inactive | — | Default active |

Fleets are hard-deleted. `vehicles.fleet_id` becomes NULL, and the service deletes the assignments to the fleet's vehicles (D12).

### users (S02–S03, S11–S13, S19–S20, S36–S37)

| Column | Type | Null | Notes |
|---|---|---|---|
| id | INT | — | PK |
| role | ENUM manager, driver | — | Never changes (RN01) |
| name | VARCHAR(120) | — | |
| email | VARCHAR(160) | — | Unique; used as login |
| password_hash | VARCHAR(255) | — | bcrypt. The default scope hides it; use `User.scope('withPassword')` |
| phone | VARCHAR(20) | ✓ | Required on sign-up; NULL after anonymization |
| cnh_number | VARCHAR(11) | ✓ | Drivers only |
| cnh_category | ENUM B, C, D, E | ✓ | Drivers only |
| status | ENUM active, inactive | — | Inactive = deactivated driver (D24) |
| deleted_at | DATETIME | ✓ | Set when an account or a driver's data is deleted |

**Anonymizing a user (D06, D25):**
- Set `deleted_at`.
- Replace `name` with a placeholder and `email` with a unique placeholder (for example `removed-<id>@rotarix.invalid`).
- Replace `password_hash` with a random hash.
- Clear `phone`, `cnh_number` and `cnh_category`, and delete the user's assignments.

Trips and records keep pointing at the row. Paranoid queries hide it, so history shows no identification.

This is implemented in `UserRepository.anonymize`, which `UserService.deleteAccount` runs in a transaction together with removing the assignments. The email placeholder frees the original email for a new sign-up. `User.prototype.toJSON` hides `passwordHash` and `deletedAt` in every response.

### vehicles (S08–S10, S23–S24)

| Column | Type | Null | Notes |
|---|---|---|---|
| id | INT | — | PK |
| fleet_id | INT | ✓ | FK fleets. Required on create and edit (D11); NULL only after its fleet is deleted |
| plate | VARCHAR(7) | — | Stored without the hyphen, upper case. Unique among vehicles that aren't deleted (RN04), through the generated column `active_plate` |
| brand | VARCHAR(60) | — | |
| model | VARCHAR(60) | — | |
| year | SMALLINT UNSIGNED | — | |
| current_odometer | INT UNSIGNED | — | Cached copy of the last reading (RN07) |
| status | ENUM active, inactive | — | Can't become inactive while on a trip (M05) |
| deleted_at | DATETIME | ✓ | Soft delete keeps the plate in history (M06) |

Free, on a trip and unavailable (*Livre*, *Em viagem*, *Indisponível*) aren't stored; they're derived from trips in progress.

### vehicle_assignments (S14)

| Column | Type | Null | Notes |
|---|---|---|---|
| id | INT | — | PK |
| driver_id | INT | — | FK users, CASCADE. Unique together with vehicle_id |
| vehicle_id | INT | — | FK vehicles, CASCADE |

**A driver's fleet is derived, not stored.** It's the fleet of the vehicles assigned to them (`vehicle_assignments → vehicles.fleet_id`), and there's no `fleet_id` on `users`; the user decided this on 2026-10-20 to avoid keeping the same fact in two places. The service enforces D13 and RF07 when it saves assignments:
- every checked vehicle belongs to the same active fleet;
- at least one vehicle is checked;
- changing the driver's fleet replaces all of their assignments.

Anything that takes a vehicle out of a fleet (deleting the fleet, M03; moving the vehicle with S09; deactivating the driver, M08) removes the affected assignments. Screens S06, S11 and S13 get the driver's fleet with a join through `vehicles`.

### photos (S25–S26, S28, S32–S35)

| Column | Type | Null | Notes |
|---|---|---|---|
| id | INT | — | PK |
| kind | ENUM odometer, receipt, invoice | — | |
| storage_key | VARCHAR(255) | — | Unique path or object key. The storage itself isn't chosen yet (RNF05) |
| mime_type | VARCHAR(50) | — | |
| size_bytes | INT UNSIGNED | — | |
| uploaded_by | INT | — | FK users |

Each photo belongs to at most one record: the referencing columns are unique.

### odometer_readings (S10, S24–S25, S28, S33–S34)

| Column | Type | Null | Notes |
|---|---|---|---|
| id | INT | — | PK |
| vehicle_id | INT | — | FK vehicles |
| recorded_by | INT | — | FK users |
| value_km | INT UNSIGNED | — | Must be ≥ `vehicles.current_odometer` (RN07) |
| source | ENUM manual, trip_start, trip_end, refueling, maintenance | — | `manual` is the manager's entry on S09 |
| photo_id | INT | ✓ | FK photos, unique. Required for every source except `manual` (RN08) |

Every reading lives here, which gives the vehicle detail its "last reading, when and from where" and makes RN07 a single check. Writing a reading and advancing `vehicles.current_odometer` happen in one transaction, with the vehicle row locked.

### trips (S21–S22, S25–S30, M12–M13, M18)

| Column | Type | Null | Notes |
|---|---|---|---|
| id | INT | — | PK |
| driver_id | INT | — | FK users |
| vehicle_id | INT | — | FK vehicles |
| origin | VARCHAR(120) | — | |
| destination | VARCHAR(120) | — | |
| status | ENUM in_progress, finished, cancelled | — | D20 |
| start_reading_id | INT | — | FK odometer_readings, unique |
| end_reading_id | INT | ✓ | FK odometer_readings, unique. Set on finish; locked afterwards |
| notes | VARCHAR(500) | ✓ | Optional notes on finish |
| started_at | DATETIME | — | Automatic |
| ended_at | DATETIME | ✓ | When the trip was finished or cancelled |

The generated columns `active_driver_id` and `active_vehicle_id` are unique, so the database itself allows only one trip in progress per driver and per vehicle (RN06).

Derived values, not stored: distance (end − start reading), duration, total spend, cost per km.

### expenses (S31–S32, S35, M10–M11)

| Column | Type | Null | Notes |
|---|---|---|---|
| id | INT | — | PK |
| driver_id | INT | — | FK users |
| vehicle_id | INT | — | FK vehicles. Always stored, even when there's a trip |
| trip_id | INT | ✓ | FK trips. Set automatically when a trip is in progress (D19) |
| category | ENUM fuel, toll, food, tire_repair, urgent_maintenance | — | Combustível, Pedágio, Alimentação, Borracharia, Manutenção de urgência |
| amount | DECIMAL(10,2) | — | > 0 |
| description | VARCHAR(255) | ✓ | |
| receipt_photo_id | INT | ✓ | FK photos, unique. Whether it's required: P10 |

The driver can edit or delete their own expenses (D21). Deleting removes the expense and then its photo.

### refuelings (S33)

| Column | Type | Null | Notes |
|---|---|---|---|
| id | INT | — | PK |
| driver_id, vehicle_id | INT | — | FKs |
| trip_id | INT | ✓ | FK trips |
| odometer_reading_id | INT | — | FK odometer_readings, unique (RN08) |
| liters | DECIMAL(8,2) | — | > 0 |
| price_per_liter | DECIMAL(8,3) | — | > 0 |
| total_amount | DECIMAL(10,2) | — | Computed by the service and stored |
| gas_station | VARCHAR(120) | — | |
| invoice_photo_id | INT | ✓ | FK photos, unique. Optional (D26) |

Counts in spend as Combustível (D19).

### maintenances (S17, S34)

| Column | Type | Null | Notes |
|---|---|---|---|
| id | INT | — | PK |
| driver_id, vehicle_id | INT | — | FKs. Only drivers record maintenance (D18) |
| trip_id | INT | ✓ | FK trips |
| odometer_reading_id | INT | — | FK odometer_readings, unique (RN08) |
| type | ENUM preventive, corrective, urgent | — | |
| service | VARCHAR(255) | — | |
| amount | DECIMAL(10,2) | — | > 0 |
| workshop | VARCHAR(120) | — | |
| invoice_photo_id | INT | ✓ | FK photos, unique. Optional (D26) |

### service_reminders (S05, S10, S21, S23–S24): proposal, P09

| Column | Type | Null | Notes |
|---|---|---|---|
| id | INT | — | PK |
| vehicle_id | INT | — | FK vehicles |
| title | VARCHAR(60) | — | For example "Revisão" or "Troca de óleo" |
| due_odometer | INT UNSIGNED | — | Drives "Revisão em X km" and "vencida há X km" |
| interval_km | INT UNSIGNED | ✓ | To schedule the next reminder |
| completed_maintenance_id | INT | ✓ | FK maintenances, SET NULL |
| completed_at | DATETIME | ✓ | |

The prototype shows these alerts but has no screen to configure them.

## Relationships

| From | To | Cardinality | Column |
|---|---|---|---|
| fleets | vehicles | 0..1 – N | vehicles.fleet_id |
| users (drivers) | vehicles | N – M | vehicle_assignments (the driver's fleet is derived from it) |
| users | photos | 1 – N | photos.uploaded_by |
| vehicles | odometer_readings | 1 – N | odometer_readings.vehicle_id |
| users | odometer_readings | 1 – N | odometer_readings.recorded_by |
| photos | odometer_readings | 0..1 – 0..1 | odometer_readings.photo_id |
| users / vehicles | trips | 1 – N | trips.driver_id, trips.vehicle_id |
| odometer_readings | trips | 1 – 0..1 (start), 0..1 – 0..1 (end) | trips.start_reading_id, trips.end_reading_id |
| users / vehicles | expenses, refuelings, maintenances | 1 – N | driver_id, vehicle_id |
| trips | expenses, refuelings, maintenances | 0..1 – N | trip_id |
| odometer_readings | refuelings, maintenances | 1 – 0..1 | odometer_reading_id |
| photos | expenses, refuelings, maintenances | 0..1 – 0..1 | receipt_photo_id, invoice_photo_id |
| vehicles | service_reminders | 1 – N | service_reminders.vehicle_id |
| maintenances | service_reminders | 0..1 – N | service_reminders.completed_maintenance_id |

## Assumptions to confirm

- **P07: one company.** No `companies` table: every manager sees every fleet, and a self-registered driver shows up in the managers' driver list (which also answers the rest of P06). The prototype never collects company data. If the answer turns out to be multi-company, add `companies` plus `company_id` on `users` and `fleets`; it's an additive change.
- **P17 and P18:** refuelings and maintenances are separate tables, so how they count in the spend categories is a reporting rule that can change without touching the schema.
- **P09:** `service_reminders` is a proposal.
- **Timestamps:** `DATETIME` columns managed by Sequelize replace the BIGINT unix-ms template that was in the scaffold's `db.sql`.
- **File names:** model files use kebab-case for multi-word names (`odometer-reading.js`), as the old architecture prompt said.

## Regenerating the ERD

```bash
PUPPETEER_SKIP_DOWNLOAD=true PUPPETEER_EXECUTABLE_PATH="C:/Program Files/Google/Chrome/Application/chrome.exe" \
  npx -y @mermaid-js/mermaid-cli@11 -i docs/der/der.mmd -o docs/der/der.png -c docs/der/mermaid.config.json -b white -s 2
```

Use `-o docs/der/der.svg` (and drop `-s 2`) for the vector version. Update `der.mmd` whenever a model changes.
