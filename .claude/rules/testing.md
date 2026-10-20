---
paths:
  - "src/tests/**"
  - "jest.config.js"
  - ".env.test"
  - ".github/workflows/**"
---

# Testing

## Setup

- The stack is Jest 30 with Supertest. `npm test` runs `jest --runInBand`.
- `testMatch` is `src/tests/**/*.test.js`. There are no test files yet.
- `setupFilesAfterEnv` runs `src/tests/setup/global.js`, which requires `src/index.js` and exposes the Express app as `global.app`. It does **not** create the database or tables.
- Jest sets `NODE_ENV=test`, so `src/index.js` loads `.env.test` (database `rotarix_test`), the HTTP server and Socket.IO don't start, and the request logger is off. Importing `src/index.js` also calls `console.clear()`.
- The custom sequencer `src/tests/sequencer.js` runs the files in its `order` array first, in that order, and the rest alphabetically. When you add a domain, add its test file to `order` in dependency order (accounts before fleets before vehicles, for example).
- CI (`.github/workflows/test.yml`) starts a MySQL 8 service, runs `data/db.sql`, then runs `npm test` with environment variables pointing at database `rotarix`. Those variables override `.env.test`, so CI and local runs use different databases.
- Locally, nothing creates `rotarix_test` or its schema. Before running integration tests, confirm with the user which database they'll hit. Never point tests at a database that holds real data.
- If MySQL is unreachable, `database/index.js` calls `process.exit()` and the Jest run dies with status 0.

## Structure

```
src/tests/
├── sequencer.js
├── setup/global.js
├── entrypoints/<domain>/<domain>.test.js   # integration tests, one folder per domain
└── utils/<domain>.util.js                  # fixtures and helpers (createTestAccount, getAuthToken, ...)
```

## Pattern

This example is illustrative; no routes exist yet.

```js
const request = require('supertest')
const { getAuthToken } = require('../../utils/account.util')

describe('POST /fleets', () => {
    let token

    beforeAll(async () => {
        token = await getAuthToken({ role: 'manager' })
    })

    test('Should create a fleet with valid data', async () => {
        const response = await request(global.app)
            .post('/fleets')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: `Fleet ${Date.now()}`, base: 'Patos de Minas', region: 'MG' })

        expect(response.status).toBe(201)
        expect(response.body.error).toBe(false)
        expect(response.body.data).toBeDefined()
    })

    test('Should reject a missing name', async () => {
        const response = await request(global.app)
            .post('/fleets')
            .set('Authorization', `Bearer ${token}`)
            .send({ base: 'Patos de Minas', region: 'MG' })

        expect(response.status).toBe(400)
        expect(response.body.id).toBe('invalid_schema')
    })

    test('Should return 401 without a token', async () => {
        const response = await request(global.app).post('/fleets').send({})

        expect(response.status).toBe(401)
    })
})
```

## Conventions

- Write test names in English (`describe`, `test('Should ...')`).
- For every endpoint, cover success, schema validation (400 `invalid_schema`), authentication (401), authorization by role and assignment (RN02/RN03), and every business-rule error `id`.
- Assert on `response.body.id`, not on the pt-BR `message`.
- Check that no response exposes `password`.
- Generate unique data per test (suffix emails and plates with a timestamp, for example). Don't depend on state left by other test files.
- Put reusable helpers in `src/tests/utils/`.
