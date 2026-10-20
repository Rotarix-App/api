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
- [ ] A new domain has its model, repository, service, controller and routes, and its route file sits in `src/app/routes/` with full paths.
- [ ] Classes are exported as singletons, files follow the naming rule, and handler methods don't use `this`.

### Validation and security
- [ ] Every body and query is validated with Zod through `SchemaParserMiddleware`. The middleware currently discards the body parse result, so code must not rely on transforms or defaults.
- [ ] Protected routes require authentication plus role (RN02) and assignment (RN03, D13) checks. A driver can't reach another driver's data or an unassigned vehicle.
- [ ] Passwords are hashed with bcrypt and never returned. JWTs expire. Secrets come only from the environment.
- [ ] No raw SQL without bind parameters. No credentials or personal data in logs (the request logger prints full bodies).
- [ ] Multi-step writes run in a transaction, and RN06/RN07 hold under concurrent requests.
- [ ] Uploads have their type and size checked, get server-generated names and are linked to their record (RNF05, RN08).

### API contract
- [ ] Responses use the `{ error, message, data }` / `{ error, message, id }` envelope, with pt-BR messages (prototype wording where it exists), English snake_case ids and correct status codes (200, 201, 400, 401, 403, 404, 409, 500).
- [ ] Every endpoint has an `@swagger` block covering parameters, body, responses and `bearerAuth`.

### Tests
- [ ] `src/tests/entrypoints/<domain>/` covers success, validation, 401, authorization and every business-rule `id`.
- [ ] The sequencer `order` is updated, test data is unique, and no test depends on another file's state.

### Memory
- [ ] `.claude/docs/progress.md` reflects the change, and decisions are recorded only if the user confirmed them.

## Severity

| Level | Criteria | Action |
|---|---|---|
| **Blocker** | Security hole, wrong permissions, data loss, crash, violated business rule | Fix before merging |
| **High** | Architecture violation, business logic in the wrong layer, behavior that contradicts the prototype | Fix |
| **Medium** | Missing validation, wrong status code, missing tests | Should fix |
| **Low** | Style, naming, missing docs | Suggestion |
