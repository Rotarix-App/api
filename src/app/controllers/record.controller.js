const express = require('express')
const { z } = require('zod')
const RecordService = require('../services/record.service')
const fields = require('../utils/schemas')
const utils = require('../utils')

class RecordController {
    constructor() {
        const vehicleId = fields.reference('Escolha o veículo do registro.').optional()
        const odometerPhotoId = fields.reference('Fotografe o odômetro.')
        const invoicePhotoId = fields.reference('Informe uma foto de nota fiscal válida.').nullish()

        this.expenseSchema = z.object({
            vehicleId,
            category: z.enum(['toll', 'food', 'tire_repair', 'urgent_maintenance'], {
                error: 'Escolha a categoria: pedágio, alimentação, borracharia ou manutenção de urgência. Para combustível, use Registrar abastecimento.'
            }),
            amount: fields.amount,
            description: fields.optionalText('A descrição deve ter no máximo 255 caracteres.', 255),
            receiptPhotoId: fields.reference('Informe uma foto de comprovante válida.').nullish()
        })

        this.expenseUpdateSchema = this.expenseSchema.omit({ vehicleId: true })

        this.refuelingSchema = z.object({
            vehicleId,
            liters: fields.decimal('Informe os litros abastecidos.', 9999.99, 2),
            pricePerLiter: fields.decimal('Informe o valor por litro.', 99.999, 3),
            odometer: fields.odometer,
            gasStation: z
                .string({ error: 'Informe o posto.' })
                .trim()
                .min(1, 'Informe o posto.')
                .max(120, 'O posto deve ter no máximo 120 caracteres.'),
            odometerPhotoId,
            invoicePhotoId
        })

        this.maintenanceSchema = z.object({
            vehicleId,
            type: z.enum(['preventive', 'corrective', 'urgent'], { error: 'Escolha o tipo: preventiva, corretiva ou urgência.' }),
            service: z
                .string({ error: 'Informe o serviço realizado.' })
                .trim()
                .min(1, 'Informe o serviço realizado.')
                .max(255, 'O serviço deve ter no máximo 255 caracteres.'),
            amount: fields.amount,
            workshop: z
                .string({ error: 'Informe a oficina.' })
                .trim()
                .min(1, 'Informe a oficina.')
                .max(120, 'A oficina deve ter no máximo 120 caracteres.'),
            odometer: fields.odometer,
            odometerPhotoId,
            invoicePhotoId
        })

        this.spendingSchema = z.object({
            month: fields.month
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
    async storeExpense(req, res) {
        const expense = await RecordService.createExpense(req.user.id, req.body)
        if (expense.error) return utils.sendError(res, expense)

        return res.status(201).json({
            error: false,
            message: 'Despesa registrada com sucesso.',
            data: expense
        })
    }

    /**
     *
     * @param {express.Request} req
     * @param {express.Response} res
     */
    async showExpense(req, res) {
        const expense = await RecordService.findExpense(req.params.id, req.user.id)
        if (expense.error) return utils.sendError(res, expense)

        return res.status(200).json({
            error: false,
            message: 'Despesa obtida com sucesso.',
            data: expense
        })
    }

    /**
     *
     * @param {express.Request} req
     * @param {express.Response} res
     */
    async updateExpense(req, res) {
        const expense = await RecordService.updateExpense(req.params.id, req.user.id, req.body)
        if (expense.error) return utils.sendError(res, expense)

        return res.status(200).json({
            error: false,
            message: 'Despesa atualizada com sucesso.',
            data: expense
        })
    }

    /**
     *
     * @param {express.Request} req
     * @param {express.Response} res
     */
    async destroyExpense(req, res) {
        const result = await RecordService.deleteExpense(req.params.id, req.user.id)
        if (result.error) return utils.sendError(res, result)

        return res.status(200).json({
            error: false,
            message: 'Despesa excluída com sucesso.',
            data: {}
        })
    }

    /**
     *
     * @param {express.Request} req
     * @param {express.Response} res
     */
    async storeRefueling(req, res) {
        const refueling = await RecordService.createRefueling(req.user.id, req.body)
        if (refueling.error) return utils.sendError(res, refueling)

        return res.status(201).json({
            error: false,
            message: 'Abastecimento registrado com sucesso.',
            data: refueling
        })
    }

    /**
     *
     * @param {express.Request} req
     * @param {express.Response} res
     */
    async showRefueling(req, res) {
        const refueling = await RecordService.findRefueling(req.params.id, req.user.id)
        if (refueling.error) return utils.sendError(res, refueling)

        return res.status(200).json({
            error: false,
            message: 'Abastecimento obtido com sucesso.',
            data: refueling
        })
    }

    /**
     *
     * @param {express.Request} req
     * @param {express.Response} res
     */
    async storeMaintenance(req, res) {
        const maintenance = await RecordService.createMaintenance(req.user.id, req.body)
        if (maintenance.error) return utils.sendError(res, maintenance)

        return res.status(201).json({
            error: false,
            message: 'Manutenção registrada com sucesso.',
            data: maintenance
        })
    }

    /**
     *
     * @param {express.Request} req
     * @param {express.Response} res
     */
    async showMaintenance(req, res) {
        const maintenance = await RecordService.findMaintenance(req.params.id, req.user.id)
        if (maintenance.error) return utils.sendError(res, maintenance)

        return res.status(200).json({
            error: false,
            message: 'Manutenção obtida com sucesso.',
            data: maintenance
        })
    }

    /**
     *
     * @param {express.Request} req
     * @param {express.Response} res
     */
    async spending(req, res) {
        const spending = await RecordService.monthlySpending(req.user.id, req.query.month)
        if (spending.error) return utils.sendError(res, spending)

        return res.status(200).json({
            error: false,
            message: 'Gastos obtidos com sucesso.',
            data: spending
        })
    }
}

module.exports = new RecordController()
