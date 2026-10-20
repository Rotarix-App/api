# Architecture and conventions

These rules describe the code as it is today and the conventions for new code. Where the two differ, the rule says so. No business domain has been implemented yet. The first domain you build becomes the reference implementation, so update these rules to point at it.

## Stack

Node.js (CommonJS) · Express 5 · Sequelize 6 + mysql2 (MySQL 8) · Zod 4 · jsonwebtoken + bcryptjs (installed, not used yet) · swagger-jsdoc + swagger-ui-express · Socket.IO 4 · Jest 30 + Supertest · dotenv · colors.

## Layout

```
src/
├── index.js                     # entry: colors, console prefix, dotenv (.env or .env.test), then app
├── prototypes/console.js        # patches console.log with a pt-BR timestamp prefix
├── app/
│   ├── index.js                 # Express app: cors, json/urlencoded, static, logger, Swagger, routes;
│   │                            # starts HTTP + Socket.IO unless NODE_ENV=test
│   ├── config/swagger.js        # OpenAPI 3 at /api-docs, bearerAuth scheme, scans src/app/routes/*.js
│   ├── handlers/routes.handler.js  # mounts every src/app/routes/*.js at "/"
│   ├── routes/ controllers/ services/ repositories/   # empty (.gitkeep)
│   ├── database/index.js        # Sequelize connection (exported first), then loads models/associations.js
│   ├── database/models/         # Sequelize models + associations.js
│   ├── middlewares/             # logger, private.auth (localhost only), schema (Zod)
│   ├── socket/socketio.js       # Socket.IO wrapper; rooms "account:<id>"
│   └── utils/index.js           # singleton Utils (empty)
└── tests/                       # see testing rule
data/db.sql                      # schema script (destructive: drops the database first)
```

## Layers

```
Route → middlewares (auth, SchemaParserMiddleware) → Controller → Service → Repository → Model
```

| Layer | File | Owns | Must not |
|---|---|---|---|
| Route | `src/app/routes/<name>.routes.js` | `express.Router()`, full paths, middleware chain, `@swagger` JSDoc | contain logic |
| Controller | `src/app/controllers/<name>.controller.js` | Zod schemas as instance properties; reads `req`, calls the service, maps the result to status + envelope | contain business rules or queries |
| Service | `src/app/services/<name>.service.js` | business rules (RN01–RN08), orchestration, transactions | touch `req`/`res` |
| Repository | `src/app/repositories/<name>.repository.js` | Sequelize queries | contain business rules |
| Model | `src/app/database/models/<name>.js` | Sequelize definition | — |

Services and repositories report expected failures by **returning** `{ error: true, message, id }` instead of throwing.

## Response envelope

```json
{ "error": false, "message": "Frota criada com sucesso.", "data": {} }
{ "error": true, "message": "Já existe uma conta com este e-mail.", "id": "email_already_exists" }
```

- `message` is Brazilian Portuguese and shown to users.
- `id` is a stable English snake_case identifier. Clients and tests branch on it, never on `message`.
- Schema validation failures return 400, `id: "invalid_schema"`, and `data.errors[]` with `{ message, expected, path }`.
- Known divergence: `private.auth.middleware.js` returns `error_id` instead of `id`.

## Module conventions

- CommonJS (`require` / `module.exports`).
- Controllers, services, repositories and utils are classes exported as singleton instances: `module.exports = new FleetService()`.
- Middlewares are plain `(req, res, next)` functions. Configurable ones are factories: `schema.middleware.js` exports `(bodySchema, querySchema) => middleware`. Express types come from JSDoc (`@param {express.Request} req`).
- File names are lowercase and dot-separated, `<name>.<layer>.js` (`private.auth.middleware.js`, `routes.handler.js`). Multi-word names aren't settled yet. The old prompt said kebab-case, but no file uses it. Ask before creating the first multi-word file.
- Classes use PascalCase; variables and functions use camelCase.

## Code style

No linter or formatter is configured, so match the file you are editing:

- `src/` application code: 4-space indent, no semicolons, mostly single quotes.
- `jest.config.js` and `src/tests/sequencer.js`: 2-space indent with semicolons.

## Configuration

- Environment variables through dotenv, read via `process.env.*`: `SERVER_PORT`, `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_DATABASE`, `MYSQL_USERNAME`, `MYSQL_PASSWORD`, `JWT_SECRET`.
- `src/index.js` loads `.env.test` when `NODE_ENV=test` (Jest sets this), otherwise `.env`. dotenv doesn't override variables that are already set, and CI relies on that.
- Add new variables to `.env.example` (and `.env.test` if tests need them) with placeholder values only.

## Logging

`console.log` is patched to prefix a pt-BR timestamp. Existing messages are in Portuguese and use colored tags: `[i]`.cyan for info, `[!]`.green for success, red for failures, `[WSS]` for socket events. The request logger is off in tests.
