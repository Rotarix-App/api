const express = require('express')
const { z } = require('zod')
const ReminderService = require('../services/reminder.service')
const fields = require('../utils/schemas')
const utils = require('../utils')

class ReminderController {
    constructor() {
        this.reminderSchema = z.object({
            title: z
                .string({ error: 'Informe o título do lembrete, como Revisão ou Troca de óleo.' })
                .trim()
                .min(1, 'Informe o título do lembrete, como Revisão ou Troca de óleo.')
                .max(60, 'O título deve ter no máximo 60 caracteres.'),
            dueOdometer: fields.odometer,
            intervalKm: z
                .number({ error: 'Informe o intervalo em km.' })
                .int('Informe o intervalo em km inteiros.')
                .min(1, 'O intervalo deve ser maior que zero.')
                .max(1000000, 'O intervalo deve ter no máximo 1.000.000 km.')
                .nullish()
                .transform((value) => value ?? null)
        })

        this.vehicleParamsSchema = z.object({
            id: fields.id
        })

        this.paramsSchema = z.object({
            id: fields.id,
            reminderId: fields.id
        })
    }

    /**
     *
     * @param {express.Request} req
     * @param {express.Response} res
     */
    async index(req, res) {
        const reminders = await ReminderService.list(req.params.id, req.user.id)
        if (reminders.error) return utils.sendError(res, reminders)

        return res.status(200).json({
            error: false,
            message: 'Lembretes obtidos com sucesso.',
            data: reminders
        })
    }

    /**
     *
     * @param {express.Request} req
     * @param {express.Response} res
     */
    async store(req, res) {
        const reminder = await ReminderService.create(req.params.id, req.user.id, req.body)
        if (reminder.error) return utils.sendError(res, reminder)

        return res.status(201).json({
            error: false,
            message: 'Lembrete cadastrado com sucesso.',
            data: reminder
        })
    }

    /**
     *
     * @param {express.Request} req
     * @param {express.Response} res
     */
    async update(req, res) {
        const reminder = await ReminderService.update(req.params.id, req.params.reminderId, req.user.id, req.body)
        if (reminder.error) return utils.sendError(res, reminder)

        return res.status(200).json({
            error: false,
            message: 'Lembrete atualizado com sucesso.',
            data: reminder
        })
    }

    /**
     *
     * @param {express.Request} req
     * @param {express.Response} res
     */
    async destroy(req, res) {
        const result = await ReminderService.destroy(req.params.id, req.params.reminderId, req.user.id)
        if (result.error) return utils.sendError(res, result)

        return res.status(200).json({
            error: false,
            message: 'Lembrete excluído com sucesso.',
            data: {}
        })
    }
}

module.exports = new ReminderController()
