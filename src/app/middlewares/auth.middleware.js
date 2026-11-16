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
 * @param {'finish' | 'cancel'} tripAction
 */
async function authenticate(req, res, next, tripAction) {
    const [scheme, token] = (req.headers.authorization || '').split(' ')
    if (scheme !== 'Bearer' || !token) return utils.sendError(res, unauthorized)

    const payload = AuthService.verifyToken(token)
    if (!payload) return utils.sendError(res, unauthorized)

    const user = await UserService.findById(Number(payload.sub))
    if (user.error) return utils.sendError(res, user.httpStatus === 404 ? unauthorized : user)

    const inactive = AuthService.checkActive(user)
    if (tripAction) {
        const allowed = await AuthService.canCompleteTrip(user, Number(req.params.id))
        if (allowed?.error) return utils.sendError(res, allowed)
        if (!allowed) return utils.sendError(res, inactive || utils.error(404, 'trip_not_found', 'Viagem não encontrada.'))
        req.restrictedSession = !!inactive
    } else if (inactive) return utils.sendError(res, inactive)

    req.user = user

    return next()
}

/**
 * @param {express.Request} req
 * @param {express.Response} res
 * @param {express.NextFunction} next
 */
module.exports = (req, res, next) => authenticate(req, res, next)

/** @param {'finish' | 'cancel'} action */
module.exports.forTripAction = (action) => {
    if (!['finish', 'cancel'].includes(action)) throw new TypeError('Only finish/cancel may allow restricted sessions.')
    return (req, res, next) => authenticate(req, res, next, action)
}
