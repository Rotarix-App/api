---
name: new-domain
description: Implement a new domain or resource in the Rotarix API across every layer (SQL table, Sequelize model, repository, service, controller with Zod schemas, routes with Swagger, integration tests), following the project's layered architecture. Use when the user asks to create a module, resource, CRUD or group of endpoints, for example "create the fleets module".
argument-hint: "<domain name, e.g. fleet>"
---

# New domain: $ARGUMENTS

## Preconditions

Stop and ask the user if any of these fails.

- **Implementation is authorized.** Check the status line in `.claude/CLAUDE.md`. While the initialization phase is active, don't write feature code.
- **There's an agreed spec.** If there isn't one, run `/feature-spec` first. The open questions (Pxx) that block this domain must have answers recorded in `.claude/docs/decisions.md`.
- **For the first domain only,** these conventions are still open: multi-word file names, how service errors map to HTTP status, JSON field casing and model timestamps. Propose one option for each, get approval, then record it in `decisions.md` and the matching rule.

## Steps (inside out)

Read `.claude/rules/http-layer.md`, `data-layer.md` and `testing.md` first. Code templates are in [templates.md](templates.md).

1. **Schema.** Add the table(s) to `data/db.sql`. Don't run the script.
2. **Model.** Create `src/app/database/models/<name>.js` and add its associations to `models/associations.js`.
3. **Repository.** Create `src/app/repositories/<name>.repository.js`.
4. **Service.** Create `src/app/services/<name>.service.js` with the business rules and transactions.
5. **Controller.** Create `src/app/controllers/<name>.controller.js` with the Zod schemas and pt-BR messages.
6. **Routes.** Create `src/app/routes/<name>.routes.js` with full paths and an `@swagger` block per endpoint. It's registered automatically.
7. **Tests.** Create `src/tests/entrypoints/<name>/<name>.test.js`, put helpers in `src/tests/utils/` and add the file to the sequencer `order`.
8. **Verify.** Run `npm test` against a database the user has confirmed, and check that `/api-docs` lists the new endpoints. Report what ran, what passed and what you couldn't run.
9. **Record.** Update `.claude/docs/progress.md`. After the first domain, replace the "proposed" notes in `templates.md` and the rules with pointers to the real files.
