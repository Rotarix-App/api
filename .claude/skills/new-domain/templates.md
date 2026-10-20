# Layer templates

These templates follow the conventions in `.claude/rules/` and use **fleet** as the example. Lines marked *Proposed* depend on a convention that's still open. Once the first domain is merged, replace this file with pointers to its real files.

## Schema and model

All 11 tables and models already exist; see `.claude/docs/data-model.md`.
- **Real references:** `data/db.sql` (the `fleets` table), `src/app/database/models/fleet.js` and `models/associations.js`.
- **New table:** follow the same pattern. Add the model to `models/index.js`, its associations to `associations.js`, and the entity to `docs/der/der.mmd`, then regenerate the image.

## Repository (`src/app/repositories/fleet.repository.js`)

```js
const { Fleet } = require('../database/models')

class FleetRepository {
    async create(data, options = {}) {
        return Fleet.create(data, options)
    }

    async findById(id, options = {}) {
        const fleet = await Fleet.findByPk(id, options)
        if (!fleet) return { error: true, message: 'Frota não encontrada.', id: 'fleet_not_found' }
        return fleet
    }
}

module.exports = new FleetRepository()
```

`options` lets services pass `{ transaction }`.

## Service (`src/app/services/fleet.service.js`)

```js
const fleetRepository = require('../repositories/fleet.repository')

class FleetService {
    async create(data) {
        return fleetRepository.create(data)
    }

    async getById(fleetId) {
        const fleet = await fleetRepository.findById(fleetId)
        if (fleet.error) return fleet

        // Access checks (RN02/RN03) and other business rules go here.
        return fleet
    }
}

module.exports = new FleetService()
```

For multi-step writes, use `connection.transaction(...)` (`const connection = require('../database')`). Pass `{ transaction, lock: true }` when reading a row you're about to update under RN06/RN07. In a managed transaction, returning an error object **commits**. Throw to roll back, or use an unmanaged transaction and call `rollback()` before you return the error.

## Controller (`src/app/controllers/fleet.controller.js`)

```js
const { z } = require('zod')
const fleetService = require('../services/fleet.service')

class FleetController {
    constructor() {
        this.createSchema = z.object({
            name: z.string({ error: 'Informe o nome da frota.' }).trim().min(1, 'Informe o nome da frota.'),
            baseRegion: z.string({ error: 'Informe a base ou região.' }).trim().min(1, 'Informe a base ou região.'),
            description: z.string().trim().max(255, 'A descrição deve ter até 255 caracteres.').optional()
        })
    }

    // Routes pass handlers by reference, so don't use `this` inside them.
    async create(req, res) {
        const result = await fleetService.create(req.body)

        if (result.error) {
            // Proposed: the service sets `status` on its error objects.
            return res.status(result.status ?? 400).json({ error: true, message: result.message, id: result.id })
        }

        return res.status(201).json({ error: false, message: 'Frota criada com sucesso.', data: result })
    }
}

module.exports = new FleetController()
```

## Routes (`src/app/routes/fleet.routes.js`)

```js
const express = require('express')
const SchemaParserMiddleware = require('../middlewares/schema.middleware')
const fleetController = require('../controllers/fleet.controller')

const router = express.Router()

/**
 * @swagger
 * /fleets:
 *   post:
 *     summary: Create a fleet
 *     tags: [Fleets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, baseRegion]
 *             properties:
 *               name: { type: string }
 *               baseRegion: { type: string }
 *               description: { type: string }
 *     responses:
 *       201:
 *         description: Fleet created
 *       400:
 *         description: invalid_schema
 *       401:
 *         description: unauthorized
 */
// Auth and the manager-role check (RN02) go before the schema middleware once they exist.
router.post('/fleets', SchemaParserMiddleware(fleetController.createSchema), fleetController.create)

module.exports = router
```

## Tests

See the pattern in `.claude/rules/testing.md`. Put the file at `src/tests/entrypoints/fleet/fleet.test.js` and add it to `order` in `src/tests/sequencer.js`.
