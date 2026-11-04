const express = require('express')
const { z } = require('zod')
const VehicleService = require('../services/vehicle.service')
const fields = require('../utils/schemas')
const utils = require('../utils')

class VehicleController {
    constructor() {
        this.vehicleSchema = z.object({
            plate: fields.plate,
            brand: z
                .string({ error: 'Informe a marca.' })
                .trim()
                .min(1, 'Informe a marca.')
                .max(60, 'A marca deve ter no máximo 60 caracteres.'),
            model: z
                .string({ error: 'Informe o modelo.' })
                .trim()
                .min(1, 'Informe o modelo.')
                .max(60, 'O modelo deve ter no máximo 60 caracteres.'),
            year: fields.vehicleYear,
            currentOdometer: fields.odometer,
            fleetId: z
                .number({ error: 'Escolha a frota do veículo.' })
                .int('Escolha a frota do veículo.')
                .min(1, 'Escolha a frota do veículo.')
                .max(2147483647, 'Escolha a frota do veículo.')
        })

        this.paramsSchema = z.object({
            id: fields.id
        })

        this.statusSchema = z.object({
            status: z.enum(['active', 'inactive'], { error: 'Informe um status válido: ativo ou inativo.' })
        })

        this.deleteSchema = z.object({
            confirmationPlate: z
                .string({ error: 'Digite a placa para confirmar a exclusão.' })
                .max(10, 'Digite a placa para confirmar a exclusão.')
                .transform((value) => value.replace(/[\s-]/g, '').toUpperCase())
                .pipe(z.string().min(1, 'Digite a placa para confirmar a exclusão.'))
        })
    }

    /**
     *
     * @param {express.Request} req
     * @param {express.Response} res
     */
    async show(req, res) {
        const vehicle = await VehicleService.findById(req.params.id, req.user.id)
        if (vehicle.error) return utils.sendError(res, vehicle)

        return res.status(200).json({
            error: false,
            message: 'Veículo obtido com sucesso.',
            data: vehicle
        })
    }

    /**
     *
     * @param {express.Request} req
     * @param {express.Response} res
     */
    async store(req, res) {
        const vehicle = await VehicleService.create(req.user.id, req.body)
        if (vehicle.error) return utils.sendError(res, vehicle)

        return res.status(201).json({
            error: false,
            message: 'Veículo cadastrado com sucesso.',
            data: vehicle
        })
    }

    /**
     *
     * @param {express.Request} req
     * @param {express.Response} res
     */
    async update(req, res) {
        const vehicle = await VehicleService.update(req.params.id, req.user.id, req.body)
        if (vehicle.error) return utils.sendError(res, vehicle)

        return res.status(200).json({
            error: false,
            message: 'Veículo atualizado com sucesso.',
            data: vehicle
        })
    }

    /**
     *
     * @param {express.Request} req
     * @param {express.Response} res
     */
    async changeStatus(req, res) {
        const vehicle = await VehicleService.changeStatus(req.params.id, req.user.id, req.body.status)
        if (vehicle.error) return utils.sendError(res, vehicle)

        return res.status(200).json({
            error: false,
            message: 'Status do veículo atualizado com sucesso.',
            data: vehicle
        })
    }

    /**
     *
     * @param {express.Request} req
     * @param {express.Response} res
     */
    async destroy(req, res) {
        const result = await VehicleService.destroy(req.params.id, req.user.id, req.body.confirmationPlate)
        if (result.error) return utils.sendError(res, result)

        return res.status(200).json({
            error: false,
            message: 'Veículo excluído com sucesso.',
            data: {}
        })
    }
}

module.exports = new VehicleController()
