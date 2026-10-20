# Layer templates

These templates use **fleet** as the example (S06–S07, M01–M03, D10). They follow the auth/users reference implementation; when in doubt, copy from the real files listed in `SKILL.md`.

## Repository (`src/app/repositories/fleet.repository.js`)

```js
const { Fleet } = require('../database/models')
const utils = require('../utils')

class FleetRepository {
    /**
     * @param {object} where
     * @param {{ transaction?: import('sequelize').Transaction }} options
     */
    async findAll(where = {}, options = {}) {
        const fleets = await Fleet.findAll({ where, order: [['name', 'ASC']], ...options }).catch(utils.logError)
        if (fleets === undefined) return utils.error(500, 'internal_server_error', 'Não foi possível consultar as frotas.')

        return fleets
    }

    /**
     * @param {number} id
     * @param {{ transaction?: import('sequelize').Transaction }} options
     */
    async findById(id, options = {}) {
        const fleet = await Fleet.findByPk(id, options).catch(utils.logError)
        if (fleet === undefined) return utils.error(500, 'internal_server_error', 'Não foi possível consultar a frota.')
        if (!fleet) return utils.error(404, 'fleet_not_found', 'Frota não encontrada.')

        return fleet
    }

    /**
     * @param {object} data
     * @param {{ transaction?: import('sequelize').Transaction }} options
     */
    async create(data, options = {}) {
        const fleet = await Fleet.create(data, options).then((created) => created.reload(options)).catch(utils.logError)
        if (!fleet) return utils.error(500, 'internal_server_error', 'Não foi possível criar a frota.')

        return fleet
    }

    /**
     * @param {number} id
     * @param {object} data
     * @param {{ transaction?: import('sequelize').Transaction }} options
     */
    async update(id, data, options = {}) {
        const result = await Fleet.update(data, { where: { id }, ...options }).catch(utils.logError)
        if (result === undefined) return utils.error(500, 'internal_server_error', 'Não foi possível atualizar a frota.')

        return true
    }
}

module.exports = new FleetRepository()
```

When a table has a unique constraint, map `SequelizeUniqueConstraintError` to a 409 with a domain id, as `user.repository.js` does in `#writeError`.

## Service (`src/app/services/fleet.service.js`)

```js
const FleetRepository = require('../repositories/fleet.repository')

class FleetService {
    /**
     * @param {{ name: string, baseRegion: string, description?: string }} data
     */
    async create(data) {
        return FleetRepository.create(data)
    }

    /**
     * @param {number} id
     * @param {{ name: string, baseRegion: string, description?: string }} data
     */
    async update(id, data) {
        const fleet = await FleetRepository.findById(id)
        if (fleet.error) return fleet

        const updated = await FleetRepository.update(id, data)
        if (updated.error) return updated

        return FleetRepository.findById(id)
    }
}

module.exports = new FleetService()
```

For multi-step writes (deleting a fleet: unlink vehicles, remove assignments, delete), use the unmanaged transaction pattern from `data-layer.md` and `user.service.js#deleteAccount`.

## Controller (`src/app/controllers/fleet.controller.js`)

```js
const express = require('express')
const { z } = require('zod')
const FleetService = require('../services/fleet.service')
const utils = require('../utils')

class FleetController {
    constructor() {
        this.fleetSchema = z.object({
            name: z.string({ error: 'Informe o nome da frota.' }).trim().min(1, 'Informe o nome da frota.').max(100, 'O nome deve ter no máximo 100 caracteres.'),
            baseRegion: z.string({ error: 'Informe a base ou região.' }).trim().min(1, 'Informe a base ou região.').max(120, 'A base ou região deve ter no máximo 120 caracteres.'),
            description: z.string({ error: 'A descrição deve ser um texto.' }).trim().max(255, 'A descrição deve ter no máximo 255 caracteres.').optional()
        })
    }

    /**
     * 
     * @param {express.Request} req 
     * @param {express.Response} res 
     */
    async store(req, res) {
        const fleet = await FleetService.create(req.body)
        if (fleet.error) return utils.sendError(res, fleet)

        return res.status(201).json({
            error: false,
            message: 'Frota criada com sucesso.',
            data: fleet
        })
    }

    /**
     * 
     * @param {express.Request} req 
     * @param {express.Response} res 
     */
    async update(req, res) {
        const fleet = await FleetService.update(Number(req.params.id), req.body)
        if (fleet.error) return utils.sendError(res, fleet)

        return res.status(200).json({
            error: false,
            message: 'Frota atualizada com sucesso.',
            data: fleet
        })
    }
}

module.exports = new FleetController()
```

## Routes (`src/app/routes/fleet.routes.js`)

```js
const Router = require('express').Router()

const FleetController = require('../controllers/fleet.controller')
const AuthMiddleware = require('../middlewares/auth.middleware')
const roleMiddleware = require('../middlewares/role.middleware')
const SchemaParserMiddleware = require('../middlewares/schema.middleware')

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
 *               name: { type: string, example: Grãos · Triângulo }
 *               baseRegion: { type: string, example: 'Uberlândia, MG' }
 *               description: { type: string }
 *     responses:
 *       201:
 *         description: Fleet created
 *       400:
 *         description: invalid_schema
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       401:
 *         description: unauthorized
 *       403:
 *         description: forbidden
 */
Router.post('/fleets', AuthMiddleware, roleMiddleware('manager'), SchemaParserMiddleware(FleetController.fleetSchema), FleetController.store)
Router.put('/fleets/:id', AuthMiddleware, roleMiddleware('manager'), SchemaParserMiddleware(FleetController.fleetSchema), FleetController.update)

module.exports = Router
```

## Tests

Follow the pattern in `.claude/rules/testing.md` (`errors` and `success` groups, `createTestUser`). Put the file at `src/tests/entrypoints/fleet/fleet.test.js` and add it to `order` in `src/tests/sequencer.js`.
