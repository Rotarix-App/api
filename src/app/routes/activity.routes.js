const Router = require('express').Router()

const ActivityController = require('../controllers/activity.controller')
const AuthMiddleware = require('../middlewares/auth.middleware')
const roleMiddleware = require('../middlewares/role.middleware')
const SchemaParserMiddleware = require('../middlewares/schema.middleware')

/**
 * @swagger
 * /metrics:
 *   get:
 *     summary: The manager's metrics dashboard
 *     description: >-
 *       Covers the manager's fleets, or one of them with `fleetId` (another manager's fleet answers 404). The period is the last 30 days by default, in Brasília time.
 *       Spend compares with the previous period of the same length. Trips are those started in the period; km and cost per km use trips finished in it.
 *     tags: [Activity]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema: { type: integer, enum: [7, 30, 90], default: 30 }
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date, description: Custom period start (with to) }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date, description: Custom period end, inclusive }
 *       - in: query
 *         name: fleetId
 *         schema: { type: integer, description: One of the manager fleets; all fleets when omitted }
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
 *                 data: { $ref: '#/components/schemas/Metrics' }
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
Router.get('/metrics', AuthMiddleware, roleMiddleware('manager'), SchemaParserMiddleware(null, ActivityController.filtersSchema, null, { stringQueryFields: ActivityController.stringFields }), ActivityController.metrics)

/**
 * @swagger
 * /activity/trips:
 *   get:
 *     summary: Trips of the manager's fleets, newest first
 *     description: >-
 *       Covers the manager's fleets, or one of them with `fleetId` (another manager's fleet answers 404). The period is the last 30 days by default, in Brasília time.
 *     tags: [Activity]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema: { type: integer, enum: [7, 30, 90], default: 30 }
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date, description: Custom period start (with to) }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date, description: Custom period end, inclusive }
 *       - in: query
 *         name: fleetId
 *         schema: { type: integer, description: One of the manager fleets; all fleets when omitted }
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
 *                 data: { type: array, items: { $ref: '#/components/schemas/ActivityTrip' } }
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
Router.get('/activity/trips', AuthMiddleware, roleMiddleware('manager'), SchemaParserMiddleware(null, ActivityController.filtersSchema, null, { stringQueryFields: ActivityController.stringFields }), ActivityController.trips)

/**
 * @swagger
 * /activity/trips/{id}:
 *   get:
 *     summary: A trip of the manager's fleets with its records and odometer photos
 *     description: >-
 *       Read-only. Trips of other managers' fleets answer 404. Photos are downloaded with `GET /photos/{id}`.
 *     tags: [Activity]
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
 *                 data: { $ref: '#/components/schemas/TripDetail' }
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
 *         description: trip_not_found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       500:
 *         description: internal_server_error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
Router.get('/activity/trips/:id', AuthMiddleware, roleMiddleware('manager'), SchemaParserMiddleware(null, null, ActivityController.paramsSchema), ActivityController.trip)

/**
 * @swagger
 * /activity/expenses:
 *   get:
 *     summary: Expenses, refuelings and maintenances of the manager's fleets
 *     description: >-
 *       Covers the manager's fleets, or one of them with `fleetId` (another manager's fleet answers 404). The period is the last 30 days by default, in Brasília time.
 *       Refuelings count as fuel and maintenances as urgent maintenance; `category` filters the list and the totals.
 *     tags: [Activity]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema: { type: integer, enum: [7, 30, 90], default: 30 }
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date, description: Custom period start (with to) }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date, description: Custom period end, inclusive }
 *       - in: query
 *         name: fleetId
 *         schema: { type: integer, description: One of the manager fleets; all fleets when omitted }
 *       - in: query
 *         name: category
 *         schema: { type: string, enum: [all, fuel, toll, food, tire_repair, urgent_maintenance], default: all }
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
 *                 data: { $ref: '#/components/schemas/ActivityExpenses' }
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
Router.get('/activity/expenses', AuthMiddleware, roleMiddleware('manager'), SchemaParserMiddleware(null, ActivityController.expensesSchema, null, { stringQueryFields: ActivityController.stringFields }), ActivityController.expenses)

/**
 * @swagger
 * /activity/maintenances:
 *   get:
 *     summary: Maintenances of the manager's fleets
 *     description: >-
 *       Covers the manager's fleets, or one of them with `fleetId` (another manager's fleet answers 404). The period is the last 30 days by default, in Brasília time.
 *     tags: [Activity]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema: { type: integer, enum: [7, 30, 90], default: 30 }
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date, description: Custom period start (with to) }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date, description: Custom period end, inclusive }
 *       - in: query
 *         name: fleetId
 *         schema: { type: integer, description: One of the manager fleets; all fleets when omitted }
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
 *                 data: { $ref: '#/components/schemas/ActivityMaintenances' }
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
Router.get('/activity/maintenances', AuthMiddleware, roleMiddleware('manager'), SchemaParserMiddleware(null, ActivityController.filtersSchema, null, { stringQueryFields: ActivityController.stringFields }), ActivityController.maintenances)

module.exports = Router
