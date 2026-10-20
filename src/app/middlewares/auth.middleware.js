const express = require('express')
const AuthService = require('../services/auth.service')
const UserService = require('../services/user.service')
const utils = require('../utils')

const unauthorized = utils.error(401, 'unauthorized', 'Não autorizado.')

/**
 *
 * @param {express.Request} req
 * @param {express.Response} res
 * @param {express.NextFunction} next
 */
module.exports = async (req, res, next) => {
    const [scheme, token] = (req.headers.authorization || '').split(' ')
    if (scheme !== 'Bearer' || !token) return utils.sendError(res, unauthorized)

    const payload = AuthService.verifyToken(token)
    if (!payload) return utils.sendError(res, unauthorized)

    const user = await UserService.findById(Number(payload.sub))
    if (user.error) return utils.sendError(res, user.httpStatus === 404 ? unauthorized : user)

    const inactive = AuthService.checkActive(user)
    if (inactive) return utils.sendError(res, inactive)

    req.user = user

    return next()
}
