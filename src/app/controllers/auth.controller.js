const express = require('express')
const { z } = require('zod')
const AuthService = require('../services/auth.service')
const fields = require('../utils/schemas')
const utils = require('../utils')

class AuthController {
    constructor() {
        const accountFields = {
            name: fields.name,
            email: fields.email,
            phone: fields.phone,
            password: fields.password
        }

        this.registerSchema = z.discriminatedUnion('role', [
            z.object({
                role: z.literal('manager'),
                ...accountFields
            }),
            z.object({
                role: z.literal('driver'),
                ...accountFields,
                cnhNumber: fields.cnhNumber,
                cnhCategory: fields.cnhCategory
            })
        ], { error: 'Escolha o perfil: gestor ou motorista.' })

        this.loginSchema = z.object({
            email: fields.email,
            password: z.string({ error: 'Informe a senha.' }).min(1, 'Informe a senha.')
        })
    }

    /**
     *
     * @param {express.Request} req
     * @param {express.Response} res
     */
    async register(req, res) {
        const result = await AuthService.register(req.body)
        if (result.error) return utils.sendError(res, result)

        return res.status(201).json({
            error: false,
            message: 'Conta criada com sucesso.',
            data: result
        })
    }

    /**
     *
     * @param {express.Request} req
     * @param {express.Response} res
     */
    async login(req, res) {
        const { email, password } = req.body

        const result = await AuthService.login(email, password)
        if (result.error) return utils.sendError(res, result)

        return res.status(200).json({
            error: false,
            message: 'Login realizado com sucesso.',
            data: result
        })
    }
}

module.exports = new AuthController()
