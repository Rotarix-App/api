const express = require('express')
const utils = require('../utils')

/**
 * @param {...('manager' | 'driver')} roles
 */
module.exports = (...roles) => {
    /**
     *
     * @param {express.Request} req
     * @param {express.Response} res
     * @param {express.NextFunction} next
     */
    return (req, res, next) => {
        if (!roles.includes(req.user?.role)) {
            return utils.sendError(res, utils.error(403, 'forbidden', 'Você não tem permissão para acessar este recurso.'))
        }

        return next()
    }
}
