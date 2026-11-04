const express = require('express')
const { z } = require('zod')
const FleetService = require('../services/fleet.service')
const utils = require('../utils')

class FleetController {
    constructor() {
        this.fleetSchema = z.object({
            name: z.string({ error: 'Informe o nome da frota.' }).trim().min(1, 'Informe o nome da frota.').max(100, 'O nome da frota deve ter no máximo 100 caracteres.'),
            baseRegion: z.string({ error: 'Informe a base ou região.' }).trim().min(1, 'Informe a base ou região.').max(120, 'A base ou região deve ter no máximo 120 caracteres.'),
            description: z.string({ error: 'A descrição deve ser um texto.' }).trim().max(255, 'A descrição deve ter no máximo 255 caracteres.').nullish().transform(value => value || null)
        })
        this.querySchema = z.object({
            search: z.string({ error: 'A busca deve ser um texto.' }).trim().max(100, 'A busca deve ter no máximo 100 caracteres.').optional(),
            status: z.enum(['active', 'inactive', 'all'], { error: 'Informe um filtro de status válido.' }).default('all')
        })
        this.paramsSchema = z.object({
            id: z.string().regex(/^[0-9]+$/, 'Informe um identificador de frota válido.').transform(Number).pipe(
                z.number().int().min(1, 'Informe um identificador de frota válido.').max(2147483647, 'Informe um identificador de frota válido.')
            )
        })
        this.statusSchema = z.object({
            status: z.enum(['active', 'inactive'], { error: 'Informe um status válido: ativa ou inativa.' })
        })
        this.deleteSchema = z.object({
            confirmationName: z.string({ error: 'Digite o nome da frota para confirmar a exclusão.' }).min(1, 'Digite o nome da frota para confirmar a exclusão.').max(100, 'O nome da frota deve ter no máximo 100 caracteres.')
        })
    }

    /**
     * @param {express.Request} req
     * @param {express.Response} res
     */
    async index(req, res) {
        const fleets = await FleetService.list(req.query)
        if (fleets.error) return utils.sendError(res, fleets)

        return res.status(200).json({ error: false, message: 'Frotas obtidas com sucesso.', data: fleets })
    }

    /**
     * @param {express.Request} req
     * @param {express.Response} res
     */
    async show(req, res) {
        const fleet = await FleetService.findById(req.params.id)
        if (fleet.error) return utils.sendError(res, fleet)

        return res.status(200).json({ error: false, message: 'Frota obtida com sucesso.', data: fleet })
    }

    /**
     * @param {express.Request} req
     * @param {express.Response} res
     */
    async store(req, res) {
        const fleet = await FleetService.create(req.body)
        if (fleet.error) return utils.sendError(res, fleet)

        return res.status(201).json({ error: false, message: 'Frota criada com sucesso.', data: fleet })
    }

    /**
     * @param {express.Request} req
     * @param {express.Response} res
     */
    async update(req, res) {
        const fleet = await FleetService.update(req.params.id, req.body)
        if (fleet.error) return utils.sendError(res, fleet)

        return res.status(200).json({ error: false, message: 'Frota atualizada com sucesso.', data: fleet })
    }

    /**
     * @param {express.Request} req
     * @param {express.Response} res
     */
    async changeStatus(req, res) {
        const fleet = await FleetService.changeStatus(req.params.id, req.body.status)
        if (fleet.error) return utils.sendError(res, fleet)

        return res.status(200).json({ error: false, message: 'Status da frota atualizado com sucesso.', data: fleet })
    }

    /**
     * @param {express.Request} req
     * @param {express.Response} res
     */
    async destroy(req, res) {
        const result = await FleetService.destroy(req.params.id, req.body.confirmationName)
        if (result.error) return utils.sendError(res, result)

        return res.status(200).json({ error: false, message: 'Frota excluída com sucesso.', data: {} })
    }

    /**
     * @param {express.Request} req
     * @param {express.Response} res
     */
    async vehicles(req, res) {
        const vehicles = await FleetService.listVehicles(req.params.id)
        if (vehicles.error) return utils.sendError(res, vehicles)

        return res.status(200).json({ error: false, message: 'Veículos obtidos com sucesso.', data: vehicles })
    }

    /**
     * @param {express.Request} req
     * @param {express.Response} res
     */
    async drivers(req, res) {
        const drivers = await FleetService.listDrivers(req.params.id)
        if (drivers.error) return utils.sendError(res, drivers)

        return res.status(200).json({ error: false, message: 'Motoristas obtidos com sucesso.', data: drivers })
    }
}

module.exports = new FleetController()
