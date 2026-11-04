# Requirements analysis

- 2026-10-18: first full read of the official sources.
- 2026-10-20: translated and restructured, then checked against the PDFs in `RotarixReferences` (same content as `sources/`) and against the Figma prototype.

This is an analysis. It doesn't change the sources, which stay verbatim in Portuguese in [`sources/`](sources/). For **functionality, the prototype wins** (D09); see [`prototype.md`](prototype.md). The business rules, roles and glossary are in [`.claude/rules/domain.md`](../rules/domain.md).

## Sources

| Abbr. | File | Contents | Read it for |
|---|---|---|---|
| — | [prototype.md](prototype.md) and Figma | Screens S01–S37 and modals M01–M24 | **Functionality**: screens, flows, fields, behavior |
| TAP | [TAP_Termo_Abertura_Rotarix.md](sources/TAP_Termo_Abertura_Rotarix.md) | Project charter: team, client, dates, problem, goal, scope, assumptions, risks, acceptance (sections 1.1–1.14) | Scope, deadline, delivery, acceptance |
| ER | [Especificacao_Requisitos_Rotarix.md](sources/Especificacao_Requisitos_Rotarix.md) | Requirements spec: scope, RF01–RF13, UC01–UC08, RNF01–RNF06, RN01–RN08, traceability matrix, user roles, glossary, revisions (v1.4, 2026-09-28) | Business rules, non-functional requirements, validation |
| PI | [Projeto_Intervencao_Rotarix.md](sources/Projeto_Intervencao_Rotarix.md) | Intervention project: problem, justification, objectives, technologies, methodology, schedule, references | Technology background, methodology, evaluation |

## Lookup by task area

| Area | Prototype | Official sections | Open questions |
|---|---|---|---|
| Accounts and profile | S01–S03, S19–S20, S36–S37, M14–M17 | RF01–RF03, UC01, RN01, RNF02 | P06, P14, P20 |
| Fleets | S06–S08, M01–M03 | RF04, UC02, RN02, RN05 | P20, P23 |
| Vehicles | S09–S10, S23–S24, M04–M06 | RF05, RF09, UC03, RN03–RN05 | P09, P20 |
| Drivers and assignments | S11–S14, M07–M09 | RF06, RF07, UC04, RN02–RN03 | P06, P12 |
| Trips and mileage | S21–S22, S25–S30, M12–M13, M18 | RF10, RF13, UC06, RN06–RN08 | P12 |
| Expenses, refueling, maintenance | S31–S35, M10–M11 | RF11, RF12, UC07, UC08, RN08, RNF05 | P10, P17, P18, P19, P21 |
| Metrics and activity | S04–S05, S15–S18 | RF08, UC05, ER User roles | P20 |
| Infrastructure and architecture | — | RNF01–RNF06, PI 2–3, TAP 1.12–1.13 | P11, P15 |
| Acceptance and priorities | — | TAP 1.10, TAP 1.14, PI 3–4 | P16 |

## Functional requirements

