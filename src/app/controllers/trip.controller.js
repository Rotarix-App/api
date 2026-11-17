const express = require('express')
const { z } = require('zod')
const TripService = require('../services/trip.service')
const PhotoService = require('../services/photo.service')
const fields = require('../utils/schemas')
const utils = require('../utils')

class TripController {
    constructor() {
        this.startSchema = z.object({
            vehicleId: fields.reference('Escolha o veículo da viagem.'),
            origin: z
                .string({ error: 'Informe a origem.' })
                .trim()
                .min(2, 'Informe a origem.')
                .max(120, 'A origem deve ter no máximo 120 caracteres.'),
            destination: z
                .string({ error: 'Informe o destino.' })
                .trim()
                .min(2, 'Informe o destino.')
                .max(120, 'O destino deve ter no máximo 120 caracteres.'),
            startOdometer: fields.odometer,
            odometerPhotoId: fields.reference('Fotografe o odômetro para iniciar a viagem.')
        })

        this.finishSchema = z.object({
            endOdometer: fields.odometer,
            odometerPhotoId: fields.reference('Fotografe o odômetro para finalizar a viagem.'),
            notes: z
                .string({ error: 'As observações devem ser um texto.' })
                .trim()
                .max(500, 'As observações devem ter no máximo 500 caracteres.')
                .nullish()
                .transform((value) => value || null)
        })

        this.listSchema = z.object({
            status: z.enum(['all', 'in_progress', 'finished'], { error: 'Informe um filtro válido: todas, em andamento ou concluídas.' }).default('all')
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
        const trip = await TripService.start(req.user.id, req.body)
        if (trip.error) return utils.sendError(res, trip)

        return res.status(201).json({
            error: false,
            message: 'Viagem iniciada com sucesso.',
            data: trip
        })
    }

    /**
     *
     * @param {express.Request} req
     * @param {express.Response} res
     */
    async index(req, res) {
        const trips = await TripService.list(req.user.id, req.query.status)
        if (trips.error) return utils.sendError(res, trips)

        return res.status(200).json({
            error: false,
            message: 'Viagens obtidas com sucesso.',
            data: trips
        })
    }

    /**
     *
     * @param {express.Request} req
     * @param {express.Response} res
     */
    async current(req, res) {
        const trip = await TripService.findCurrent(req.user.id)
        if (trip?.error) return utils.sendError(res, trip)

        return res.status(200).json({
            error: false,
            message: trip ? 'Viagem em andamento obtida com sucesso.' : 'Nenhuma viagem em andamento.',
            data: trip
        })
    }

    /**
     *
     * @param {express.Request} req
     * @param {express.Response} res
     */
    async show(req, res) {
        const trip = await TripService.findById(req.params.id, req.user.id)
        if (trip.error) return utils.sendError(res, trip)

        return res.status(200).json({
            error: false,
            message: 'Viagem obtida com sucesso.',
            data: trip
        })
    }

    /**
     *
     * @param {express.Request} req
     * @param {express.Response} res
     */
    async uploadOdometerPhoto(req, res) {
        const photo = await PhotoService.upload(req.user.id, 'odometer', req.file)
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
    async finish(req, res) {
        const trip = await TripService.finish(req.params.id, req.user.id, req.body)
        if (trip.error) return utils.sendError(res, trip)

        return res.status(200).json({
            error: false,
            message: 'Viagem finalizada com sucesso.',
            data: trip
        })
    }

    /**
     *
     * @param {express.Request} req
     * @param {express.Response} res
     */
    async cancel(req, res) {
        const trip = await TripService.cancel(req.params.id, req.user.id)
        if (trip.error) return utils.sendError(res, trip)

        return res.status(200).json({
            error: false,
            message: 'Viagem cancelada.',
            data: trip
        })
    }
}

module.exports = new TripController()
