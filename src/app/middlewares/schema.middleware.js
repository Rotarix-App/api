const express = require('express')
const { ZodError } = require('zod')

module.exports = (bodySchema, querySchema) => {
    /**
     *
     * @param {express.Request} req
     * @param {express.Response} res
     * @param {express.NextFunction} next
     */
    return (req, res, next) => {
        try {
            const query = {}
            for (const param in req.query) {
                query[param] = isNaN(req.query[param]) ? req.query[param] : Number(req.query[param])
            }

            if (bodySchema) {
                req.body = bodySchema.parse(req.body ?? {})
            }

            if (querySchema) {
                Object.defineProperty(req, 'query', {
                    value: querySchema.parse(query),
                    writable: true,
                    enumerable: true,
                    configurable: true
                })
            }

            next()
        } catch (err) {
            if (!(err instanceof ZodError)) return next(err)

            return res.status(400).json({
                error: true,
                message: "Foi fornecida uma estrutura inválida",
                data: {
                    errors: err.issues.map(e => ({
                        message: e.message,
                        expected: e.expected,
                        path: e.path
                    }))
                },
                id: "invalid_schema"
            })
        }
    }
}
