# Architecture and conventions

These rules describe the code as it is today and the conventions for new code. The **auth and users** module is the reference implementation: copy its shape when you build a new domain.

| Layer | Reference file |
|---|---|
| Routes | `src/app/routes/auth.routes.js`, `user.routes.js` |
| Controllers | `src/app/controllers/auth.controller.js`, `user.controller.js` |
| Services | `src/app/services/auth.service.js`, `user.service.js` (with a transaction) |
| Repositories | `src/app/repositories/user.repository.js` |
| Tests | `src/tests/entrypoints/auth/auth.test.js`, `users/users.test.js` |

## Stack

Node.js (CommonJS) · Express 5 · Sequelize 6 + mysql2 (MySQL 8) · Zod 4 · jsonwebtoken + bcryptjs · swagger-jsdoc + swagger-ui-express · Jest 30 + Supertest · dotenv · colors.

## Layout

```
src/
├── index.js                     # entry: colors, console prefix, dotenv (.env or .env.test), then app
├── prototypes/console.js        # patches console.log with a pt-BR timestamp prefix
├── app/
│   ├── index.js                 # Express app: cors, json/urlencoded, static, logger, Swagger, routes;
│   │                            # starts the HTTP server unless NODE_ENV=test
│   ├── config/swagger.js        # OpenAPI 3 at /api-docs, bearerAuth, shared schemas (User, Error, ...)
│   ├── handlers/routes.handler.js  # mounts every src/app/routes/*.js at "/"
│   ├── routes/                  # <name>.routes.js, one line per endpoint plus @swagger blocks
│   ├── controllers/             # <name>.controller.js, Zod schemas and HTTP handlers
│   ├── services/                # <name>.service.js, business rules and transactions
│   ├── repositories/            # <name>.repository.js, Sequelize queries
│   ├── database/index.js        # Sequelize connection (exported first, `connection.ready`), then models/associations.js
│   ├── database/models/         # 11 Sequelize models, associations.js, index.js (import models from here)
│   ├── middlewares/             # auth (JWT), role, schema (Zod), logger, private.auth (localhost only)
│   └── utils/                   # index.js (error, sendError, logError), schemas.js (shared Zod fields)
└── tests/                       # see testing rule
data/db.sql                      # schema script (destructive: drops the database first)
docs/der/                        # ERD: der.mmd (source), der.png, der.svg
```

## Layers

```
Route → middlewares (AuthMiddleware, roleMiddleware, SchemaParserMiddleware) → Controller → Service → Repository → Model
```

| Layer | Owns | Must not |
|---|---|---|
| Route | `require('express').Router()`, full paths, the middleware chain, `@swagger` JSDoc | contain logic |
| Controller | Zod schemas as instance properties; reads `req`, calls **one** service method, sends the envelope | contain business rules or queries |
| Service | business rules (RN01–RN08, Dxx), orchestration, transactions | touch `req`/`res` |
| Repository | Sequelize queries for one model | contain business rules |
| Model | Sequelize definition | — |

## Errors

Services and repositories never throw expected failures. They **return** an error object built with `utils.error(httpStatus, id, message)`:

```js
return utils.error(409, 'email_already_exists', 'Já existe uma conta cadastrada com este e-mail.')
// → { error: true, httpStatus: 409, id: 'email_already_exists', message: '...' }
```

- The field is called `httpStatus`, so it can't be mixed up with a model's `status` (active or inactive).
- Controllers check `if (result.error) return utils.sendError(res, result)`, which sends `{ error, message, id }` with that status.
- Unexpected database errors are logged with `utils.logError` and become `500 internal_server_error`.
- A resource that belongs to someone else is answered with 404, not 403, so its existence isn't confirmed.

## Response envelope

```json
{ "error": false, "message": "Conta criada com sucesso.", "data": {} }
{ "error": true, "message": "Já existe uma conta cadastrada com este e-mail.", "id": "email_already_exists" }
```

- `message` is Brazilian Portuguese and shown to users.
- `id` is a stable English snake_case identifier. Clients and tests branch on it, never on `message`.
- Schema validation failures return 400, `id: "invalid_schema"`, and `data.errors[]` with `{ message, expected, path }`.

## Patterns adopted from economix-api

`C:\Users\Lucas\Projects\economix-api` is the user's earlier API with the same stack. Kept:
- one-line routes;
- controller classes with Zod schemas in the constructor;
- error objects instead of exceptions;
- JSDoc `@param` on every method;
- a minimal JWT payload with a 7-day expiry;
- reloading the user on every authenticated request, so deactivation takes effect immediately;
- 404 for other users' resources;
- tests grouped into errors and success.

Fixed here:
- Zod 4 messages use `{ error: '...' }`; `required_error` and `invalid_type_error` are Zod 3 and silently ignored.
- Login returns the same `invalid_credentials` for an unknown email and for a wrong password, so accounts can't be enumerated.
- Database failures are 500, not "not found".
- The schema middleware keeps the parsed body.
- No `id = model.null` workaround.
- Error responses always use `id`, never `error_id`.

## Module conventions

- CommonJS (`require` / `module.exports`).
- Controllers, services, repositories and utils are classes exported as singleton instances: `module.exports = new UserService()`. Use private `#methods` for internal helpers.
- Every method has JSDoc `@param` tags and no prose comments.
- Middlewares are plain `(req, res, next)` functions. Configurable ones are factories (`SchemaParserMiddleware(body, query)`, `roleMiddleware('manager')`). Express types come from JSDoc.
- File names are lowercase and dot-separated, `<name>.<layer>.js`. Multi-word names use kebab-case (`vehicle-assignment.repository.js`).
- API JSON uses camelCase field names, matching the model attributes.
- Classes use PascalCase; variables and functions use camelCase.
- Requires flow one way: controllers → services → repositories. A service may require another service, but never in a cycle (`UserService` requires `AuthService`, never the reverse).

## Code style

No linter or formatter is configured, so match the file you are editing:

- `src/` application code: 4-space indent, no semicolons, single quotes.
- `jest.config.js`, `src/tests/sequencer.js` and `src/tests/setup/global.js`: 2-space indent with semicolons.
- Multi-line objects for model attributes (see `data-layer.md`).

## Configuration

- Environment variables through dotenv, read via `process.env.*`: `SERVER_PORT`, `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_DATABASE`, `MYSQL_USERNAME`, `MYSQL_PASSWORD`, `JWT_SECRET`.
- `src/index.js` loads `.env.test` when `NODE_ENV=test` (Jest sets this), otherwise `.env`. dotenv doesn't override variables that are already set; CI and local test runs rely on that.
- Add new variables to `.env.example` (and `.env.test` if tests need them) with placeholder values only.

## Logging

- `console.log` is patched to prefix a pt-BR timestamp. Messages are in Portuguese and use colored tags: `[i]`.cyan for info, `[!]`.green for success, `[i]`.red for failures (`utils.logError`).
- The request logger is off in tests and replaces any body or query field whose name contains "password" with `***`.
