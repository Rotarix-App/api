# Domain

What Rotarix does and the rules it enforces. **Functionality follows the Figma prototype (D09)**; the details are in `.claude/docs/prototype.md`. The official sources (`.claude/docs/sources/`, Portuguese) still govern non-functional requirements and any rule the prototype doesn't contradict. This is a conceptual model, not an approved schema.

ID prefixes:
- **RF**, **RNF**, **RN**, **UC**: functional requirement, non-functional requirement, business rule and use case, from the requirements spec (**ER**).
- **TAP** is the project charter and **PI** the intervention project.
- **Sxx** and **Mxx** are prototype screens and modals.
- **Dxx** is a decision (`docs/decisions.md`) and **Pxx** an open question (`docs/requirements-analysis.md`).

## Product

Transcarvalho, a trucking company, records trips and expenses on paper (TAP 1.5; PI 1.1). Rotarix moves these records into a mobile app for Android and iOS (RNF06) used by managers and drivers.

- **Manager:** fleets, vehicles, drivers, assignments, a metrics dashboard and an activity feed.
- **Driver:** assigned vehicles, trips, expenses, refueling and maintenance, with odometer and receipt photos.
- **Expense categories:** Combustível, Pedágio, Alimentação, Borracharia and Manutenção de urgência.
- **Out of scope:** a web admin panel and offline mode (TAP 1.10), and location tracking and chat (D17).

## Roles

Each user has exactly one role, chosen at sign-up and never changed: **manager** (*gestor*) or **driver** (*motorista*) (RF01, RN01).

| Capability | Manager | Driver | Source |
|---|---|---|---|
| Sign up, sign in, edit own profile, change password, log out, delete own account | ✓ | ✓ (also edits own CNH) | RF01–RF03, D15 |
| Create, edit, deactivate and delete fleets and vehicles | ✓ | — | RF04–RF05, RN02 |
| Create drivers (temporary password), edit, deactivate, delete their data | ✓ | — | RF06, D14, D24 |
| Assign a driver to one fleet and to some of its vehicles | ✓ | — | RF07, D13 |
| Metrics dashboard and activity feed (read-only) | ✓ | — (per-trip summary only) | D16 |
| See vehicles | ✓ | assigned ones only | RN03, RF09 |
| Start, finish and cancel trips | — | own trips, on assigned vehicles | D20, RN03 |
| Record expenses, refueling and maintenance | — | on assigned vehicles, with or without a trip | D18, D19, RN03 |
| Edit and delete expenses | — | own expenses | D21 (limits: P21) |

A manager only accesses the fleets they created (D27), and so only their vehicles and assignments. Who sees which drivers is still open (P06), and so is what happens to a deleted manager's fleets (P23).

## Business rules

| ID | Rule |
|---|---|
| RN01 | Each user has exactly one role, manager or driver. It can't change after sign-up. |
| RN02 | Only managers manage fleets, vehicles and drivers, and assign drivers. |
| RN03 | A driver sees only the vehicles assigned to them, and records trips, expenses and maintenance only on those vehicles. |
| RN04 | License plates are unique across the whole system. Error message: "Esta placa já está cadastrada em outro veículo." |
| RN05 | A vehicle belongs to at most one fleet. A fleet is required on create and edit; a vehicle becomes fleetless only when its fleet is deleted (D11). |
| RN06 | A vehicle has at most one trip in progress, and so does a driver. Drivers see a vehicle that's on a trip with someone else as "Indisponível". |
| RN07 | A trip's final km must be ≥ its initial km. No odometer reading may be lower than the vehicle's last recorded reading. The final odometer can't change after the trip is finished (D20). |
| RN08 | Trip start and end, refueling and maintenance each need an odometer photo. The invoice photo is optional for refueling and maintenance (D26). |

## Lifecycle rules

- **Fleet** (RF04, D10, D12, D27–D29).
  - Fields: name, **one "base or region" field**, optional description. It belongs to the manager who created it.
  - Deactivating blocks new trips but keeps vehicles, drivers and history; the fleet can be reactivated. Its vehicles keep their own status but are unavailable while it's inactive (D29).
  - Deleting requires typing the fleet name and can't be undone. It deletes the fleet's vehicles too (history kept) and removes their assignments; it's blocked while any of its vehicles is on a trip (D28).
- **Vehicle** (RF05, D11, D12, D28–D31).
  - Fields: plate, brand, model, year, current odometer, fleet. It's always in a fleet of its manager.
  - Available = active vehicle, active fleet and no trip in progress.
  - Moving it to another fleet removes its assignments. Moving it, changing its odometer, deactivating it and deleting it are blocked during a trip (D30, D31).
  - The manager can only raise the odometer, which records a manual reading (D31).
  - Deleting requires typing the plate. The vehicle disappears for drivers, while its trips, expenses and photos are kept.
  - Service alerts come from odometer readings ("Revisão em 800 km", "Troca de óleo vencida há 420 km"). Where they're configured is undefined (P09).
