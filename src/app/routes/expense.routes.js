const Router = require('express').Router()

const RecordController = require('../controllers/record.controller')
const AuthMiddleware = require('../middlewares/auth.middleware')
const roleMiddleware = require('../middlewares/role.middleware')
const SchemaParserMiddleware = require('../middlewares/schema.middleware')

/**
 * @swagger
 * /expenses:
 *   post:
 *     summary: Record an expense (toll, food, tire repair or urgent maintenance)
 *     description: >-
 *       During a trip in progress the record is linked to it and uses its vehicle; `vehicleId` is ignored.
 *       Outside a trip, `vehicleId` is required and must be one of the driver's assigned vehicles, not on a trip with someone else.
 *       Fuel is recorded with `POST /refuelings`. The receipt photo (kind `receipt`) is optional. The time is set by the server.
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ExpenseInput' }
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
 *                 data: { $ref: '#/components/schemas/Expense' }
 *       400:
 *         description: invalid_schema, vehicle_required, invalid_photo_kind
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
Router.post('/expenses', AuthMiddleware, roleMiddleware('driver'), SchemaParserMiddleware(RecordController.expenseSchema), RecordController.storeExpense)

/**
 * @swagger
 * /expenses/{id}:
 *   get:
 *     summary: Get one of the driver's expenses
 *     description: >-
 *       Other users' expenses answer 404.
 *     tags: [Expenses]
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
 *                 data: { $ref: '#/components/schemas/Expense' }
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
 *         description: expense_not_found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       500:
 *         description: internal_server_error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
Router.get('/expenses/:id', AuthMiddleware, roleMiddleware('driver'), SchemaParserMiddleware(null, null, RecordController.paramsSchema), RecordController.showExpense)

/**
 * @swagger
 * /expenses/{id}:
 *   put:
 *     summary: Edit one of the driver's expenses
 *     description: >-
 *       The trip and vehicle stay the same. `receiptPhotoId` omitted keeps the receipt, `null` removes it and a new id replaces it; a removed or replaced receipt is deleted.
 *     tags: [Expenses]
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
 *           schema: { $ref: '#/components/schemas/ExpenseUpdateInput' }
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
 *                 data: { $ref: '#/components/schemas/Expense' }
 *       400:
 *         description: invalid_schema, invalid_photo_kind
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
 *         description: expense_not_found, photo_not_found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       409:
 *         description: photo_already_used
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       500:
 *         description: internal_server_error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
Router.put('/expenses/:id', AuthMiddleware, roleMiddleware('driver'), SchemaParserMiddleware(RecordController.expenseUpdateSchema, null, RecordController.paramsSchema), RecordController.updateExpense)

/**
 * @swagger
 * /expenses/{id}:
 *   delete:
 *     summary: Delete one of the driver's expenses and its receipt
 *     description: >-
 *       The amount leaves the trip and month totals.
 *     tags: [Expenses]
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
 *                 data: { type: object, example: {} }
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
 *         description: expense_not_found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       500:
 *         description: internal_server_error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
Router.delete('/expenses/:id', AuthMiddleware, roleMiddleware('driver'), SchemaParserMiddleware(null, null, RecordController.paramsSchema), RecordController.destroyExpense)

/**
 * @swagger
 * /users/@me/spending:
 *   get:
 *     summary: The driver's expenses, refuelings and maintenances of a month
 *     description: >-
 *       Totals by category count refuelings as fuel and every maintenance as urgent maintenance. Each record carries its trip, so the app can group by trip.
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         schema: { type: string, pattern: "^[0-9]{4}-[0-9]{2}$", description: Defaults to the current month in Brasília time }
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
 *                 data: { $ref: '#/components/schemas/Spending' }
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
Router.get('/users/@me/spending', AuthMiddleware, roleMiddleware('driver'), SchemaParserMiddleware(null, RecordController.spendingSchema, null, { stringQueryFields: ['month'] }), RecordController.spending)

module.exports = Router
