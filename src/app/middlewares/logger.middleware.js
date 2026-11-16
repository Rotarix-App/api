const express = require('express')

/**
 *
 * @param {express.Request} req
 * @param {express.Response} res
 * @param {express.NextFunction} next
 */
module.exports = (req, res, next) => {
    res.once('finish', () => {
        console.log(`${req.method} ${req.route?.path || '[unmatched]'} ${res.statusCode}`)
    })
    next()
}
