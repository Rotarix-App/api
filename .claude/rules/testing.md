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
- Each integration test may build multiple bcrypt-backed accounts and make several HTTP requests. Jest allows 15 seconds per test and per database lifecycle hook; this is a fixture/workflow timeout, not a claim that individual API requests meet RNF01. Password hashing cost and all assertions remain unchanged.
- `globalSetup` (`src/tests/setup/database.js`):
  - recreates the test database from `data/db.sql` before every run;
  - **refuses to run unless `MYSQL_DATABASE` is exactly `rotarix_test`**, before it opens a connection;
  - rewrites only the `DROP`, `CREATE` and `USE` statements, so `rotarix` itself is never touched.
- `setupFilesAfterEnv` (`src/tests/setup/global.js`) exposes the Express app as `global.app`. After each file it waits for `connection.ready` and closes the Sequelize connection; without that wait, fast files tear down mid-handshake and the run exits with code 1.
- Jest sets `NODE_ENV=test`. `src/config/environment.js` is shared by setup/bootstrap: inherited variables win, followed by `.env.test.local` (ignored by Git), then `.env.test`. Paths are absolute from the repository root. Both loader/setup require exactly `rotarix_test`. The HTTP server and request logger are off.
- **Local MySQL with other credentials:** set the variables inline (`MYSQL_PASSWORD= npm test` for root without a password), or use a private `.env.test.local`, which must never be committed. The user authorized recreating only `rotarix_test`. The legacy command below supplies explicit credentials without printing them; there is no automatic fallback to `.env`:

  ```bash
  ( set -a; eval "$(grep -E '^MYSQL_(HOST|PORT|USERNAME|PASSWORD)=' .env | tr -d '\r')"; set +a; MYSQL_DATABASE=rotarix_test npm test )
  ```

- **CI** (`.github/workflows/test.yml`) starts a MySQL 8 service and runs `npm test` with `MYSQL_DATABASE=rotarix_test`; `globalSetup` builds the schema.
- The custom sequencer `src/tests/sequencer.js` runs the files in its `order` array first (currently `auth.test.js`, `users.test.js`, `fleets.test.js`, `vehicles.test.js`, `drivers.test.js`, `photos.test.js`, `trips.test.js`, `driver-vehicles.test.js`, `records.test.js`, `reminders.test.js`, `activity.test.js`), then the rest alphabetically. Add each new domain's file in dependency order. Tests must still pass in any order.

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

- Photos written by tests go to `UPLOAD_DIR=uploads/test` (`.env.test`), ignored by Git. `trip.util.js` has `uploadPhoto`, `createAssignedDriver` and `startTrip`.
- `createTestUser(role, overrides)` registers a user with a unique email through `POST /register` and returns `{ payload, token, user }`.
- To set up state the API can't create yet (a trip, an inactive user), use the models directly, imported from `src/app/database/models`. `startTripFor` in `users.test.js` is an example.

## Conventions

- Write test names in English (`describe`, `test('Should ...')`).
- For every endpoint, cover success, schema validation (400 `invalid_schema`), authentication (401), authorization by role and assignment (403/404, RN02/RN03), and every business-rule error `id`.
- Assert on `response.body.id`, not on the pt-BR `message`.
- Check that no response exposes `passwordHash`.
- Generate unique data per test (emails come from `buildUser`; suffix plates and names with a timestamp). Don't depend on state left by other tests.
- Put reusable helpers in `src/tests/utils/`.
