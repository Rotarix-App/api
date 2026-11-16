const Router = require('express').Router()
const DriverController = require('../controllers/driver.controller')
const AuthMiddleware = require('../middlewares/auth.middleware')
const roleMiddleware = require('../middlewares/role.middleware')
const SchemaParserMiddleware = require('../middlewares/schema.middleware')

/**
 * @swagger
 * /drivers:
 *   post:
 *     summary: 'Create a driver with a temporary password (S12, D38)'
 *     description: >-
 *       Shared driver registry for authenticated managers (D38, RF06). Fleet/vehicle ownership remains protected by D27. No direct
 *       manager-driver link.
 *     tags:
 *       - Drivers
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '201':
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Driver'
 *       '400':
 *         description: invalid_schema
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '401':
 *         description: unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '403':
 *         description: 'forbidden, account_inactive'
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '409':
 *         description: email_already_exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '500':
 *         description: internal_server_error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DriverCreateInput'
 */
Router.post('/drivers', AuthMiddleware, roleMiddleware('manager'), SchemaParserMiddleware(DriverController.createSchema, null, null), DriverController.store)

/**
 * @swagger
 * /drivers:
 *   get:
 *     summary: 'List shared drivers (S11, D38)'
 *     description: >-
 *       Shared driver registry for authenticated managers (D38, RF06). Fleet/vehicle ownership remains protected by D27. No direct
 *       manager-driver link.
 *     tags:
 *       - Drivers
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Driver'
 *       '400':
 *         description: invalid_schema
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '401':
 *         description: unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '403':
 *         description: 'forbidden, account_inactive'
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '500':
 *         description: internal_server_error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     parameters:
 *       - in: query
 *         name: search
 *         description: 'Literal substring of name or CNH, including leading zeroes.'
 *         schema:
 *           type: string
 *           maxLength: 120
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum:
 *             - all
 *             - active
 *             - inactive
 *           default: all
 */
Router.get('/drivers', AuthMiddleware, roleMiddleware('manager'), SchemaParserMiddleware(null, DriverController.querySchema, null, { stringQueryFields: ['search', 'status'] }), DriverController.index)



/**
 * @swagger
 * '/drivers/{id}':
 *   get:
 *     summary: Get an driver and assignments (S13)
 *     description: >-
 *       Shared driver registry for authenticated managers (D38, RF06). Fleet/vehicle ownership remains protected by D27. No direct
 *       manager-driver link.
 *     tags:
 *       - Drivers
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Driver'
 *       '400':
 *         description: invalid_schema
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '401':
 *         description: unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '403':
 *         description: 'forbidden, account_inactive'
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '404':
 *         description: driver_not_found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '500':
 *         description: internal_server_error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 2147483647
 */
Router.get('/drivers/:id', AuthMiddleware, roleMiddleware('manager'), SchemaParserMiddleware(null, null, DriverController.paramsSchema), DriverController.show)

/**
 * @swagger
 * '/drivers/{id}':
 *   put:
 *     summary: Edit driver profile (M07); password changes use the driver profile flow
 *     description: >-
 *       Shared driver registry for authenticated managers (D38, RF06). Fleet/vehicle ownership remains protected by D27. No direct
 *       manager-driver link.
 *     tags:
 *       - Drivers
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Driver'
 *       '400':
 *         description: invalid_schema
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '401':
 *         description: unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '403':
 *         description: 'forbidden, account_inactive'
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '404':
 *         description: driver_not_found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '409':
 *         description: email_already_exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '500':
 *         description: internal_server_error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 2147483647
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DriverInput'
 */
Router.put('/drivers/:id', AuthMiddleware, roleMiddleware('manager'), SchemaParserMiddleware(DriverController.driverSchema, null, DriverController.paramsSchema), DriverController.update)

/**
 * @swagger
 * '/drivers/{id}/status':
 *   patch:
 *     summary: 'Idempotent deactivation/reactivation; removes assignments on deactivation (D24, D33, D36)'
 *     description: >-
 *       Shared driver registry for authenticated managers (D38, RF06). Fleet/vehicle ownership remains protected by D27. No direct
 *       manager-driver link.
 *     tags:
 *       - Drivers
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Driver'
 *       '400':
 *         description: invalid_schema
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '401':
 *         description: unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '403':
 *         description: 'forbidden, account_inactive'
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '404':
 *         description: driver_not_found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '500':
 *         description: internal_server_error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 2147483647
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DriverStatusInput'
 */
Router.patch('/drivers/:id/status', AuthMiddleware, roleMiddleware('manager'), SchemaParserMiddleware(DriverController.statusSchema, null, DriverController.paramsSchema), DriverController.changeStatus)

/**
 * @swagger
 * '/drivers/{id}':
 *   delete:
 *     summary: 'Anonymize driver data; confirmation must equal EXCLUIR (M09, D34)'
 *     description: >-
 *       Shared driver registry for authenticated managers (D38, RF06). Fleet/vehicle ownership remains protected by D27. No direct
 *       manager-driver link.
 *     tags:
 *       - Drivers
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       '400':
 *         description: 'invalid_schema, confirmation_mismatch'
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '401':
 *         description: unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '403':
 *         description: 'forbidden, account_inactive'
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '404':
 *         description: driver_not_found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '409':
 *         description: driver_has_trip_in_progress
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '500':
 *         description: internal_server_error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 2147483647
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DriverDeleteInput'
 */
Router.delete('/drivers/:id', AuthMiddleware, roleMiddleware('manager'), SchemaParserMiddleware(DriverController.deleteSchema, null, DriverController.paramsSchema), DriverController.destroy)

/**
 * @swagger
 * '/drivers/{id}/assignments':
 *   delete:
 *     summary: Release current vehicle assignments explicitly (D38); only their fleet manager may release
 *     description: >-
 *       Shared driver registry for authenticated managers (D38, RF06). Fleet/vehicle ownership remains protected by D27. No direct
 *       manager-driver link.
 *     tags:
 *       - Drivers
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       '400':
 *         description: invalid_schema
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '401':
 *         description: unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '403':
 *         description: 'forbidden, account_inactive'
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '404':
 *         description: driver_not_found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '409':
 *         description: 'driver_assigned_to_another_manager, driver_has_trip_in_progress'
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '500':
 *         description: internal_server_error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 2147483647
 */
Router.delete('/drivers/:id/assignments', AuthMiddleware, roleMiddleware('manager'), SchemaParserMiddleware(null, null, DriverController.paramsSchema), DriverController.release)

/**
 * @swagger
 * '/drivers/{id}/assignments':
 *   put:
 *     summary: 'Replace assignments in one active owned fleet; keep ongoing trip vehicle (S14, D35)'
 *     description: >-
 *       Shared driver registry for authenticated managers (D38, RF06). Fleet/vehicle ownership remains protected by D27. No direct
 *       manager-driver link.
 *     tags:
 *       - Drivers
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Driver'
 *       '400':
 *         description: invalid_schema
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '401':
 *         description: unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '403':
 *         description: 'forbidden, account_inactive'
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '404':
 *         description: 'driver_not_found, fleet_not_found, vehicle_not_found'
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '409':
 *         description: 'driver_assigned_to_another_manager, driver_has_trip_in_progress, fleet_inactive'
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '500':
 *         description: internal_server_error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 2147483647
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DriverAssignmentInput'
 */
Router.put('/drivers/:id/assignments', AuthMiddleware, roleMiddleware('manager'), SchemaParserMiddleware(DriverController.assignSchema, null, DriverController.paramsSchema), DriverController.assign)

module.exports = Router
