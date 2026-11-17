const Router = require('express').Router()

const PhotoController = require('../controllers/photo.controller')
const AuthMiddleware = require('../middlewares/auth.middleware')
const roleMiddleware = require('../middlewares/role.middleware')
const SchemaParserMiddleware = require('../middlewares/schema.middleware')
const UploadMiddleware = require('../middlewares/upload.middleware')

/**
 * @swagger
 * /photos:
 *   post:
 *     summary: Upload a photo taken in the app
 *     description: >-
 *       Stores an odometer, receipt or invoice photo and returns its id, which the record forms then reference
 *       (for example `odometerPhotoId` when starting or finishing a trip). JPEG, PNG or WebP up to 10 MB;
 *       the format is detected from the file content. Each photo can be linked to one record only.
 *     tags: [Photos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [kind, photo]
 *             properties:
 *               kind: { type: string, enum: [odometer, receipt, invoice] }
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
 *         description: invalid_schema, photo_required, invalid_upload, invalid_photo_format
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
Router.post('/photos', AuthMiddleware, roleMiddleware('driver'), UploadMiddleware('photo'), SchemaParserMiddleware(PhotoController.uploadSchema), PhotoController.store)

/**
 * @swagger
 * /photos/{id}:
 *   get:
 *     summary: Download a photo
 *     description: Returns the image bytes. Only the user who uploaded the photo can download it; anyone else gets 404.
 *     tags: [Photos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer, minimum: 1, maximum: 2147483647 }
 *     responses:
 *       200:
 *         description: The image
 *         content:
 *           image/jpeg: {}
 *           image/png: {}
 *           image/webp: {}
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
 *         description: photo_not_found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       500:
 *         description: internal_server_error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
Router.get('/photos/:id', AuthMiddleware, roleMiddleware('driver'), SchemaParserMiddleware(null, null, PhotoController.paramsSchema), PhotoController.show)

module.exports = Router
