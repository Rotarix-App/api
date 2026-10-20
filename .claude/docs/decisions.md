# Decisions

Started 2026-10-18. Every entry here is either stated in the official sources, confirmed by the user with a date, or derived from the Figma prototype under D09. A documented decision isn't necessarily implemented.

## Confirmed by the user

| ID | Date | Decision |
|---|---|---|
| — | 2026-10-18 | Build persistent project memory from the three sources, keeping traceability and the official files intact. |
| — | 2026-10-18 | Inspect the code without changing it. Implement features only after a later approval. |
| — | 2026-10-18 | Ask for approval before major architectural decisions and destructive operations. |
| — | 2026-10-20 | Consolidate the agent instructions, rules, skills and memory under `.claude/`, written in English. |
| **D09** | 2026-10-20 | **The Figma prototype "Rotarix — Protótipo Mobile" (v1.0, 2026-09-26) is the source of truth for functionality**: screens, flows, fields and behavior. Where the official documents diverge, follow the prototype. The official documents still govern non-functional requirements and any rule the prototype doesn't contradict. See [`prototype.md`](prototype.md). |

## From the official sources

| ID | Decision | Source |
|---|---|---|
| D01 | A mobile app for managers and drivers. The web admin panel and offline mode are out of this version. | TAP 1.10; ER Scope |
| D02 | React Native for Android and iOS, with structured data in MySQL. | ER RNF05–RNF06; PI 3 |
| D03 | Tooling: JavaScript, Expo, Figma, VS Code, Git/GitHub and Swagger. MySQL runs on a self-hosted server. | PI 2–3 |
| D04 | Each user has one immutable role, and operational access is limited by role and assignment. | ER RF01, RN01–RN03 |
| D05 | Unique plates, one fleet per vehicle, one trip in progress per driver and per vehicle, odometer readings that never decrease, and a mandatory odometer photo for each reading. | ER RN04–RN08 |
| D06 | When a driver is deleted, their trip and expense history is kept without identification. | ER RF03, RF06; M09, M17 |
| D07 | Secure communication, protected passwords, linked image storage and redundancy or recovery. | ER RNF02, RNF04, RNF05; TAP 1.13 |
| D08 | Timeline 2026-08-17 → 2026-11-25. The prototype is validated before coding, and development runs in weekly increments. | TAP 1.4; PI 3 |

## From the prototype (under D09)

Screen references (Sxx and Mxx) are explained in [`prototype.md`](prototype.md).

| ID | Decision | Prototype | Resolves or changes |
|---|---|---|---|
| D10 | A fleet has a name, **one** "base or region" field and an optional description. The fleet list has search by name, a status filter, and vehicle, driver and on-trip counts. | S06–S07 | Changes RF04 (base and region were two fields) |
| D11 | A fleet is required when creating or editing a vehicle. A vehicle becomes fleetless only when its fleet is deleted, which also removes the assignments. | S09, M03 | P01 |
| D12 | No link ever blocks deletion. Deleting a fleet unlinks its vehicles and removes assignments; deleting a vehicle keeps its trips, expenses and photos; deleting a driver anonymizes them. Only **deactivating** a vehicle during a trip is blocked. | M03, M05, M06, M09 | P02 |
| D13 | A driver is assigned to **one fleet at a time** and to one or more of its vehicles. A vehicle can have several drivers. Inactive fleets can't be chosen. Saving is the confirmation. | S11, S13, S14 | Narrows RF07 |
| D14 | Drivers can sign up themselves (S03) or be created by a manager with a **temporary password** that they change later (S12). After creating a driver, the manager goes straight to assignments. | S03, S12 | Partly P06 |
| D15 | Drivers edit their own name, email, phone, CNH number and CNH category. Managers edit their own name, email and phone. Managers also edit driver data through the driver form. | S20, S37, M07 | P05; changes RF03 |
| D16 | Metrics are manager-only. Filters: period (7, 30 or 90 days, or custom) and fleet. Indicators: total spend with the change against the previous period, spend by category, trips, km, cost per km, spend per 5-day bucket, cost per km for each vehicle, and odometer alerts. Managers also get a read-only activity feed (trips, expenses, maintenance) and trip details with odometer photos. Drivers get a per-trip summary only. | S04–S05, S15–S18, S30 | P08 |
| D17 | Location tracking and chat or messaging are out of scope. | absent | P04 |
| D18 | Only drivers record maintenance, and only on assigned vehicles. Managers view it. | S34, S17 | Changes UC08 |
| D19 | Expenses, refueling and maintenance can be recorded with or without a trip in progress; during a trip they link to it automatically. Refueling has its own form (liters, price per liter, computed total, odometer, gas station) and counts in spend as **Combustível**. Maintenance has its own form (type Preventiva/Corretiva/Urgência, service, amount, workshop, odometer). | S21–S22, S32–S34 | P13 (sub-question P19) |
| D20 | Trip lifecycle: **start** (an assigned vehicle not on a trip, origin, destination, initial odometer ≥ last reading, required photo; the start time is automatic) → **in progress** → **finish** (final odometer, required photo, optional notes, confirmation; the final odometer can't change afterwards) or **cancel** by the driver (ends without an arrival record; expenses kept). A summary follows the finish. | S25–S30, M12, M13, M18 | Partly P12; extends RF10 |
| D21 | Drivers can edit and delete their own expenses. Deleting removes the amount from the trip's spend and deletes the receipt. | M10–M11 | Extends RF11 (limits: P21) |
| D22 | Record dates and times are set automatically; no form asks for them. | S25, S32–S35 | Changes RF11 |
| D23 | Destructive actions need typed confirmation: the fleet name, the plate, or `EXCLUIR` (for deleting driver data and for deleting your own account). | M03, M06, M09, M15, M17 | Details RF03–RF06 |
| D24 | Deactivating a driver removes their fleet and vehicle assignments and blocks their app access. A trip in progress continues. | M08 | Extends RF06 (open part: P12) |
| D25 | Deleting a manager's account erases their personal data but keeps the company's fleets and vehicles. | M15 | Partly P14 |
| D26 | The odometer photo is required for refueling and maintenance; the invoice photo is optional ("recomendado"). | S33–S34 | Partly P10 |

## Technical evidence, not decisions

The repository already uses Node.js/CommonJS, Express 5, Sequelize, Zod, Socket.IO, JWT/bcryptjs and Jest/Supertest, with the layered architecture described in `.claude/rules/architecture.md`. These came from the initial scaffolding. They don't prove that any feature exists. See [`progress.md`](progress.md).

## Not approved yet

- The development plan in [`progress.md`](progress.md), and the validation criteria in [`requirements-analysis.md`](requirements-analysis.md).
- No choice yet on hosting, image storage, the physical schema, a multi-company model (P07) or how service alerts are configured (P09).
- Conventions to settle with the first domain: multi-word file names, how service errors map to HTTP status, JSON field casing and model timestamps (see `.claude/rules/`).

## Recording a new decision

When the user answers an open question (see [`requirements-analysis.md`](requirements-analysis.md#open-questions)) or approves a proposal, add a row:

| ID | Date | Decision | Confirmed by | Resolves |
|---|---|---|---|---|
| D27 | YYYY-MM-DD | … | user | Pxx |

Then update the rules and docs it affects, and set the question's status to **Resolved → Dxx**. If the prototype changes, update [`prototype.md`](prototype.md) and review D10–D26.
