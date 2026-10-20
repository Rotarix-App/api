const express = require('express')
const { z } = require('zod')
const UserService = require('../services/user.service')
const fields = require('../utils/schemas')
const utils = require('../utils')

class UserController {
    constructor() {
        this.updateSchema = z.object({
            name: fields.name,
            email: fields.email,
            phone: fields.phone,
            cnhNumber: fields.cnhNumber.optional(),
            cnhCategory: fields.cnhCategory.optional()
        })

        this.passwordSchema = z.object({
            currentPassword: z.string({ error: 'Informe a senha atual.' }).min(1, 'Informe a senha atual.'),
            newPassword: fields.password,
            newPasswordConfirmation: z.string({ error: 'Confirme a nova senha.' })
        }).refine((data) => data.newPassword === data.newPasswordConfirmation, {
            error: 'A confirmação não confere com a nova senha.',
            path: ['newPasswordConfirmation']
        })
    }

    /**
     *
     * @param {express.Request} req
     * @param {express.Response} res
     */
    async show(req, res) {
        return res.status(200).json({
            error: false,
            message: 'Dados da conta obtidos com sucesso.',
            data: req.user
        })
    }

    /**
     *
     * @param {express.Request} req
     * @param {express.Response} res
     */
    async update(req, res) {
        const user = await UserService.updateProfile(req.user, req.body)
        if (user.error) return utils.sendError(res, user)

        return res.status(200).json({
            error: false,
            message: 'Perfil atualizado com sucesso.',
            data: user
        })
    }

    /**
     *
     * @param {express.Request} req
     * @param {express.Response} res
     */
    async updatePassword(req, res) {
        const { currentPassword, newPassword } = req.body

        const result = await UserService.changePassword(req.user.id, currentPassword, newPassword)
        if (result.error) return utils.sendError(res, result)

        return res.status(200).json({
            error: false,
            message: 'Senha alterada com sucesso.',
            data: {}
        })
    }

    /**
     *
     * @param {express.Request} req
     * @param {express.Response} res
     */
    async destroy(req, res) {
        const result = await UserService.deleteAccount(req.user.id)
        if (result.error) return utils.sendError(res, result)

        return res.status(200).json({
            error: false,
            message: 'Conta excluída com sucesso.',
            data: {}
        })
    }
}

module.exports = new UserController()