- **Driver** (RF06, D14, D24).
  - Created by a manager (name, email, phone, CNH number, CNH category B/C/D/E, temporary password) or through self sign-up.
  - Deactivating removes their assignments and blocks app access; a trip in progress continues (who finishes it: P12).
  - Deleting their data requires typing `EXCLUIR` and anonymizes their history.
- **Assignment** (RF07, D13).
  - A driver works in one fleet at a time, with one or more of its vehicles; a vehicle can have several drivers.
  - The driver's fleet isn't stored. It's the fleet of their assigned vehicles, so all of those vehicles must belong to the same active fleet.
  - Inactive fleets can't be chosen, and saving requires at least one vehicle.
  - Anything that takes a vehicle out of a fleet removes its assignments.
- **Trip** (D20).
  - **Start:** an assigned vehicle not on a trip, origin, destination, initial odometer and a required photo. The start time is automatic.
  - **In progress:** records link to the trip automatically.
  - **Finish:** final odometer, required photo, optional notes and a confirmation.
  - **Cancel:** by the driver; the trip ends without an arrival and its expenses are kept.
  - **Summary:** km, duration, cost per km and total expenses.
- **Expense** (RF11–RF12, D19, D21, D22).
  - Fields: category, amount, optional description and a receipt photo (whether it's required: P10). The timestamp is automatic.
  - It links to the trip in progress, or otherwise to a vehicle (P19).
  - The driver can edit or delete it. Deleting removes the receipt.
- **Refueling** (D19). Liters, price per liter, computed total, odometer, gas station, odometer photo and optional invoice photo. It counts in spend as Combustível.
- **Maintenance** (D18, D19). Type (Preventiva, Corretiva or Urgência), service, amount, workshop, odometer, odometer photo and optional invoice photo. Only drivers record it. How its cost appears in the categories is undefined (P17).
- **Account** (RF01–RF03, D15, D23, D25).
  - Required fields: full name, unique email, password and phone. Drivers also need CNH number and category.
  - Changing the password requires the current one and a confirmation (RF03; the screen isn't designed yet, P20).
  - Logging out forces a new login.
  - Deleting your account requires typing `EXCLUIR`. Deleting a manager keeps the company's fleets and vehicles.

## Statuses

| Entity | Values |
|---|---|
| Fleet | active, inactive (*Ativa*, *Inativa*) |
| Vehicle | free, on a trip (*Livre*, *Em viagem*), plus inactive. In the driver's view, *Indisponível* when another driver has it on a trip. |
| Driver | free, on a trip, inactive (*Livre*, *Em viagem*, *Inativo*) |
| Trip | in progress, finished, cancelled (*Em andamento*, *Concluída*, cancelled) |
| Maintenance type | preventive, corrective, urgent (*Preventiva*, *Corretiva*, *Urgência*) |

## Entities

Summary only. The physical schema (tables, columns, constraints) is in `.claude/docs/data-model.md`, and the ERD in `docs/der/der.png`.

| Entity | Data and links |
|---|---|
| User | role, full name, email (unique, used as login), password (hashed), phone, status; drivers also have CNH number and category (B–E) |
| Fleet | name, base or region, description, status; groups vehicles |
| Vehicle | plate (unique), brand, model, year, current odometer with the time and photo of the last reading, status, fleet |
| Assignment | driver ↔ vehicles (N:N), all in one fleet; the driver's fleet is derived from these vehicles |
| Trip | driver, vehicle, origin, destination, start and end times, start and end odometer with photos, notes, status |
| Expense | category, amount, description, receipt photo, timestamp; linked to a trip or a vehicle |
| Refueling | liters, price per liter, total, odometer with photo, gas station, invoice photo; counts as a Combustível expense |
| Maintenance | type, service, amount, workshop, odometer with photo, invoice photo, vehicle, trip if any |
| Photo | odometer, receipt or invoice image linked to its record, stored outside MySQL (RNF05) |
| Odometer reading | every reading of a vehicle (manual, trip start or end, refueling, maintenance) with its photo; the source of RN07 |
| Service reminder | a vehicle's next service by km ("Revisão", "Troca de óleo"); a proposal (P09) |

The data model applies these as proposals awaiting approval: one company with fleets owned by their manager (D27), and refueling and maintenance as separate tables (P17, P18).

## Glossary (pt-BR → English)

| pt-BR | English |
|---|---|
| gestor | manager |
| motorista | driver |
| frota | fleet |
| veículo | vehicle |
| placa | plate |
| atribuição | assignment |
| viagem | trip |
| despesa, gasto | expense |
| abastecimento | refueling |
| manutenção (preventiva, corretiva, urgência) | maintenance (preventive, corrective, urgent) |
| oficina | workshop |
| posto | gas station |
| borracharia | tire repair |
| pedágio | toll |
| alimentação | food |
| odômetro, hodômetro | odometer |
| quilometragem | mileage (km) |
| comprovante | receipt |
| NF, nota fiscal | invoice |
| CNH | driver's license (number and category) |
| alerta de revisão | service alert |
| base ou região | base or region |
| senha provisória | temporary password |
| observações | notes |
| cancelar viagem | cancel trip |
