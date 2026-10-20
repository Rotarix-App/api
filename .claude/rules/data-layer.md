---
paths:
  - "src/app/services/**"
  - "src/app/repositories/**"
  - "src/app/database/**"
  - "data/**"
---

# Data layer: services, repositories, models, schema

Before implementing a service, check the business and lifecycle rules in `domain.md` and the open questions (Pxx) for the feature in `.claude/docs/requirements-analysis.md`. Don't implement behavior that depends on an unresolved question until the user has answered it.

## Services

- Each service is a class in `src/app/services/<name>.service.js`, exported as a singleton.
- Services own business rules and orchestration and reach data only through repositories.
- They return data on success and `{ error: true, message, id }` on expected failure. `message` is pt-BR; `id` is English snake_case.
- Wrap multi-step writes in a Sequelize transaction (for example: closing a trip and advancing the vehicle odometer, or changing assignments).
- RN06 (one trip in progress) and RN07 (odometer never decreases) are race-prone.
  - RN06 is backed by unique generated columns on `trips`. Translate the duplicate-key error into the business error.
  - For RN07, lock the vehicle row (`lock: true` inside the transaction) before comparing a new reading with `current_odometer`, then write the reading and update `current_odometer` in that same transaction.

## Repositories

- Each repository is a class in `src/app/repositories/<name>.repository.js`, exported as a singleton, and contains only Sequelize queries.
- They return a model instance or list, or `{ error: true, message, id }`.
- Use Sequelize query APIs. Use raw SQL only with bind parameters.
- Never return `passwordHash`. The `User` default scope already hides it.

## Models

The full schema, with sources and assumptions, is in `.claude/docs/data-model.md`. The ERD is `docs/der/der.png`; update `docs/der/der.mmd` and regenerate the image whenever a model changes.

- There are 11 models in `src/app/database/models/`, one per table. Multi-word file names use kebab-case (`odometer-reading.js`).
- **Import models only through the folder:** `const { Trip, Vehicle } = require('../database/models')`. The folder's `index.js` loads the connection first. Requiring a model file directly before `database/index.js` has loaded breaks the associations.
- Each model is defined on the shared connection (`const connection = require('..')`) with `connection.define('Name', attributes, { tableName, underscored: true })`.
- Write every attribute as a multi-line object, one property per line. The user doesn't want inline definitions like `{ type: ..., allowNull: false }`:

  ```js
  amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
  },
  ```
- Attributes are camelCase and columns snake_case (`underscored: true`), so the API's JSON is camelCase.
- Timestamps are Sequelize's own (`created_at` and `updated_at`, `DATETIME`). `users` and `vehicles` are `paranoid` (`deleted_at`).
- `User`'s default scope hides `passwordHash`; use `User.scope('withPassword')` only for login and password changes.
- All associations go in `models/associations.js`, with explicit `foreignKey` and `as`.
- Models declare only types, `allowNull` and defaults. Uniqueness, foreign keys and checks live in `data/db.sql`.
- There are no migrations and no `sequelize.sync()`. Always change `data/db.sql`, the model and `docs/der/der.mmd` together.

## SQL schema (`data/db.sql`)

- **Destructive.** The script starts with `DROP DATABASE IF EXISTS rotarix`. Never run it against a database that has data without the user's explicit authorization. CI runs it on a throwaway MySQL service.
- Table conventions:
  - plural snake_case table names and an `id INT(11) NOT NULL AUTO_INCREMENT` primary key;
  - `created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP` and `updated_at ... ON UPDATE CURRENT_TIMESTAMP`;
  - named constraints (`uq_`, `fk_`, `ix_`, `ck_`), `COLLATE='utf8mb4_general_ci'` and `ENGINE=InnoDB`.
  - Tables are created in dependency order.
- Rules the database enforces through generated columns: `vehicles.active_plate` (unique plate among vehicles that aren't deleted, RN04), and `trips.active_driver_id` and `trips.active_vehicle_id` (one trip in progress each, RN06). They aren't model attributes.
- The script creates only `rotarix`. Nothing creates the test database `rotarix_test`.

## Connection

`database/index.js` connects with the `MYSQL_*` variables and `logging: false`. If authentication fails, it logs the error and calls `process.exit()` with no code, so the process exits with status 0 and the failure looks like a clean exit. The connection is opened only when something first requires `database/`.
