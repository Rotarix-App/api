---
name: api-review
description: Review Rotarix API changes against the project checklist (prototype and requirements traceability, layered architecture, validation and security, API contract, Swagger, tests) and report findings by severity. Use when the user asks to review code, a diff, a branch or a PR in this repository, or to check an implementation before merging.
argument-hint: "[branch, PR or path; empty = current branch vs main plus uncommitted changes]"
---

# API review

Target: $ARGUMENTS. If empty, review the commits on this branch that aren't in `main` (`git diff main...HEAD`) plus uncommitted changes (`git diff HEAD`).

1. Collect the diff, read every changed file in full, and read the rules for the layers touched (`.claude/rules/`).
2. Go through the checklist below. Report only problems you can point to in the code (`file:line`), each with a concrete failure scenario.
3. Report the findings grouped by severity, then briefly list what you checked and found fine. Don't edit code unless the user asks.

## Checklist

### Requirements
- [ ] Behavior matches the prototype screens (`.claude/docs/prototype.md`, D09), and the official RF/RN/UC where the prototype doesn't contradict them. No invented fields, permissions or rules.
- [ ] Nothing depends on an unresolved open question (Pxx) without a recorded answer.

### Architecture
- [ ] Layers are separate: no business logic in controllers or repositories, no `req`/`res` in services, no queries outside repositories.
- [ ] The code follows the auth/users reference implementation (`.claude/rules/architecture.md`): one-line routes, controllers that call one service method, and repositories that pass `options` through and import models from `database/models`.
- [ ] Expected failures are returned as `utils.error(httpStatus, id, message)` and sent with `utils.sendError`. Nothing throws for expected cases, and database errors are logged and become 500, never "not found".
- [ ] Classes are exported as singletons, files follow the naming rule, methods have JSDoc `@param` and no prose comments, handlers don't use `this`, and requires have no cycles.

### Validation and security
- [ ] Every body and query is validated with Zod through `SchemaParserMiddleware`. Messages use Zod 4's `{ error: '...' }`; `required_error` and `invalid_type_error` are silently ignored.
- [ ] Protected routes use `AuthMiddleware` plus `roleMiddleware(...)` (RN02) and assignment checks (RN03, D13). Another user's or another fleet's resource is a 404. A driver can't reach another driver's data or an unassigned vehicle.
- [ ] Passwords are hashed with bcrypt and never returned (`passwordHash` hidden by scope and `toJSON`). Login errors don't reveal whether an email exists. JWTs expire. Secrets come only from the environment.
- [ ] No raw SQL without bind parameters. No credentials or personal data in logs (the logger masks `password` fields only).
- [ ] Multi-step writes run in a transaction, and RN06/RN07 hold under concurrent requests.
- [ ] Uploads have their type and size checked, get server-generated names and are linked to their record (RNF05, RN08).

### API contract
- [ ] Responses use the `{ error, message, data }` / `{ error, message, id }` envelope, with pt-BR messages (prototype wording where it exists), English snake_case ids and correct status codes (200, 201, 400, 401, 403, 404, 409, 500).
- [ ] Every endpoint has an `@swagger` block covering parameters, body, responses and `bearerAuth`.

### Tests
- [ ] `src/tests/entrypoints/<domain>/` covers success, validation, 401, authorization and every business-rule `id`, grouped into `errors` and `success`.
- [ ] The sequencer `order` is updated, test data is unique, and no test depends on another file's state.
- [ ] `npm test` passes against a `_test` database.

### Memory
- [ ] `.claude/docs/progress.md` reflects the change, and decisions are recorded only if the user confirmed them.

## Severity

| Level | Criteria | Action |
|---|---|---|
| **Blocker** | Security hole, wrong permissions, data loss, crash, violated business rule | Fix before merging |
| **High** | Architecture violation, business logic in the wrong layer, behavior that contradicts the prototype | Fix |
| **Medium** | Missing validation, wrong status code, missing tests | Should fix |
| **Low** | Style, naming, missing docs | Suggestion |
