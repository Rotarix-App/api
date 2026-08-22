const express = require('express')

/**
 * 
 * @param {express.Request} req 
 * @param {express.Response} res 
 * @param {express.NextFunction} next 
 */
module.exports = (req, res, next) => {
    console.log(`[${req.socket.remoteAddress}]`.yellow + ` -> ${req.method} ${req.originalUrl} ${JSON.stringify(req.body)} ${JSON.stringify(req.query)}`)
    next()
}
