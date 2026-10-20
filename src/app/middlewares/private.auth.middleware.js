const express = require('express')

/**
 * 
 * @param {express.Request} req 
 * @param {express.Response} res 
 * @param {express.NextFunction} next 
 */
module.exports = async (req, res, next) => {
    const requestIP = req?.socket?.remoteAddress?.replace('::ffff:', '')

    if (requestIP != "::1" && requestIP != "127.0.0.1") {
        return res.status(401).json({
            error: true,
            message: "Não autorizado.",
            id: "unauthorized"
        })
    }

    return next()
}
