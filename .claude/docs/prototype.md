# Prototype: functional specification

The Figma prototype is the **source of truth for functionality** (screens, flows, fields and behavior) since 2026-10-20 (D09). The official sources still govern non-functional requirements and any rule the prototype doesn't contradict. This file describes what the prototype specifies, with the API implications. How it differs from the official documents is in [`requirements-analysis.md`](requirements-analysis.md#prototype-alignment).

## Source

- **File:** "Rotarix — Protótipo Mobile", version 1.0 of 2026-09-26. [Open in Figma](https://www.figma.com/design/dTeXHA65uZrG3dSnWH0rE8/Rotarix-%E2%80%94-Prot%C3%B3tipo-Mobile?node-id=25-2147). File key `dTeXHA65uZrG3dSnWH0rE8`.
- **Pages:** `Capa` (25:2147), `Fundamentos e componentes` (0:1, design system) and `Telas` (3:4). The screens are on `Telas`, in four sections: `Acesso` (8:2), `Gestor` (8:3), `Motorista` (8:4) and `Modais e confirmações` (36:1691).
- **Numbering:** screens are **S01–S37** (frames `01 · Login` … `37 · Editar perfil`) and modals are **M01–M24**. This file cites them that way.
- **Reading it:** with the Figma MCP, call `create_session` first, then `get_metadata` or a read-only `use_figma` for text and links, and `get_screenshot` for visuals.
- Names, plates, values and dates on the screens are sample data. The "Explorar o protótipo como: Gestor · Motorista" shortcut on S01 is prototype navigation, not a feature.

## Navigation

- **Manager tabs:** Início, Frotas, Motoristas, Atividade, Perfil.
- **Driver tabs:** Início, Veículos, Viagens, Gastos, Perfil.

## Access (S01–S03)

| Screen | Behavior | API implications |
|---|---|---|
| S01 Login | Email and password, then "Entrar" opens the role's home. Link to "Criar conta". No password recovery. | Login returns the account with its role so the app can route it. |
| S02–S03 Sign-up | The user picks **Gestor** or **Motorista** on cards, then fills full name, email, phone and password. Drivers also give CNH number and category (**B, C, D or E**). There's no password confirmation. On success, opens the role's home. | One sign-up endpoint with a role field and conditional CNH fields. The CNH category is an enum of B, C, D, E. |

## Manager

### Home and metrics (S04–S05)

- **Period filter:** 7, 30 or 90 days, or custom dates. **Fleet filter:** all fleets or one.
- **Spend in the period:** the total, the change in % against the previous equal period, and the breakdown by the five expense categories.
- **Indicators:** trips, km driven and cost per km.
- **Scrolled part:** a chart of spend per 5-day bucket, cost per km for each vehicle, and odometer alerts (for example "Revisão em 800 km" or "Troca de óleo vencida há 420 km") with "Ver todos".
- Drivers have no metrics screen (D16).

### Fleets (S06–S08, M01–M03, M19)

- **List (S06):** search by name; filter Ativas, Inativas or Todas. Each card shows the name, base or region, status, vehicle count, driver count and how many are on a trip.
- **Create or edit (S07):** fleet name, **one field "Base ou região"**, and an optional description. After creating, a hint says to add vehicles and assign drivers.
- **Fleet screen (S08):** tabs Veículos, Motoristas and Resumo. Resumo shows fleet-scoped metrics. Each vehicle row shows its status, plate, model, year, a driver name and the odometer. There's an "Adicionar veículo" button.
- **Actions (M01):** edit, deactivate or delete.
- **Deactivate (M02):** the fleet stops being offered for new trips. Vehicles, drivers and history stay, and the fleet can be reactivated. The reactivate action itself isn't drawn (P20).
- **Delete (M03):** requires typing the fleet name and can't be undone. Its vehicles are left without a fleet, the assignments of its drivers are removed, and trips and expenses are kept.

### Vehicles (S09–S10, M04–M06, M20)

- **Create or edit (S09):** plate, brand, model, year, current odometer (km) and fleet, which is required ("Cada veículo pertence a uma única frota"). A duplicate plate gives "Esta placa já está cadastrada em outro veículo."
- **Detail (S10):**
  - Plate, status, model and year.
  - Odometer with the time of the last reading and its photo.
  - Service alert, with the km left and the next service km.
  - Assigned drivers, with an "Atribuir" link.
  - Edit and Deactivate buttons.
- **Actions (M04):** edit, deactivate or delete.
- **Deactivate during a trip (M05):** blocked. The message names the driver and the start time, with links to "Ver viagens em andamento" and "Entendi".
- **Delete (M06):** requires typing the plate. The vehicle disappears for drivers, and trips, expenses and photos stay in history.

### Drivers and assignments (S11–S14, M07–M09, M21)

- **List (S11):** search by name or CNH; filter Todos, Ativos or Inativos. Each row shows a status (Em viagem, Livre or Inativo), the CNH category and the fleet.
- **Create (S12):**
  - Full name, email (used as login), phone, CNH number, CNH category (B–E) and a **temporary password** ("O motorista poderá trocá-la depois em Perfil").
  - Saving goes straight to assignments.
  - Editing a driver (M07 → "Editar motorista") reuses this form.
- **Detail (S13):** status, phone, email, CNH, and the assignments: one fleet plus its vehicles, with "Gerenciar". There's a "Desativar motorista" button.
- **Assignments (S14):**
  - The manager picks **one fleet** with a radio button; inactive fleets are disabled.
  - Then the manager checks any of that fleet's vehicles. A vehicle on a trip is flagged "Em viagem agora".
  - "Salvar atribuições" confirms. The screen explains that the driver only sees and records on the checked vehicles.
- **Deactivate (M08):** the driver can no longer use the app and loses their fleet and vehicle assignments. Trips and expenses are kept. If a trip is in progress, the modal warns that it continues until it's finished.
- **Delete data (M09):** requires typing `EXCLUIR` and can't be undone. Profile, contact data and CNH are removed. Trips and expenses stay in history without personal identification.

### Activity (S15–S18)

All of it is read-only for the manager.

- **Trips (S15):** a "Últimos 30 dias · Todas as frotas" filter, grouped by day. Each row shows the route, status, plate, driver, and the start time or the duration and km.
- **Expenses (S16):** the total for the period and filters by category (Todas, Combustível, Pedágio, Alimentação, …). Each row shows category, amount, plate, driver and time. The rows don't open a detail view (P20).
- **Maintenance (S17):** each row shows amount, type (Preventiva, Corretiva or Urgência), the service done, plate, workshop, date and odometer.
- **Trip detail (S18):**
  - Origin and destination with departure and arrival times.
  - Initial km, final km and km driven, plus the driver and vehicle.
  - Photos of the initial and final odometer.
  - The trip's expenses.
  - The manager has no actions on a trip.

### Profile (S19–S20, M14–M15)

- **View (S19–S20):** name, email (used as login), phone and the role. "Editar perfil" edits name, email and phone. "Alterar senha" has no screen of its own (P20).
- **Log out (M14):** asks for confirmation, then requires a new login.
- **Delete account (M15):** requires typing `EXCLUIR`. Personal data is erased, and **the company's fleets and vehicles are not removed**.

## Driver

### Home (S21–S22)

- **Without a trip (S21):**
  - A "Iniciar viagem" button.
  - Quick records: refueling, maintenance and a new expense. They're available without a trip.
  - "Meus veículos" with each vehicle's status, odometer and service alert.
- **With a trip (S22):**
  - A card for the trip in progress showing the route, plate, elapsed time, departure time and initial odometer.
  - "Registrar nesta viagem" with the same three records.

### Vehicles (S23–S24)

- **List (S23):** only the vehicles assigned to the driver. A vehicle that's on a trip with another driver shows as **Indisponível** ("Em viagem com Wesley Duarte").
- **Detail (S24):**
  - Last odometer reading, with its time and source.
  - Service alert.
  - Recent history of trips and refueling.
  - Actions: Iniciar viagem, Abastecer and Manutenção.

### Trips (S25–S30, M12–M13, M18)

- **Start (S25–S26):**
  - Choose one assigned vehicle; vehicles on a trip with someone else are disabled.
  - Enter origin and destination (city, for example "Uberlândia, MG") and the initial odometer.
  - An initial odometer below the last reading is rejected: "Não pode ser menor que a última leitura: 184.302 km."
  - An odometer photo, taken with the in-app camera, is **required**.
  - The start time is recorded automatically.
- **In progress (S27):**
  - Elapsed time, departure time and initial odometer.
  - The trip's expenses, with the trip total.
  - Buttons: Nova despesa and Finalizar.
- **Trip menu (M12):** new expense, record refueling, or **cancel the trip**.
- **Cancel (M13):** the trip ends without an arrival record, and expenses already recorded stay.
- **Finish (S28, M18):**
  - The driver enters the final odometer; the screen shows the km driven.
  - An odometer photo is required, and the driver can add **optional notes**.
  - A confirmation modal warns that after finishing, **the final odometer can't be changed**.
- **Summary (S30):** km driven, duration, cost per km, the expense total, and how many records have receipts and odometer photos.
- **History (S29):** filter Todas, Em andamento or Concluídas. Each row shows the route, status, plate, date, duration and km.

### Expenses, refueling and maintenance (S31–S35, M10–M11, M22–M24)

- **Overview (S31):** tabs Despesas, Abastecimentos and Manutenções. Shows the month's total and groups records by trip.
- **New expense (S32):**
  - Category: Combustível, Pedágio, Alimentação, Borracharia or Manutenção de urgência.
  - Amount (R$) and an optional description.
  - A receipt photo. The prototype doesn't say whether it's required (P10).
  - During a trip, the expense links to the trip automatically, and the form shows the trip card.
  - A hint says to use "Registrar abastecimento" for fuel with liters and odometer (P18).
- **Refueling (S33):**
  - Vehicle card, liters and price per liter. The total is computed.
  - Odometer and gas station.
  - Odometer photo (**required**) and invoice photo (**recommended**, so optional).
  - The amount counts in spend as **Combustível**.
- **Maintenance (S34):**
  - Vehicle card and type: Preventiva, Corretiva or Urgência.
  - Service performed, amount and workshop.
  - Odometer, odometer photo (**required**) and invoice photo (**recommended**).
- **Record detail (S35):**
  - Receipt photo, amount, and date and time.
  - Trip, vehicle and odometer.
  - Odometer photo, marked "obrigatória".
- **Expense actions (M10–M11):** the driver can **edit or delete** their own expense. Deleting removes the amount from the trip's spend and deletes the receipt.
- **Dates:** no form has a date field. Every record's timestamp is set automatically.

### Profile (S36–S37, M16–M17)

- **View (S36):** name, email (used as login), phone and CNH.
- **Edit (S37):** name, email, phone, **CNH number and CNH category**.
- **Log out (M16):** same as the manager's.
- **Delete account (M17):** requires typing `EXCLUIR`. Personal data and CNH are erased, and trips and expenses stay without identification.

## Statuses

| Entity | Values in the prototype |
|---|---|
| Fleet | Ativa, Inativa |
| Vehicle | Livre, Em viagem. In the driver's view, Indisponível when it's on a trip with another driver. Inactive vehicles are implied by M05 but never shown. |
| Driver | Livre, Em viagem, Inativo |
| Trip | Em andamento, Concluída. Cancelled is implied by M13 but never shown. |
| Maintenance type | Preventiva, Corretiva, Urgência |

## Front-end only

The discard-changes modals (M19–M24), the camera framing hint (S26), greetings and the prototype role shortcut on S01 have no API impact.

## Not designed

These are listed as P20 in `requirements-analysis.md`:
- the change-password screen;
- reactivating a fleet or a driver;
- deactivating a vehicle that isn't on a trip;
- deleting a vehicle during a trip;
- the manager's view of an expense or maintenance record with its receipt;
- configuring service alerts;
- the assignment error "at least one vehicle";
- empty, error and upload-failure states.
