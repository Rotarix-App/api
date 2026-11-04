const Router = require('express').Router()

const VehicleController = require('../controllers/vehicle.controller')
const AuthMiddleware = require('../middlewares/auth.middleware')
const roleMiddleware = require('../middlewares/role.middleware')
const SchemaParserMiddleware = require('../middlewares/schema.middleware')

/**
 * @swagger
 * /vehicles:
 *   post:
 *     summary: Register a vehicle in one of the manager's fleets
 *     description: The plate is stored in upper case without the hyphen. The initial odometer is recorded as a manual reading.
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/VehicleInput' }
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
 *                 data: { $ref: '#/components/schemas/Vehicle' }
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
 *       409:
 *         description: plate_already_exists
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       500:
 *         description: internal_server_error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
Router.post('/vehicles', AuthMiddleware, roleMiddleware('manager'), SchemaParserMiddleware(VehicleController.vehicleSchema), VehicleController.store)

/**
 * @swagger
 * /vehicles/{id}:
 *   get:
 *     summary: Get a vehicle with its last reading, trip in progress and assigned drivers
 *     description: Only the manager who owns the vehicle's fleet can access it; other managers get 404.
 *     tags: [Vehicles]
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
 *                 data: { $ref: '#/components/schemas/VehicleDetail' }
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
 *         description: vehicle_not_found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       500:
 *         description: internal_server_error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
Router.get('/vehicles/:id', AuthMiddleware, roleMiddleware('manager'), SchemaParserMiddleware(null, null, VehicleController.paramsSchema), VehicleController.show)

/**
 * @swagger
 * /vehicles/{id}:
 *   put:
 *     summary: Edit a vehicle
 *     description: >-
 *       Moving the vehicle to another of the manager's fleets removes its driver assignments.
 *       A higher odometer is recorded as a manual reading; a lower one is rejected.
 *       Changing the fleet or the odometer is blocked while the vehicle is on a trip.
 *     tags: [Vehicles]
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
 *           schema: { $ref: '#/components/schemas/VehicleInput' }
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
 *                 data: { $ref: '#/components/schemas/Vehicle' }
 *       400:
 *         description: invalid_schema, odometer_below_last_reading
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
 *         description: vehicle_not_found, fleet_not_found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       409:
 *         description: plate_already_exists, vehicle_on_trip
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       500:
 *         description: internal_server_error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
Router.put('/vehicles/:id', AuthMiddleware, roleMiddleware('manager'), SchemaParserMiddleware(VehicleController.vehicleSchema, null, VehicleController.paramsSchema), VehicleController.update)

/**
 * @swagger
 * /vehicles/{id}/status:
 *   patch:
 *     summary: Deactivate or reactivate a vehicle
 *     description: Deactivating is blocked while the vehicle is on a trip. Assignments are kept.
 *     tags: [Vehicles]
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
 *                 data: { $ref: '#/components/schemas/Vehicle' }
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
 *         description: vehicle_not_found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       409:
 *         description: vehicle_on_trip
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       500:
 *         description: internal_server_error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
Router.patch('/vehicles/:id/status', AuthMiddleware, roleMiddleware('manager'), SchemaParserMiddleware(VehicleController.statusSchema, null, VehicleController.paramsSchema), VehicleController.changeStatus)

/**
 * @swagger
 * /vehicles/{id}:
 *   delete:
 *     summary: Delete a vehicle keeping its history
 *     description: >-
 *       Removes the vehicle and its driver assignments. Trips, expenses, readings and photos stay in history.
 *       Blocked while the vehicle is on a trip.
 *     tags: [Vehicles]
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
 *             required: [confirmationPlate]
 *             properties:
 *               confirmationPlate:
 *                 type: string
 *                 description: The vehicle's plate. Case, spaces and the hyphen are ignored.
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
 *         description: invalid_schema, plate_confirmation_mismatch
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
 *         description: vehicle_not_found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       409:
 *         description: vehicle_on_trip
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       500:
 *         description: internal_server_error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
Router.delete('/vehicles/:id', AuthMiddleware, roleMiddleware('manager'), SchemaParserMiddleware(VehicleController.deleteSchema, null, VehicleController.paramsSchema), VehicleController.destroy)

module.exports = Router
