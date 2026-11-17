const Router = require('express').Router()

const TripController = require('../controllers/trip.controller')
const AuthMiddleware = require('../middlewares/auth.middleware')
const roleMiddleware = require('../middlewares/role.middleware')
const SchemaParserMiddleware = require('../middlewares/schema.middleware')
const UploadMiddleware = require('../middlewares/upload.middleware')

/**
 * @swagger
 * /trips:
 *   post:
 *     summary: Start a trip on one of the driver's assigned vehicles
 *     description: >-
 *       Upload the odometer photo first with `POST /photos` (kind `odometer`) and send its id.
 *       The vehicle must be assigned to the driver, active, in an active fleet and not on a trip, and the driver must not have a trip in progress.
 *       The initial odometer can't be lower than the vehicle's last reading. The start time is set by the server.
 *     tags: [Trips]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/TripStartInput' }
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
 *                 data: { $ref: '#/components/schemas/TripDetail' }
 *       400:
 *         description: invalid_schema, odometer_below_last_reading, invalid_photo_kind
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
 *         description: driver_has_trip_in_progress, vehicle_on_trip, vehicle_unavailable, photo_already_used
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       500:
 *         description: internal_server_error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
Router.post('/trips', AuthMiddleware, roleMiddleware('driver'), SchemaParserMiddleware(TripController.startSchema), TripController.store)

/**
 * @swagger
 * /trips:
 *   get:
 *     summary: List the driver's trips, newest first
 *     description: >-
 *       `all` (default) also returns cancelled trips.
 *     tags: [Trips]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [all, in_progress, finished], default: all }
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
 *                 data: { type: array, items: { $ref: '#/components/schemas/Trip' } }
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
Router.get('/trips', AuthMiddleware, roleMiddleware('driver'), SchemaParserMiddleware(null, TripController.listSchema, null, { stringQueryFields: ['status'] }), TripController.index)

/**
 * @swagger
 * /trips/current:
 *   get:
 *     summary: Get the driver's trip in progress
 *     description: >-
 *       Returns `data: null` when the driver has no trip in progress.
 *     tags: [Trips]
 *     security:
 *       - bearerAuth: []
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
 *                 data: { allOf: [{ $ref: '#/components/schemas/TripDetail' }], nullable: true }
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
Router.get('/trips/current', AuthMiddleware, roleMiddleware('driver'), TripController.current)

/**
 * @swagger
 * /trips/{id}:
 *   get:
 *     summary: Get one of the driver's trips with its records and summary
 *     description: >-
 *       Other users' trips answer 404.
 *     tags: [Trips]
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
Router.get('/trips/:id', AuthMiddleware, roleMiddleware('driver'), SchemaParserMiddleware(null, null, TripController.paramsSchema), TripController.show)

/**
 * @swagger
 * /trips/{id}/photos:
 *   post:
 *     summary: Upload the final odometer photo of the driver's trip in progress
 *     description: >-
 *       Same as `POST /photos` with kind `odometer`, but also allowed for a driver deactivated during this trip, so they can finish it.
 *       Only the driver of the trip in progress can upload; otherwise 404.
 *     tags: [Trips]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [photo]
 *             properties:
 *               photo: { type: string, format: binary }
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
 *                 data: { $ref: '#/components/schemas/Photo' }
 *       400:
 *         description: photo_required, invalid_upload, invalid_photo_format
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       401:
 *         description: unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       404:
 *         description: trip_not_found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       413:
 *         description: photo_too_large
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       500:
 *         description: internal_server_error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
Router.post('/trips/:id/photos', AuthMiddleware.forTripAction('finish'), SchemaParserMiddleware(null, null, TripController.paramsSchema), UploadMiddleware('photo'), TripController.uploadOdometerPhoto)

/**
 * @swagger
 * /trips/{id}/finish:
 *   post:
 *     summary: Finish the driver's trip in progress
 *     description: >-
 *       Records the final odometer with its photo (upload it with `POST /trips/{id}/photos`) and optional notes.
 *       The final odometer can't be lower than the vehicle's last reading and can't be changed afterwards.
 *       A driver deactivated during the trip can still finish it. Only the driver of the trip in progress can finish it; otherwise 404.
 *     tags: [Trips]
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
 *           schema: { $ref: '#/components/schemas/TripFinishInput' }
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
 *         description: invalid_schema, odometer_below_last_reading, invalid_photo_kind
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       401:
 *         description: unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       404:
 *         description: trip_not_found, photo_not_found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       409:
 *         description: trip_not_in_progress, photo_already_used
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       500:
 *         description: internal_server_error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
Router.post('/trips/:id/finish', AuthMiddleware.forTripAction('finish'), SchemaParserMiddleware(TripController.finishSchema, null, TripController.paramsSchema), TripController.finish)

/**
 * @swagger
 * /trips/{id}/cancel:
 *   post:
 *     summary: Cancel the driver's trip in progress
 *     description: >-
 *       The trip ends without an arrival record; records already linked to it are kept.
 *       A driver deactivated during the trip can still cancel it. Only the driver of the trip in progress can cancel it; otherwise 404.
 *     tags: [Trips]
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
 *       401:
 *         description: unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       404:
 *         description: trip_not_found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       409:
 *         description: trip_not_in_progress
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       500:
 *         description: internal_server_error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
Router.post('/trips/:id/cancel', AuthMiddleware.forTripAction('cancel'), SchemaParserMiddleware(null, null, TripController.paramsSchema), TripController.cancel)

module.exports = Router
