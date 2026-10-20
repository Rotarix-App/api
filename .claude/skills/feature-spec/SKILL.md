---
name: feature-spec
description: Write a technical specification for a Rotarix API feature, endpoint or module (endpoints, Zod validation, data model, business rules, files to touch, test cases), traced to the Figma prototype screens (the functional source of truth), the official requirements (RF/RN/UC) and the open questions. Use when the user asks to spec, design or plan a feature, endpoint or module before implementing it.
argument-hint: "<feature or endpoint to specify>"
---

# Feature spec

Feature: $ARGUMENTS

## 1. Ground it

1. Read the feature's section in `.claude/docs/prototype.md`. **The prototype is the source of truth for functionality (D09).** Use its fields, statuses, validations and user-facing wording. If you need visual detail, open the cited screens in Figma (`create_session`, then `get_screenshot` or a read-only `use_figma`).
2. In `.claude/docs/requirements-analysis.md`, use **Lookup by task area** to find the RF, UC, RN and open questions (Pxx). Read the **Prototype alignment** section for anything the prototype changed. Apply official rules only where the prototype doesn't contradict them.
3. Check `.claude/docs/decisions.md` for confirmed decisions and `.claude/docs/progress.md` for what already exists.
4. List every open question that changes the design. Ask the user about the blocking ones before writing the sections they affect. Never resolve them silently. Label any non-blocking assumption **Proposal**.

## 2. Write the spec

### 1. Overview
Goal, the prototype screens covered (Sxx/Mxx), the requirements and decisions involved (RF, RN, Dxx), and what's explicitly out of scope.

### 2. Endpoints
For each endpoint:

```
METHOD /path
- Auth: AuthMiddleware (+ roleMiddleware('manager' | 'driver') and assignment check) | privateAuthMiddleware | none
- Purpose: what it does, and which screen or action uses it
```

Then the request body and query (`field: type, rules`), the success response in the standard envelope with its status code, and every error with status and `id`.

### 3. Validation (Zod)
Every field with its type, constraints (min, max, regex, enum) and the pt-BR error message. Reuse the shared fields in `src/app/utils/schemas.js` and the prototype's wording where it exists (for example, "Esta placa já está cadastrada em outro veículo.").

### 4. Data model
Tables and columns (types, constraints, defaults), relations and indexes, following `.claude/rules/data-layer.md`. Show the `data/db.sql` addition.

### 5. Business rules
The checks the service runs, in order, each with its error `id` and source (Sxx/Mxx, RN, RF or Dxx). Note where you need transactions or concurrency safety.

### 6. Files to create or modify

| File | Action | Description |
|---|---|---|
| `data/db.sql` | Modify | Table(s) |
| `src/app/database/models/<name>.js` | Create | Sequelize model |
| `src/app/database/models/associations.js` | Modify | Associations |
| `src/app/repositories/<name>.repository.js` | Create | Queries |
| `src/app/services/<name>.service.js` | Create | Business rules |
| `src/app/controllers/<name>.controller.js` | Create | HTTP handlers + Zod schemas |
| `src/app/routes/<name>.routes.js` | Create | Routes + Swagger |
| `src/tests/entrypoints/<name>/<name>.test.js` | Create | Integration tests |
| `src/tests/sequencer.js` | Modify | Test order |

### 7. Test cases
Success, validation, authentication, authorization (role and assignment) and one case for each business-rule error `id`.

### 8. Open questions and proposals
The Pxx items that still affect the feature, plus every assumption labeled **Proposal**.

## Rules

- Follow `.claude/rules/architecture.md` for the response envelope, error ids and naming.
- Write the spec in English. User-facing messages are pt-BR; error ids are English snake_case.
- Don't add features, permissions or rules that aren't in the prototype, the sources or the confirmed decisions.
- Present the spec in the conversation. Write it to a file only if the user asks, and then add the file to the map in `.claude/CLAUDE.md`.
