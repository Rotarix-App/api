const express = require('express')
const { z } = require('zod')
const DriverService = require('../services/driver.service')
const fields = require('../utils/schemas')
const utils = require('../utils')

class DriverController {
    constructor() {
        this.driverSchema = z.object({ name: fields.name, email: fields.email, phone: fields.phone, cnhNumber: fields.cnhNumber, cnhCategory: fields.cnhCategory })
        this.createSchema = this.driverSchema.extend({ password: fields.password })
        this.paramsSchema = z.object({ id: fields.id })
        this.querySchema = z.object({
            search: z.string({ error: 'Informe uma busca válida.' }).trim().max(120, 'A busca deve ter no máximo 120 caracteres.').optional(),
            status: z.enum(['all', 'active', 'inactive'], { error: 'Informe um status válido.' }).default('all')
        }).strict('Informe apenas os filtros de busca e status.')
        this.statusSchema = z.object({ status: z.enum(['active', 'inactive'], { error: 'Informe um status válido.' }) })
        this.deleteSchema = z.object({ confirmation: z.string({ error: 'Digite EXCLUIR para confirmar a exclusão.' }) })
        const numericId = z.number({ error: 'Informe um identificador válido.' }).int('Informe um identificador válido.').min(1, 'Informe um identificador válido.').max(2147483647, 'Informe um identificador válido.')
        this.assignSchema = z.object({
            fleetId: numericId,
            vehicleIds: z.array(numericId, { error: 'Selecione os veículos.' }).min(1, 'Selecione pelo menos um veículo.').refine((ids) => new Set(ids).size === ids.length, 'Selecione cada veículo apenas uma vez.')
        })
    }

    /**
     * @param {express.Request} req
     * @param {express.Response} res
     */
    async store(req, res) {
        const result = await DriverService.create(req.body)
        if (result.error) return utils.sendError(res, result)
        return res.status(201).json({ error: false, message: 'Motorista cadastrado com sucesso.', data: result })
    }

    /**
     * @param {express.Request} req
     * @param {express.Response} res
     */
    async index(req, res) {
        const result = await DriverService.list(req.query)
        if (result.error) return utils.sendError(res, result)
        return res.status(200).json({ error: false, message: 'Motoristas obtidos com sucesso.', data: result })
    }

    /**
     * @param {express.Request} req
     * @param {express.Response} res
     */
    async show(req, res) {
        const result = await DriverService.findById(req.params.id)
        if (result.error) return utils.sendError(res, result)
        return res.status(200).json({ error: false, message: 'Motorista obtido com sucesso.', data: result })
    }

    /**
     * @param {express.Request} req
     * @param {express.Response} res
     */
    async update(req, res) {
        const result = await DriverService.update(req.params.id, req.body)
        if (result.error) return utils.sendError(res, result)
        return res.status(200).json({ error: false, message: 'Motorista atualizado com sucesso.', data: result })
    }

    /**
     * @param {express.Request} req
     * @param {express.Response} res
     */
    async changeStatus(req, res) {
        const result = await DriverService.changeStatus(req.params.id, req.body.status)
        if (result.error) return utils.sendError(res, result)
        return res.status(200).json({ error: false, message: 'Status do motorista atualizado com sucesso.', data: result })
    }

    /**
     * @param {express.Request} req
     * @param {express.Response} res
     */
    async destroy(req, res) {
        const result = await DriverService.destroy(req.params.id, req.body.confirmation)
        if (result.error) return utils.sendError(res, result)
        return res.status(200).json({ error: false, message: 'Dados do motorista excluídos com sucesso.', data: result })
    }

    /**
     * @param {express.Request} req
     * @param {express.Response} res
     */
    async release(req, res) {
        const result = await DriverService.release(req.params.id, req.user.id)
        if (result.error) return utils.sendError(res, result)
        return res.status(200).json({ error: false, message: 'Motorista liberado com sucesso.', data: result })
    }

    /**
     * @param {express.Request} req
     * @param {express.Response} res
     */
    async assign(req, res) {
        const result = await DriverService.assign(req.params.id, req.user.id, req.body)
        if (result.error) return utils.sendError(res, result)
        return res.status(200).json({ error: false, message: 'Atribuições salvas com sucesso.', data: result })
    }
}

module.exports = new DriverController()
