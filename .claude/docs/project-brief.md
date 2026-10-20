# Project brief

Background for planning and acceptance. The requirements themselves are in [`requirements-analysis.md`](requirements-analysis.md) and [`.claude/rules/domain.md`](../rules/domain.md).

## Context

- **Client:** Transcarvalho, a trucking company whose fleet manager records each truck's trips and expenses on paper. That works for a few trucks over a few weeks, but not for longer-term metrics (TAP 1.3, 1.5; PI 1.1).
- **Origin:** an extension project ("Projeto Integrador V – Extensão Curricularizada") for the Information Systems course at Centro Universitário de Patos de Minas, built by a six-student team (TAP 1.2; PI cover).
- **Goal:** make recording and querying trips per truck simple for drivers and managers (TAP 1.6), and centralize vehicles, drivers, trips, expenses and maintenance (PI 1.3).
- **Stakeholders:** fleet managers (administrative work) and truck drivers (operations) (TAP 1.11).

## Timeline and method

- **Dates:** 2026-08-17 → 2026-11-25 (TAP 1.4), about four months. The deadline is the only stated constraint (TAP 1.12).
- **Schedule (PI 4):**
  - August: topic and intervention site.
  - September: diagnosis and planning.
  - September to November: the intervention itself.
  - November: results analysis and final report.
- **Method (PI 3):**
  1. Elicit requirements on site with the manager and staff.
  2. Model use-case diagrams and an entity-relationship model.
  3. Build a Figma prototype and have the manager validate it **before coding**.
  4. Develop iteratively and incrementally in weekly iterations, delivering at least one feature per iteration.
  5. Release usable versions for a trial period.
  6. Compare the paper process with the app-supported one and write up results, limitations and future work.
- **Documented stack (PI 2–3):** JavaScript, React Native + Expo for the app, self-hosted MySQL, Swagger, Figma, VS Code, Git/GitHub. All tools are free, and the team provides all resources at no cost to the client.

## Assumptions (TAP 1.12; ER)

- Drivers have smartphones with a camera and mobile data, and basic app literacy.
- A cloud API and image storage will be available.
- Internet on the roads is intermittent.

## Risks

| Risk | Mitigation | Status |
|---|---|---|
| Tampered maintenance or payment records (TAP 1.13) | An odometer photo with every reading (RN08) | Documented |
| Back-end unavailability (TAP 1.13) | Redundant hosting or recovery (RNF04) | Documented, not implemented |
| Short deadline (TAP 1.12) | Weekly increments; scope limited by TAP 1.10 | Ongoing |
| Losing connectivity with no offline mode | Undefined (P11) | Open |

## Acceptance criteria (TAP 1.14)

An app that runs on different mobile operating systems with:

- **Admin module:** fleet management (vehicles and drivers) and metrics.
- **Driver module:** assigned vehicles, plus recording trips, maintenance, refueling and invoices (NF).

The ER adds validations, authorization, photos and RNF01–RNF06. PI 3 adds prototype validation by the client and a trial period.

## Prototype

The Figma prototype "Rotarix — Protótipo Mobile" v1.0 is dated 2026-09-26. It has 37 screens and 24 modals for the access, manager and driver flows, plus a design system page. Since 2026-10-20 it's the source of truth for functionality (D09); see [`prototype.md`](prototype.md). There's no record yet that the client validated it, as PI 3 requires (P16), and nothing has been formally accepted.
