const Router = require('express').Router()

const RecordController = require('../controllers/record.controller')
const AuthMiddleware = require('../middlewares/auth.middleware')
const roleMiddleware = require('../middlewares/role.middleware')
const SchemaParserMiddleware = require('../middlewares/schema.middleware')

/**
 * @swagger
 * /maintenances:
 *   post:
 *     summary: Record a maintenance
 *     description: >-
 *       During a trip in progress the record is linked to it and uses its vehicle; `vehicleId` is ignored.
 *       Outside a trip, `vehicleId` is required and must be one of the driver's assigned vehicles, not on a trip with someone else.
 *       The odometer photo is required and the invoice photo optional; the odometer follows the same rule as refuelings.
 *       A preventive maintenance completes the due service reminder with the lowest due odometer and schedules the next one when it has an interval.
 *     tags: [Maintenances]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/MaintenanceInput' }
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
 *                 data: { $ref: '#/components/schemas/Maintenance' }
 *       400:
 *         description: invalid_schema, vehicle_required, odometer_below_last_reading, invalid_photo_kind
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
 *         description: vehicle_not_found, photo_not_found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       409:
 *         description: vehicle_on_trip, photo_already_used, trip_state_changed
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       500:
 *         description: internal_server_error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
Router.post('/maintenances', AuthMiddleware, roleMiddleware('driver'), SchemaParserMiddleware(RecordController.maintenanceSchema), RecordController.storeMaintenance)

/**
 * @swagger
 * /maintenances/{id}:
 *   get:
 *     summary: Get one of the driver's maintenances
 *     description: >-
 *       Maintenances can't be edited or deleted.
 *     tags: [Maintenances]
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
 *                 data: { $ref: '#/components/schemas/Maintenance' }
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
 *         description: maintenance_not_found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       500:
 *         description: internal_server_error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
Router.get('/maintenances/:id', AuthMiddleware, roleMiddleware('driver'), SchemaParserMiddleware(null, null, RecordController.paramsSchema), RecordController.showMaintenance)

module.exports = Router
