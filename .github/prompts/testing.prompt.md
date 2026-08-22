---
description: "Use when writing tests, creating test files, or understanding the testing setup. Covers Jest configuration, test patterns, and conventions for the Rotarix backend."
agent: "agent"
argument-hint: "Descreva o endpoint ou feature para gerar testes"
---

# Testes — Rotarix Backend

## Setup

- **Framework**: Jest 30 + Supertest
- **Banco de testes**: MySQL dedicado (`rotarix_test`, via `.env.test` com `NODE_ENV=test`)
- **Execução**: `npm test` (roda com `--runInBand` para sequência garantida)
- **Sequencer customizado**: `src/tests/sequencer.js`
- **Setup global**: `src/tests/setup/global.js`

## Estrutura de Arquivos

```
src/tests/
├── sequencer.js          # Ordem de execução dos testes
├── setup/
│   └── global.js         # Setup global (cria banco, tabelas)
├── entrypoints/
│   └── <domínio>/
│       └── <domínio>.test.js
└── utils/
    └── <domínio>.util.js  # Helpers (criação de dados de teste)
```

## Test Pattern

```javascript
const request = require('supertest')
const app = require('../../../app')

describe('POST /endpoint', () => {
    test('Should return success with valid data', async () => {
        const response = await request(app)
            .post('/endpoint')
            .send({ field: 'value' })

        expect(response.status).toBe(200)
        expect(response.body.error).toBe(false)
        expect(response.body.data).toBeDefined()
    })

    test('Should return an error with invalid data', async () => {
        const response = await request(app)
            .post('/endpoint')
            .send({})

        expect(response.status).toBe(400)
        expect(response.body.error).toBe(true)
    })
})
```

## Authenticated routes

```javascript
const { createTestAccount, getAuthToken } = require('../../utils/account.util')

describe('GET /accounts/@me', () => {
    let token

    beforeAll(async () => {
        token = await getAuthToken()
    })

    test('Should return account data', async () => {
        const response = await request(app)
            .get('/accounts/@me')
            .set('Authorization', `Bearer ${token}`)

        expect(response.status).toBe(200)
    })

    test('Should return 401 without token', async () => {
        const response = await request(app)
            .get('/accounts/@me')

        expect(response.status).toBe(401)
    })
})
```

## Conventions

- Each domain has its own folder in `src/tests/entrypoints/`
- Write test descriptions in English using `describe`/`test`
- Always test: success, schema validation, authentication, business rules
- Reusable helpers go in `src/tests/utils/`
- Do not depend on ordering between different test files
- Use unique data per test to avoid conflicts
