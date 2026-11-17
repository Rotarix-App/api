const express = require('express')
const { z } = require('zod')
const ActivityService = require('../services/activity.service')
const MetricsService = require('../services/metrics.service')
const fields = require('../utils/schemas')
const utils = require('../utils')

class ActivityController {
    constructor() {
        this.filtersSchema = fields.period.and(z.object({
            fleetId: fields.reference('Escolha uma frota válida.').optional()
        }))

        this.expensesSchema = this.filtersSchema.and(z.object({
            category: z.enum(['all', 'fuel', 'toll', 'food', 'tire_repair', 'urgent_maintenance'], { error: 'Escolha uma categoria válida.' }).default('all')
        }))

        this.paramsSchema = z.object({
            id: fields.id
        })

        this.stringFields = ['from', 'to', 'category']
    }

    /**
     *
     * @param {express.Request} req
     * @param {express.Response} res
     */
    async metrics(req, res) {
        const metrics = await MetricsService.dashboard(req.user.id, req.query)
        if (metrics.error) return utils.sendError(res, metrics)

        return res.status(200).json({
            error: false,
            message: 'Métricas obtidas com sucesso.',
            data: metrics
        })
    }

    /**
     *
     * @param {express.Request} req
     * @param {express.Response} res
     */
    async trips(req, res) {
        const trips = await ActivityService.trips(req.user.id, req.query)
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
    async trip(req, res) {
        const trip = await ActivityService.trip(req.params.id, req.user.id)
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
    async expenses(req, res) {
        const expenses = await ActivityService.expenses(req.user.id, req.query)
        if (expenses.error) return utils.sendError(res, expenses)

        return res.status(200).json({
            error: false,
            message: 'Gastos obtidos com sucesso.',
            data: expenses
        })
    }

    /**
     *
     * @param {express.Request} req
     * @param {express.Response} res
     */
    async maintenances(req, res) {
        const maintenances = await ActivityService.maintenances(req.user.id, req.query)
        if (maintenances.error) return utils.sendError(res, maintenances)

        return res.status(200).json({
            error: false,
            message: 'Manutenções obtidas com sucesso.',
            data: maintenances
        })
    }
}

module.exports = new ActivityController()
