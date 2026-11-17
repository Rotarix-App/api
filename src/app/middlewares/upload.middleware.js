const express = require('express')
const multer = require('multer')
const utils = require('../utils')

const MAX_PHOTO_BYTES = 10 * 1024 * 1024

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_PHOTO_BYTES, files: 1, fields: 5, fieldSize: 1024 }
})

/**
 * @param {string} field
 */
module.exports = (field) => {
    const single = upload.single(field)

    /**
     *
     * @param {express.Request} req
     * @param {express.Response} res
     * @param {express.NextFunction} next
     */
    return (req, res, next) => {
        if (!req.is('multipart/form-data')) {
            return utils.sendError(res, utils.error(400, 'photo_required', 'Envie a foto como multipart/form-data.'))
        }

        single(req, res, (err) => {
            if (!err) return next()
            if (err.code === 'LIMIT_FILE_SIZE') return utils.sendError(res, utils.error(413, 'photo_too_large', 'A foto deve ter no máximo 10 MB.'))

            return utils.sendError(res, utils.error(400, 'invalid_upload', `Envie uma única foto no campo "${field}".`))
        })
    }
}
