# Layer templates

No domain code exists yet. These templates follow the conventions in `.claude/rules/` and use **fleet** (RF04) as the example. Lines marked *Proposed* depend on conventions that are still open. Once the first domain is merged, replace this file with pointers to its real files.

## SQL (`data/db.sql`)

```sql
CREATE TABLE `fleets` (
	`id` INT(11) NOT NULL AUTO_INCREMENT,
	`name` VARCHAR(128) NOT NULL,
	`base` VARCHAR(128) NOT NULL,
	`region` VARCHAR(128) NOT NULL,
	`status` ENUM('active','inactive') NOT NULL DEFAULT 'active',
	`created_at` BIGINT(20) NULL DEFAULT (unix_timestamp() * 1000),
	`updated_at` BIGINT(20) NULL DEFAULT (unix_timestamp() * 1000),
	PRIMARY KEY (`id`) USING BTREE
)
COLLATE='utf8mb4_general_ci'
ENGINE=InnoDB
;
```

## Model (`src/app/database/models/fleet.js`)

```js
const { DataTypes } = require('sequelize')
const connection = require('..')

const Fleet = connection.define('Fleet', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(128), allowNull: false },
    base: { type: DataTypes.STRING(128), allowNull: false },
    region: { type: DataTypes.STRING(128), allowNull: false },
    status: { type: DataTypes.ENUM('active', 'inactive'), allowNull: false, defaultValue: 'active' },
    created_at: { type: DataTypes.BIGINT },
    updated_at: { type: DataTypes.BIGINT }
}, {
    tableName: 'fleets',
    // Proposed: keep the BIGINT unix-ms columns and fill them in hooks.
    timestamps: false,
    hooks: {
        beforeCreate: (fleet) => { fleet.created_at = fleet.updated_at = Date.now() },
        beforeUpdate: (fleet) => { fleet.updated_at = Date.now() }
    }
})

module.exports = Fleet
```

Associations go in `models/associations.js`:

```js
const Fleet = require('./fleet')
const Vehicle = require('./vehicle')

Fleet.hasMany(Vehicle, { foreignKey: 'fleet_id', as: 'vehicles' })
Vehicle.belongsTo(Fleet, { foreignKey: 'fleet_id', as: 'fleet' })
```

## Repository (`src/app/repositories/fleet.repository.js`)

```js
const Fleet = require('../database/models/fleet')

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

For multi-step writes, use `connection.transaction(...)` (`const connection = require('../database')`). In a managed transaction, returning an error object **commits**. Throw to roll back, or use an unmanaged transaction and call `rollback()` before you return the error.

## Controller (`src/app/controllers/fleet.controller.js`)

```js
const { z } = require('zod')
const fleetService = require('../services/fleet.service')

class FleetController {
    constructor() {
        this.createSchema = z.object({
            name: z.string({ error: 'Informe o nome da frota.' }).trim().min(1, 'Informe o nome da frota.'),
            base: z.string({ error: 'Informe a base da frota.' }).trim().min(1, 'Informe a base da frota.'),
            region: z.string({ error: 'Informe a região da frota.' }).trim().min(1, 'Informe a região da frota.')
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
 *             required: [name, base, region]
 *             properties:
 *               name: { type: string }
 *               base: { type: string }
 *               region: { type: string }
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
