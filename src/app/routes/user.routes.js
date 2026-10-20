const Router = require('express').Router()

const UserController = require('../controllers/user.controller')
const AuthMiddleware = require('../middlewares/auth.middleware')
const SchemaParserMiddleware = require('../middlewares/schema.middleware')

/**
 * @swagger
 * /users/@me:
 *   get:
 *     summary: Get the signed-in user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/UserResponse' }
 *       401:
 *         description: unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       403:
 *         description: account_inactive
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *   put:
 *     summary: Update the signed-in user's profile (drivers also send their CNH)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, phone]
 *             properties:
 *               name: { type: string, example: Anderson Lima }
 *               email: { type: string, format: email, example: anderson.lima@gmail.com }
 *               phone: { type: string, example: '34997451208' }
 *               cnhNumber: { type: string, description: 'Required for drivers, ignored for managers', example: '04728391650' }
 *               cnhCategory: { type: string, enum: [B, C, D, E], description: 'Required for drivers, ignored for managers' }
 *     responses:
 *       200:
 *         description: Profile updated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/UserResponse' }
 *       400:
 *         description: invalid_schema, cnh_required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       401:
 *         description: unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       409:
 *         description: email_already_exists
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *   delete:
 *     summary: Delete the signed-in user's account (personal data is anonymized)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted
 *       401:
 *         description: unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       409:
 *         description: trip_in_progress
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
Router.get('/users/@me', AuthMiddleware, UserController.show)
Router.put('/users/@me', AuthMiddleware, SchemaParserMiddleware(UserController.updateSchema), UserController.update)
Router.delete('/users/@me', AuthMiddleware, UserController.destroy)

/**
 * @swagger
 * /users/@me/password:
 *   put:
 *     summary: Change the signed-in user's password
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword, newPasswordConfirmation]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword: { type: string, description: 'At least 8 characters with upper case, lower case and digits' }
 *               newPasswordConfirmation: { type: string }
 *     responses:
 *       200:
 *         description: Password changed
 *       400:
 *         description: invalid_schema, invalid_current_password
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       401:
 *         description: unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
Router.put('/users/@me/password', AuthMiddleware, SchemaParserMiddleware(UserController.passwordSchema), UserController.updatePassword)

module.exports = Router
