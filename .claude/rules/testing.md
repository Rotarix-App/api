---
paths:
  - "src/tests/**"
  - "jest.config.js"
  - ".env.test"
  - ".github/workflows/**"
---

# Testing

The reference implementation is `src/tests/entrypoints/auth/auth.test.js`, `users/users.test.js` and `unit/role.middleware.test.js`.

## Setup

- The stack is Jest 30 with Supertest. `npm test` runs `jest --runInBand`. Every run needs MySQL.
- `globalSetup` (`src/tests/setup/database.js`):
  - recreates the test database from `data/db.sql` before every run;
  - **refuses to run unless `MYSQL_DATABASE` ends in `_test`**;
  - rewrites only the `DROP`, `CREATE` and `USE` statements, so `rotarix` itself is never touched.
- `setupFilesAfterEnv` (`src/tests/setup/global.js`) exposes the Express app as `global.app`. After each file it waits for `connection.ready` and closes the Sequelize connection; without that wait, fast files tear down mid-handshake and the run exits with code 1.
- Jest sets `NODE_ENV=test`, so `.env.test` is loaded (`rotarix_test`, root/root on localhost:3306), the HTTP server doesn't start, and the request logger is off.
- **Local MySQL with other credentials:** variables that are already set win over `.env.test`. The user authorized `rotarix_test` on their local MySQL (2026-10-20). To use the credentials from `.env` without printing them:

  ```bash
  ( set -a; eval "$(grep -E '^MYSQL_(HOST|PORT|USERNAME|PASSWORD)=' .env | tr -d '\r')"; set +a; MYSQL_DATABASE=rotarix_test npm test )
  ```

- **CI** (`.github/workflows/test.yml`) starts a MySQL 8 service and runs `npm test` with `MYSQL_DATABASE=rotarix_test`; `globalSetup` builds the schema.
- The custom sequencer `src/tests/sequencer.js` runs the files in its `order` array first (currently `auth.test.js`, `users.test.js`), then the rest alphabetically. Add each new domain's file in dependency order. Tests must still pass in any order.

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