The UC column maps each RF to use cases by **content**. It differs from the official traceability matrix (P03). The **Prototype** column shows where the prototype covers the requirement, and **≠** marks a difference (see [Prototype alignment](#prototype-alignment)).

| RF | Summary (official) | UC by content | Prototype |
|---|---|---|---|
| RF01 | Sign up as manager or driver. Required: full name, email, password, phone; drivers also give CNH number and category. Unique email. The role can't change. | UC01 | S02–S03 |
| RF02 | Sign in with email and password, with a clear error message. | UC01 | S01 |
| RF03 | View and edit profile (name, email, phone). Change password (current password plus confirmation). Log out. Delete the account with confirmation; a driver's history is anonymized. CNH shown read-only. | UC01 | S19–S20, S36–S37, M14–M17 ≠ (CNH editable; no change-password screen) |
| RF04 | Fleet create, edit, deactivate, reactivate and delete. Name, base and region required. Search and status filter. Deleting requires typing the name, unlinks vehicles and removes assignments. | UC02 | S06–S08, M01–M03 ≠ (one "Base ou região" field, optional description) |
| RF05 | Vehicle management, each vehicle in exactly one fleet. Plate, brand, model, year and fleet required; unique plate. Service alerts by odometer. No deactivation during a trip. Deleting requires typing the plate. | UC03 | S09–S10, M04–M06 |
| RF06 | Driver management. Name, email, phone, CNH number and category required. Search by name or CNH, filter by status. Deactivation during a trip warns and keeps the trip. Deletion anonymizes history. | UC04 | S11–S13, M07–M09 ≠ (temporary password; deactivation removes assignments and access) |
| RF07 | Pick a fleet and mark its vehicles for a driver. N:N, needs confirmation and at least one vehicle. | UC04 (partly) | S14 ≠ (one fleet per driver) |
| RF08 | Metrics: trips, distance, expenses, other indicators. | UC05 | S04–S05 ≠ (manager only; defined indicators) |
| RF09 | A driver sees assigned vehicles: plate, model, status. | UC06 (partly) | S23–S24 |
| RF10 | Register and follow current trips: origin, destination, date, status, in-route information. | UC06 | S21–S22, S25–S30 ≠ (cancellation, notes, summary) |
| RF11 | A driver records and consults expenses: type, amount, date, description. | UC07 | S31–S32, S35, M10–M11 ≠ (automatic date; edit and delete) |
| RF12 | Attach receipt and invoice (NF) images to expenses. | UC07 | S32–S35 |
| RF13 | Start and end mileage, and the distance. | UC06 | S25, S28, S30 |

UC08 (maintenance) has no RF of its own; in the prototype only drivers record it (S34). Refueling appears in UC07 and TAP 1.14 and has its own form in the prototype (S33).

## Non-functional requirements

These aren't affected by the prototype.

| ID | Requirement |
|---|---|
| RNF01 | Performance: main queries and writes respond in ≤ 3 s on a normal connection. Image uploads may take longer. |
| RNF02 | Security: only authenticated users, with permissions by role. Passwords are hashed or encrypted, and communication is secure. |
| RNF03 | Usability: a simple, consistent UI with clear confirmation, error and validation messages. |
| RNF04 | Availability: the back end is up whenever there's internet, with redundancy or recovery. No offline mode. |
| RNF05 | Storage: structured data persists in MySQL. Receipt and odometer images go to appropriate storage, stay linked to their records and remain retrievable. |
| RNF06 | Portability: a React Native app for Android and iOS from a single codebase. |

## Prototype alignment

Comparison done on 2026-10-20 between the official sources (the PDFs and the markdown in `sources/` are identical) and the Figma prototype v1.0. Where they differ, the prototype wins (D09).

### Confirmed by the prototype

- **Accounts (RF01–RF03):** sign-up with role choice and CNH for drivers; the role never changes; logout with confirmation; account deletion with typed confirmation.
- **Fleets (RF04):** search and status filter; guidance after creating; deactivation keeps links; deletion by typing the name, which unlinks vehicles and removes assignments while keeping history.
- **Vehicles (RF05):**
  - unique plate (RN04) with an explicit error;
  - service alert by km;
  - deactivation blocked during a trip;
  - deletion by typing the plate, after which the vehicle disappears for drivers.
- **Drivers (RF06):** search by name or CNH; status filter; deactivation allowed during a trip with a warning; deletion anonymizes history.
- **Assignments and vehicles (RF07, RF09):** the driver only sees and records on assigned vehicles, and a vehicle can have several drivers. Drivers see plate, model and status.
- **Trips and records:**
  - initial odometer ≥ last reading (RN07);
  - odometer photo on trip start and end, refueling and maintenance (RN08);
  - one trip in progress per driver and per vehicle (RN06);
  - the five expense categories.
- **Scope:** no web panel and no offline mode.

### Changed by the prototype

| Topic | Official sources | Prototype (adopted) | Decision |
|---|---|---|---|
| Fleet location | Base **and** region (RF04) | One field, "Base ou região", plus an optional description | D10 |
| Fleet on a vehicle | Mandatory (RF05) vs. fleetless after fleet deletion (RF04) | Required on create and edit; a vehicle becomes fleetless only when its fleet is deleted | D11 |
| Links that block deletion | UC02–UC04 mention them | Nothing blocks deletion; only deactivating a vehicle during a trip is blocked | D12 |
| Driver ↔ fleet | Pick a fleet, then mark vehicles (RF07) | A driver belongs to **one** fleet at a time, plus N of its vehicles | D13 |
| Who creates drivers | Self sign-up (RF01) vs. manager (RF06) | Both. The manager sets a temporary password, and assignments come next | D14 |
| CNH in the profile | Read-only (RF03) | The driver edits CNH number and category | D15 |
| Metrics | "The user" (RF08) | Manager only, with defined indicators and filters; drivers get a per-trip summary | D16 |
| Location and communication | PI 1.2, 1.3.1 | Absent, so out of scope | D17 |
| Who records maintenance | Manager and driver (UC08) | Driver only; the manager views it in Activity | D18 |
| Expense date | Entered (RF11) | Set automatically when the record is created | D22 |
| Driver deactivation | Warn and keep the trip (RF06) | Also removes assignments and app access | D24 |

### Added by the prototype

| Feature | Screens | Decision |
|---|---|---|
| Records with or without a trip; refueling and maintenance have their own forms; refueling counts as Combustível | S21–S22, S32–S34 | D19 |
| Trip lifecycle: driver cancellation, optional notes on finish, final odometer locked after finishing, trip summary | S28–S30, M12–M13, M18 | D20 |
| The driver edits and deletes their own expenses | M10–M11 | D21 |
| Typed confirmations: fleet name, plate, `EXCLUIR` | M03, M06, M09, M15, M17 | D23 |
| Deleting a manager keeps the company's fleets and vehicles | M15 | D25 |
| Invoice photo optional for refueling and maintenance | S33–S34 | D26 |
| Refueling fields: liters, price per liter, computed total, gas station | S33 | D19 |
| Maintenance fields: type (Preventiva/Corretiva/Urgência), service, workshop | S34 | D19 |
| Manager activity feed (trips, expenses, maintenance) and trip detail with odometer photos | S15–S18 | D16 |
| Vehicle status "Indisponível" in the driver's view | S23, S25 | — |

### Still unanswered

See P06, P09–P12, P14–P23 below.

## Open questions

P stands for *pending*. When the user answers one, record the answer and its date in [`decisions.md`](decisions.md) and update the status here.

| ID | Conflict or gap | Needs a decision on | Status |
|---|---|---|---|
| P01 | RF04 leaves vehicles without a fleet, RF05 makes the fleet mandatory, RN05 allows at most one. | Whether a vehicle can be fleetless | **Resolved → D11** |
| P02 | RF04–RF06 describe deletions; UC02–UC04 mention links that block them. | Which links block deletion, and what happens to history | **Resolved → D12** (deleting a vehicle during a trip: P20) |
| P03 | The official matrix maps RF06→UC03, RF08→UC04, RF10/RF13→UC05; the text points to UC04, UC05, UC06. | Approving a corrected matrix | Open (documentation only) |
| P04 | PI mentions location tracking and communication; no RF covers them. | Scope | **Resolved → D17** (out of scope) |
| P05 | RF03 is ambiguous about read-only fields; RF06 lets managers edit driver data. | Who edits CNH | **Resolved → D15** |
| P06 | RF01 lets drivers sign up; RF06 lets managers register them. | Account creation flow | **Partly → D14.** Still open: how a self-registered driver becomes visible to a manager and gets assigned. Fleets belong to their manager (D27), but drivers don't: should a manager see every driver, only the ones they created, or only the ones assigned to their fleets? |
| P07 | Fleets "under the manager's responsibility"; no ownership or isolation defined. | Access between managers; separation per company | **Resolved → D27** (2026-11-04): each fleet belongs to the manager who created it, and only that manager accesses it. |
| P08 | RF08 says "the user"; UC05 points to the manager. | Who sees metrics, and which ones | **Resolved → D16** |
| P09 | UC08/RN08 require maintenance with photos; RF05 requires service alerts. | Alert kinds, intervals and where they're configured | Open. The prototype shows "Revisão em X km", "Troca de óleo vencida há X km" and "Próxima revisão aos X km", but has no configuration screen. The data model proposes a `service_reminders` table. |
| P10 | RF12 attachments; UC07 "when necessary"; RN08 odometer photo. | Which receipts are required; formats, sizes, retention, storage | **Partly → D26** (invoice optional for refueling and maintenance). Open: receipt on a plain expense (S32); formats and storage. |
| P11 | Intermittent internet, no offline mode. | Messages, retries and duplicate prevention on failed uploads | Open (no failure states in the prototype) |
| P12 | RN06/RN07 need concurrency safety; RF06 lets a deactivated driver finish a trip. | Trip states and transitions; finishing after deactivation; assignment removed mid-trip | **Partly → D20, D24.** Open: M08 says a deactivated driver loses app access while the trip "continues until finished". Who finishes it? |
| P13 | UC07 links expenses to a vehicle or a trip; RF11 stresses "during the trip". | Records outside trips; separate refueling model | **Resolved → D19** (sub-question P19) |
| P14 | RF03/RF06 keep history without identification. | Anonymizing photos and links; effect of deleting a manager | **Partly → D25** (fleets and vehicles kept). Open: photo and document anonymization. |
| P15 | RNF01 "normal connection"; RNF04 has no availability target. | Acceptance environment, load, recovery, backups | Open |
| P16 | PI cover "Projeto Integrador V" vs. title page "X"; ER says requirements were validated, PI says elicitation is future work. | Current revision; was the prototype validated? | Open. Prototype v1.0 exists (2026-09-26); there's no record of client validation. |
| P17 | Maintenance has three types, but the expense categories only include "Manutenção de urgência". S16 and S17 show the same urgent maintenance in both lists. | How preventive and corrective maintenance costs count in spend totals and the category breakdown (S04) | Open |
| P18 | S32 offers the "Combustível" category without liters or odometer, while refueling (S33) requires an odometer photo (RN08) and the hint points fuel to S33. | Whether "Combustível" in a plain expense is allowed or reserved for refueling | Open |
| P19 | Without a trip, the forms (S32–S34) show a single vehicle card, and drivers can have several vehicles. | How the vehicle is chosen for records outside a trip | Open |
| P20 | Flows the prototype doesn't draw: change password (RF03), reactivate a fleet (RF04) or a driver, deactivate a vehicle that isn't on a trip, delete a vehicle during a trip, the manager's view of an expense or maintenance record with its receipt, service-alert configuration (P09), the "at least one vehicle" assignment error (RF07), and empty, error and upload-failure states (P11). | Design these flows, or confirm the official rule applies | Open. The API already implements changing the password as RF03 describes (`PUT /users/@me/password`: current password plus confirmation); only the screen is missing. |
| P21 | M10–M11 let a driver edit and delete expenses, with no limits shown. | Whether there are limits (for example after the trip is finished) and whether managers can edit or delete | Open |
| P22 | M17 (driver deletes their own account) doesn't say what happens to a trip in progress. If the account were deleted anyway, the trip would stay in progress forever and keep its vehicle blocked (RN06). | Whether to block the deletion, or to cancel or close the trip automatically | Open. **Proposal implemented:** `DELETE /users/@me` returns 409 `trip_in_progress` until the trip is finished or cancelled. |
| P23 | D25 (M15) keeps the company's fleets and vehicles when a manager deletes their account, but under D27 only that manager can access their fleets. After the deletion, nobody can reach them. | Whether a manager's fleets are transferred to another manager, blocked from deletion, or left orphaned | Open. Today they are left orphaned: `fleets.manager_id` keeps pointing at the anonymized user. |

## Validation criteria (proposal)

These come from the sources and the prototype, but nobody has run or accepted them yet:

- Positive and negative flows for each prototype screen, and for RF01–RF13 and UC01–UC08 as adjusted by D10–D26.
- Permissions by role and by assignment (RN02, RN03, D13).
- Uniqueness and concurrency (RN04, RN06).
- Odometer readings and photos (RN07, RN08); the final odometer locked after finishing (D20).
- Deactivation and deletion effects (D11, D12, D24, D25).
- RNF01 measured in an agreed environment, plus security and persistence checks.
- The app tested on Android and iOS, and the client evaluation described in PI 3.
