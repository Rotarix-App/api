const Router = require('express').Router()

const FleetController = require('../controllers/fleet.controller')
const AuthMiddleware = require('../middlewares/auth.middleware')
const roleMiddleware = require('../middlewares/role.middleware')
const SchemaParserMiddleware = require('../middlewares/schema.middleware')

/**
 * @swagger
 * /fleets:
 *   post:
 *     summary: Create an active fleet
 *     description: The fleet belongs to the signed-in manager who creates it.
 *     tags: [Fleets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FleetInput'
 *     responses:
 *       201:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: { type: boolean, example: false }
 *                 message: { type: string }
 *                 data: { $ref: '#/components/schemas/Fleet' }
 *       400:
 *         description: invalid_schema
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       401:
 *         description: unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       403:
 *         description: forbidden, account_inactive
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       500:
 *         description: internal_server_error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
Router.post('/fleets', AuthMiddleware, roleMiddleware('manager'), SchemaParserMiddleware(FleetController.fleetSchema, null, null), FleetController.store)

/**
 * @swagger
 * /fleets:
 *   get:
 *     summary: List fleets with name search and status filter
 *     description: Lists only the signed-in manager's fleets.
 *     tags: [Fleets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         description: Literal substring, including numeric fleet names.
 *         schema: { type: string, maxLength: 100 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [active, inactive, all], default: all }
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: { type: boolean, example: false }
 *                 message: { type: string }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/FleetCard' }
 *       400:
 *         description: invalid_schema
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       401:
 *         description: unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       403:
 *         description: forbidden, account_inactive
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       500:
 *         description: internal_server_error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
Router.get('/fleets', AuthMiddleware, roleMiddleware('manager'), SchemaParserMiddleware(null, FleetController.querySchema, null, { stringQueryFields: ['search', 'status'] }), FleetController.index)

/**
 * @swagger
 * /fleets/{id}:
 *   get:
 *     summary: Get a fleet with counts
 *     description: Only the manager who created the fleet can access it; other managers get 404.
 *     tags: [Fleets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer, minimum: 1, maximum: 2147483647 }
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: { type: boolean, example: false }
 *                 message: { type: string }
 *                 data: { $ref: '#/components/schemas/FleetCard' }
 *       400:
 *         description: invalid_schema
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       401:
 *         description: unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       403:
 *         description: forbidden, account_inactive
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       404:
 *         description: fleet_not_found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       500:
 *         description: internal_server_error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
Router.get('/fleets/:id', AuthMiddleware, roleMiddleware('manager'), SchemaParserMiddleware(null, null, FleetController.paramsSchema), FleetController.show)

/**
 * @swagger
 * /fleets/{id}:
 *   put:
 *     summary: Edit fleet data preserving status and links
 *     description: Only the manager who created the fleet can access it; other managers get 404.
 *     tags: [Fleets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer, minimum: 1, maximum: 2147483647 }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FleetInput'
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: { type: boolean, example: false }
 *                 message: { type: string }
 *                 data: { $ref: '#/components/schemas/Fleet' }
 *       400:
 *         description: invalid_schema
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       401:
 *         description: unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       403:
 *         description: forbidden, account_inactive
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       404:
 *         description: fleet_not_found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       500:
 *         description: internal_server_error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
Router.put('/fleets/:id', AuthMiddleware, roleMiddleware('manager'), SchemaParserMiddleware(FleetController.fleetSchema, null, FleetController.paramsSchema), FleetController.update)

/**
 * @swagger
 * /fleets/{id}/status:
 *   patch:
 *     summary: Deactivate or reactivate a fleet preserving links and ongoing trips
 *     description: Only the manager who created the fleet can access it; other managers get 404.
 *     tags: [Fleets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer, minimum: 1, maximum: 2147483647 }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [active, inactive] }
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: { type: boolean, example: false }
 *                 message: { type: string }
 *                 data: { $ref: '#/components/schemas/Fleet' }
 *       400:
 *         description: invalid_schema
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       401:
 *         description: unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       403:
 *         description: forbidden, account_inactive
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       404:
 *         description: fleet_not_found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       500:
 *         description: internal_server_error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
Router.patch('/fleets/:id/status', AuthMiddleware, roleMiddleware('manager'), SchemaParserMiddleware(FleetController.statusSchema, null, FleetController.paramsSchema), FleetController.changeStatus)

/**
 * @swagger
 * /fleets/{id}:
 *   delete:
 *     summary: Delete a fleet keeping vehicles and history
 *     description: Only the manager who created the fleet can access it; other managers get 404.
 *     tags: [Fleets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer, minimum: 1, maximum: 2147483647 }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [confirmationName]
 *             properties:
 *               confirmationName:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 description: Exact current fleet name, including case and spaces. Checked under a row lock.
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: { type: boolean, example: false }
 *                 message: { type: string }
 *                 data: { type: object, example: {} }
 *       400:
 *         description: invalid_schema, fleet_name_confirmation_mismatch
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       401:
 *         description: unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       403:
 *         description: forbidden, account_inactive
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       404:
 *         description: fleet_not_found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       500:
 *         description: internal_server_error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
Router.delete('/fleets/:id', AuthMiddleware, roleMiddleware('manager'), SchemaParserMiddleware(FleetController.deleteSchema, null, FleetController.paramsSchema), FleetController.destroy)

/**
 * @swagger
 * /fleets/{id}/vehicles:
 *   get:
 *     summary: List fleet vehicles and assigned drivers
 *     description: Only the manager who created the fleet can access it; other managers get 404.
 *     tags: [Fleets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer, minimum: 1, maximum: 2147483647 }
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: { type: boolean, example: false }
 *                 message: { type: string }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/FleetVehicle' }
 *       400:
 *         description: invalid_schema
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       401:
 *         description: unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       403:
 *         description: forbidden, account_inactive
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       404:
 *         description: fleet_not_found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       500:
 *         description: internal_server_error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
Router.get('/fleets/:id/vehicles', AuthMiddleware, roleMiddleware('manager'), SchemaParserMiddleware(null, null, FleetController.paramsSchema), FleetController.vehicles)

/**
 * @swagger
 * /fleets/{id}/drivers:
 *   get:
 *     summary: List distinct assigned drivers
 *     description: Only the manager who created the fleet can access it; other managers get 404.
 *     tags: [Fleets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer, minimum: 1, maximum: 2147483647 }
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: { type: boolean, example: false }
 *                 message: { type: string }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/FleetDriver' }
 *       400:
 *         description: invalid_schema
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       401:
 *         description: unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       403:
 *         description: forbidden, account_inactive
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       404:
 *         description: fleet_not_found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       500:
 *         description: internal_server_error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
Router.get('/fleets/:id/drivers', AuthMiddleware, roleMiddleware('manager'), SchemaParserMiddleware(null, null, FleetController.paramsSchema), FleetController.drivers)

module.exports = Router
