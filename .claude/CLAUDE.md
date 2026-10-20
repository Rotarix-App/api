# Rotarix API

Back end (Node.js · Express 5 · Sequelize/MySQL) for **Rotarix**, a mobile fleet-management app for truck managers and drivers, built for the carrier Transcarvalho as a university project (2026-08-17 → 2026-11-25). The React Native/Expo app is not in this repository.

> **Status (2026-10-20): initialization phase.** The user asked for the data model, which exists but awaits approval (`docs/data-model.md`). Do **not** implement features (repositories, services, controllers, routes) until the user explicitly ends the initialization phase.

**The Figma prototype is the source of truth for functionality** (D09): [Rotarix — Protótipo Mobile](https://www.figma.com/design/dTeXHA65uZrG3dSnWH0rE8/Rotarix-%E2%80%94-Prot%C3%B3tipo-Mobile?node-id=25-2147). Its content is written down in `.claude/docs/prototype.md`.

## Map

| Path | Contents | Loaded |
|---|---|---|
| `.claude/rules/architecture.md` | Stack, layers, response envelope, naming, code style, config | Always |
| `.claude/rules/domain.md` | Scope, roles, business rules, lifecycles, statuses, entities, pt-BR → English glossary | Always |
| `.claude/rules/http-layer.md` | Routes, controllers, middlewares, Swagger | When touching those files |
| `.claude/rules/data-layer.md` | Services, repositories, models, SQL schema | When touching those files or `data/` |
| `.claude/rules/testing.md` | Jest/Supertest setup and conventions | When touching `src/tests/`, Jest or CI config |
| `.claude/docs/prototype.md` | Functional spec of every prototype screen (S01–S37) and modal (M01–M24), with API implications | On demand |
| `.claude/docs/data-model.md` | Every table and column with its source screen, relationships, constraints and assumptions; the ERD is in `docs/der/` | On demand |
| `.claude/docs/requirements-analysis.md` | Lookup by task, RF and RNF digest, prototype-vs-docs alignment, open questions P01–P21 | On demand |
| `.claude/docs/decisions.md` | Confirmed decisions (D01–D26) and how to record new ones | On demand |
| `.claude/docs/progress.md` | Work log, what exists in code, known issues, recommended plan | On demand |
| `.claude/docs/project-brief.md` | Client, timeline, method, assumptions, risks, acceptance criteria | On demand |
| `.claude/docs/sources/` | The three official documents, **verbatim, in Portuguese** | Only the sections you need |
| `.claude/skills/` | `/feature-spec`, `/new-domain`, `/api-review` | On invocation |

Before working on a feature:
1. Read its section in `prototype.md`.
2. Use the lookup table in `requirements-analysis.md` to find the related RF/UC/P IDs.
3. Read `decisions.md` and `progress.md`.
4. Open the Figma or the official sources only for the details you still need.

## Working rules

- **Role.** Act as lead developer. The user sets priorities, validates results and approves important decisions.
- **Order of authority.**
  1. User-confirmed decisions (`decisions.md`).
  2. For functionality (screens, flows, fields, behavior), the Figma prototype (D09). For everything else (non-functional requirements, and business rules the prototype doesn't contradict), the official sources.
  3. Derived analysis, then code, then proposals.

  Don't invent features, permissions or rules. Cite IDs (Sxx/Mxx, RF/RNF/RN/UC, Pxx, Dxx) whenever you state a requirement.
- **Label what you say.** Keep documented facts, code evidence and proposals clearly apart. Write down open questions instead of guessing the answer.
- **Ask first** before architectural decisions and destructive operations. Never run `data/db.sql` without explicit authorization, because it starts with `DROP DATABASE`. Confirm which database the tests will hit before running integration tests.
- **Done means verified.** Run the checks that fit the change, fix what fails and report limitations. Having the dependencies, folders or config in place doesn't make a feature done.
- **Keep memory current.**
  - After relevant work, update `progress.md`.
  - Record a decision only after the user confirms it, with the date.
  - Keep proposals and open questions separate.
  - If the prototype changes, update `prototype.md` and review D10–D26.
  - Fix links and tables when files move.
- **Official sources are read-only.** Never edit `docs/sources/`. Changes to official requirements need the user's approval.
- **Secrets.** Never copy `.env` values into docs, logs or output.

## Language

Docs, code identifiers and test names are in English. Text the API returns to users (messages, validation errors) is in Brazilian Portuguese; reuse the prototype's wording where it exists. Error ids are English snake_case. The official sources stay in Portuguese.

## Commands

```bash
docker compose up -d   # MySQL 8 on :3306, root/root, creates database "rotarix"
npm install
npm start              # needs .env (copy .env.example); listens on SERVER_PORT
npm test               # jest --runInBand; NODE_ENV=test loads .env.test (database "rotarix_test")
```
