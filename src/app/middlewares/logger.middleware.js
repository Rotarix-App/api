const express = require('express')

const SENSITIVE_KEY = /password/i

/**
 * @param {object} values
 */
function redact(values) {
    if (!values || typeof values !== 'object') return values

    return Object.fromEntries(Object.entries(values).map(([key, value]) => [key, SENSITIVE_KEY.test(key) ? '***' : value]))
}

/**
 *
 * @param {express.Request} req
 * @param {express.Response} res
 * @param {express.NextFunction} next
 */
module.exports = (req, res, next) => {
    console.log(`[${req.socket.remoteAddress}]`.yellow + ` -> ${req.method} ${req.originalUrl} ${JSON.stringify(redact(req.body))} ${JSON.stringify(redact(req.query))}`)
    next()
}
