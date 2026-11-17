const Router = require('express').Router()

const RecordController = require('../controllers/record.controller')
const AuthMiddleware = require('../middlewares/auth.middleware')
const roleMiddleware = require('../middlewares/role.middleware')
const SchemaParserMiddleware = require('../middlewares/schema.middleware')

/**
 * @swagger
 * /refuelings:
 *   post:
 *     summary: Record a refueling
 *     description: >-
 *       During a trip in progress the record is linked to it and uses its vehicle; `vehicleId` is ignored.
 *       Outside a trip, `vehicleId` is required and must be one of the driver's assigned vehicles, not on a trip with someone else.
 *       The total is liters × price per liter. The odometer photo is required and the invoice photo optional.
 *       The odometer can't be lower than the vehicle's last reading; it becomes the vehicle's current odometer.
 *     tags: [Refuelings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/RefuelingInput' }
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
 *                 data: { $ref: '#/components/schemas/Refueling' }
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
Router.post('/refuelings', AuthMiddleware, roleMiddleware('driver'), SchemaParserMiddleware(RecordController.refuelingSchema), RecordController.storeRefueling)

/**
 * @swagger
 * /refuelings/{id}:
 *   get:
 *     summary: Get one of the driver's refuelings
 *     description: >-
 *       Refuelings can't be edited or deleted.
 *     tags: [Refuelings]
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
 *                 data: { $ref: '#/components/schemas/Refueling' }
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
 *         description: refueling_not_found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       500:
 *         description: internal_server_error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
Router.get('/refuelings/:id', AuthMiddleware, roleMiddleware('driver'), SchemaParserMiddleware(null, null, RecordController.paramsSchema), RecordController.showRefueling)

module.exports = Router
