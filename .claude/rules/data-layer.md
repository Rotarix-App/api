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
- RN06 (one trip in progress) and RN07 (odometer never decreases) are race-prone. Enforce them inside the transaction, with row locks or database constraints. A prior read alone isn't enough.

## Repositories

- Each repository is a class in `src/app/repositories/<name>.repository.js`, exported as a singleton, and contains only Sequelize queries.
- They return a model instance or list, or `{ error: true, message, id }`.
- Use Sequelize query APIs. Use raw SQL only with bind parameters.
- Never return `password`; exclude it through attributes or a scope.

## Models

- Models live in `src/app/database/models/<name>.js` and are defined on the shared connection: `const connection = require('..')`.
- All associations go in `models/associations.js`. `database/index.js` assigns `module.exports = connection` **before** it requires `associations`, which is what lets models `require('..')` without a circular-import problem. Keep that order.
- The SQL convention is BIGINT unix-ms `created_at` and `updated_at`, while Sequelize's default timestamps are DATETIME `createdAt` and `updatedAt`. Don't rely on the default `timestamps: true`. Settle the approach on the first model (for example, `timestamps: false` plus hooks).
- The JSON field casing for API responses (snake_case columns as-is, or camelCase attributes mapped with `field`) isn't decided yet. Settle it on the first domain.
- There are no migrations and no `sequelize.sync()`. The schema lives in `data/db.sql`.

## SQL schema (`data/db.sql`)

- **Destructive.** The script starts with `DROP DATABASE IF EXISTS rotarix`. Never run it against a database that has data without the user's explicit authorization. CI runs it on a throwaway MySQL service.
- Table conventions (from the template in the file): snake_case table names, an `id INT(11) NOT NULL AUTO_INCREMENT` primary key, `created_at` and `updated_at` as `BIGINT(20) NULL DEFAULT (unix_timestamp() * 1000)`, `COLLATE='utf8mb4_general_ci'` and `ENGINE=InnoDB`.
- The script creates only `rotarix`. Nothing creates the test database `rotarix_test`.

## Connection

`database/index.js` connects with the `MYSQL_*` variables and `logging: false`. If authentication fails, it logs the error and calls `process.exit()` with no code, so the process exits with status 0 and the failure looks like a clean exit. The connection is opened only when something first requires `database/`.
