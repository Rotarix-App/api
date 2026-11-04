---
paths:
  - "src/tests/**"
  - "jest.config.js"
  - ".env.test"
  - ".github/workflows/**"
---

# Testing

The reference implementation is `src/tests/entrypoints/auth/auth.test.js`, `users/users.test.js` and `unit/role.middleware.test.js`.

## Local execution (Windows or other hosts)

Use the existing `mysql-container` on `localhost:3306` for both environments (D30). Development reads the ignored local `.env` and uses `rotarix`; Jest reads `.env.test` and uses only `rotarix_test`. Both files must contain credentials that actually authenticate to this existing instance. Do not change server accounts, passwords, container ownership or volumes to match template credentials.

```powershell
npm start
# In a separate terminal:
npm run test
```

The existing container must already be running; if stopped, start that same container with `docker start mysql-container`. Do not run this checkout's `docker compose up/down` to adopt, recreate or replace a container owned by another Compose project. The repository Compose file is restored to its original definition and is not used by this local workflow. No second MySQL instance, profile or alternate port is needed.

`npm start` requires a valid `SERVER_PORT`, the development database and the existing schema. Restore a missing `.env` from `.env.example` using the actual local credentials; never print secrets. A missing development database may be provisioned only with explicit user approval, using the unchanged table definitions and omitting the destructive SQL header (D31). Never run `data/db.sql` directly or reset an existing development database.

Dotenv preserves variables already defined in the terminal. Local `MYSQL_*` overrides can redirect tests away from `.env.test`; use a clean terminal or remove only these connection overrides before the commands above:

```powershell
'MYSQL_HOST', 'MYSQL_PORT', 'MYSQL_DATABASE', 'MYSQL_USERNAME', 'MYSQL_PASSWORD' | ForEach-Object {
    Remove-Item "Env:$_" -ErrorAction SilentlyContinue
}
```

`npm run test` remains the original `jest --runInBand` with the default timeout. Its only destructive database operation is the authorized reset of `rotarix_test`; development data and other databases must remain untouched. Keep CI's existing explicit environment overrides for its disposable MySQL service on port 3306.

## Setup

- The stack is Jest 30 with Supertest. `npm test` runs `jest --runInBand`. Every run needs MySQL.
- `globalSetup` (`src/tests/setup/database.js`):
  - recreates the test database from `data/db.sql` before every run;
  - **refuses to connect/reset unless `MYSQL_DATABASE` is exactly `rotarix_test`**, rejecting development names and other names ending in `_test`;
  - rewrites only the `DROP`, `CREATE` and `USE` statements, so `rotarix` itself is never touched.
- `setupFilesAfterEnv` (`src/tests/setup/global.js`) exposes the Express app as `global.app`. After each file it waits for `connection.ready` and closes the Sequelize connection; without that wait, fast files tear down mid-handshake and the run exits with code 1.
- Jest sets `NODE_ENV=test`, so `.env.test` is loaded (`rotarix_test` on the existing local MySQL at port 3306), the HTTP server doesn't start, and the request logger is off. Development uses the same instance with a different database. Server credentials are preserved; local environment files are corrected to match them.
- The user authorized resets only of `rotarix_test`. Do not point test setup at the development database, execute SQL outside the test schema, or remove/recreate the shared container or its volumes.

- **CI** (`.github/workflows/test.yml`) starts a MySQL 8 service and runs `npm test` with `MYSQL_DATABASE=rotarix_test`; `globalSetup` builds the schema.
- The custom sequencer `src/tests/sequencer.js` runs the files in its `order` array first (currently `auth.test.js`, `users.test.js`, `fleets.test.js`), then the rest alphabetically. Add each new domain's file in dependency order. Tests must still pass in any order.

## Structure

```
src/tests/
├── sequencer.js
├── setup/database.js                       # globalSetup: recreates the _test database
├── setup/global.js                         # global.app, closes the connection
├── entrypoints/<domain>/<domain>.test.js   # integration tests, one folder per domain
├── unit/<file>.test.js                     # tests without HTTP (middlewares, pure helpers)
└── utils/<domain>.util.js                  # fixtures: user.util.js (buildUser, createTestUser)
```

## Pattern

Group each endpoint into `errors` and `success`:

```js
const request = require('supertest')
const { createTestUser } = require('../../utils/user.util')

describe('POST /fleets', () => {
    describe('errors', () => {
        test('Should return 403 for a driver', async () => {
            const { token } = await createTestUser('driver')

            const response = await request(global.app)
                .post('/fleets')
                .set('Authorization', `Bearer ${token}`)
                .send({ name: 'Grãos Triângulo', baseRegion: 'Uberlândia, MG' })

            expect(response.status).toBe(403)
            expect(response.body.id).toBe('forbidden')
        })
    })

    describe('success', () => {
        test('Should create a fleet', async () => {
            const { token } = await createTestUser('manager')

            const response = await request(global.app)
                .post('/fleets')
                .set('Authorization', `Bearer ${token}`)
                .send({ name: 'Grãos Triângulo', baseRegion: 'Uberlândia, MG' })

            expect(response.status).toBe(201)
            expect(response.body.error).toBe(false)
        })
    })
})
```

- `createTestUser(role, overrides)` registers a user with a unique email through `POST /register` and returns `{ payload, token, user }`.
- To set up state the API can't create yet (a trip, an inactive user), use the models directly, imported from `src/app/database/models`. `startTripFor` in `users.test.js` is an example.

## Conventions

- Write test names in English (`describe`, `test('Should ...')`).
- For every endpoint, cover success, schema validation (400 `invalid_schema`), authentication (401), authorization by role and assignment (403/404, RN02/RN03), and every business-rule error `id`.
- Assert on `response.body.id`, not on the pt-BR `message`.
- Check that no response exposes `passwordHash`.
- Generate unique data per test (emails come from `buildUser`; suffix plates and names with a timestamp). Don't depend on state left by other tests.
- Put reusable helpers in `src/tests/utils/`.
