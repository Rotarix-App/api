const express = require('express')
const { z } = require('zod')
const PhotoService = require('../services/photo.service')
const fields = require('../utils/schemas')
const utils = require('../utils')

class PhotoController {
    constructor() {
        this.uploadSchema = z.object({
            kind: z.enum(['odometer', 'receipt', 'invoice'], { error: 'Informe o tipo da foto: odômetro, comprovante ou nota fiscal.' })
        })

        this.paramsSchema = z.object({
            id: fields.id
        })
    }

    /**
     *
     * @param {express.Request} req
     * @param {express.Response} res
     */
    async store(req, res) {
        const photo = await PhotoService.upload(req.user.id, req.body.kind, req.file)
        if (photo.error) return utils.sendError(res, photo)

        return res.status(201).json({
            error: false,
            message: 'Foto enviada com sucesso.',
            data: photo
        })
    }

    /**
     *
     * @param {express.Request} req
     * @param {express.Response} res
     */
    async show(req, res) {
        const file = await PhotoService.findFile(req.params.id, req.user.id)
        if (file.error) return utils.sendError(res, file)

        res.set('Cache-Control', 'private, max-age=86400')
        return res.type(file.mimeType).sendFile(file.path, (err) => {
            if (!err || res.headersSent) return
            utils.logError(err)
            utils.sendError(res, utils.error(404, 'photo_not_found', 'Foto não encontrada.'))
        })
    }
}

module.exports = new PhotoController()
