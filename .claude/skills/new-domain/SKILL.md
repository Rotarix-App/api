---
name: new-domain
description: Implement a new domain or resource in the Rotarix API across every layer (repository, service, controller with Zod schemas, routes with Swagger, integration tests, and schema or model changes if needed), following the project's layered architecture and the auth/users reference implementation. Use when the user asks to create a module, resource, CRUD or group of endpoints, for example "create the fleets module".
argument-hint: "<domain name, e.g. fleet>"
---

# New domain: $ARGUMENTS

## Preconditions

Stop and ask the user if either of these fails.

- **Implementation is authorized.** Check the status line in `.claude/CLAUDE.md`. While a domain still waits for approval, don't write its code.
- **There's an agreed spec.** If there isn't one, run `/feature-spec` first. The open questions (Pxx) that block this domain must have answers recorded in `.claude/docs/decisions.md`.

## Reference implementation

Auth and users is the canonical example. Read it before writing anything:

| Layer | Files |
|---|---|
| Routes | `src/app/routes/user.routes.js` (`AuthMiddleware`, `SchemaParserMiddleware`, `@swagger`) |
| Controller | `src/app/controllers/user.controller.js` (Zod schemas from `utils/schemas.js`, `utils.sendError`) |
| Service | `src/app/services/user.service.js` (rules, unmanaged transaction) |
| Repository | `src/app/repositories/user.repository.js` (read/write error handling, `options`) |
| Tests | `src/tests/entrypoints/users/users.test.js`, `src/tests/utils/user.util.js` |

Then read `.claude/rules/http-layer.md`, `data-layer.md` and `testing.md`. The shapes for a new domain are in [templates.md](templates.md).

## Steps (inside out)

1. **Schema and model.** The 11 tables and models already exist (`.claude/docs/data-model.md`). If the domain needs a change, edit `data/db.sql`, the model, `models/associations.js` and `docs/der/der.mmd` together, and regenerate the ERD image.
2. **Repository.** Create `src/app/repositories/<name>.repository.js`. Import models from `../database/models` and pass `options` through.
3. **Service.** Create `src/app/services/<name>.service.js` with the business rules (Sxx/Mxx, RN, Dxx), transactions and ownership checks. A resource of another user or fleet is answered with 404.
4. **Controller.** Create `src/app/controllers/<name>.controller.js`. Build Zod schemas from `utils/schemas.js` (add new shared fields there) and use pt-BR messages with Zod 4's `{ error }`.
5. **Routes.** Create `src/app/routes/<name>.routes.js`: one line per endpoint, `AuthMiddleware` plus `roleMiddleware(...)` where the role matters (RN02), and `@swagger` blocks that reuse the shared schemas in `config/swagger.js`. Routes are registered automatically.
6. **Tests.** Create `src/tests/entrypoints/<name>/<name>.test.js` with `errors` and `success` groups per endpoint. Use `createTestUser`, and add the file to the sequencer `order`.
7. **Verify.** Run `npm test` (it recreates `rotarix_test`; see `testing.md` for local credentials) and parse the Swagger annotations. Report what ran, what passed and what you couldn't run.
8. **Record.** Update `.claude/docs/progress.md` and, if behavior was decided along the way, `decisions.md` (proposals stay proposals until the user confirms them).
