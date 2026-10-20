const Router = require('express').Router()

const AuthController = require('../controllers/auth.controller')
const SchemaParserMiddleware = require('../middlewares/schema.middleware')

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Create an account (manager or driver) and sign in
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role, name, email, phone, password]
 *             properties:
 *               role: { type: string, enum: [manager, driver] }
 *               name: { type: string, example: Marcos Carvalho }
 *               email: { type: string, format: email, example: marcos@transcarvalho.com.br }
 *               phone: { type: string, description: 'Digits only, with area code', example: '34998124471' }
 *               password: { type: string, description: 'At least 8 characters with upper case, lower case and digits', example: Senha123 }
 *               cnhNumber: { type: string, description: 'Required for drivers, 11 digits', example: '04728391650' }
 *               cnhCategory: { type: string, enum: [B, C, D, E], description: 'Required for drivers' }
 *     responses:
 *       201:
 *         description: Account created
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/AuthResponse' }
 *       400:
 *         description: invalid_schema
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       409:
 *         description: email_already_exists
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
Router.post('/register', SchemaParserMiddleware(AuthController.registerSchema), AuthController.register)

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Sign in with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email, example: marcos@transcarvalho.com.br }
 *               password: { type: string, example: Senha123 }
 *     responses:
 *       200:
 *         description: Signed in
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/AuthResponse' }
 *       400:
 *         description: invalid_schema
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       401:
 *         description: invalid_credentials
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       403:
 *         description: account_inactive
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
Router.post('/login', SchemaParserMiddleware(AuthController.loginSchema), AuthController.login)

module.exports = Router
