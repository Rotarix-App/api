const { z } = require('zod')
const SchemaParserMiddleware = require('../../app/middlewares/schema.middleware')

/**
 * @param {object} request
 */
function responseFor(request) {
    const response = { status: jest.fn().mockReturnThis(), json: jest.fn() }
    const next = jest.fn()
    return { request, response, next }
}

describe('SchemaParserMiddleware', () => {
    test('Should preserve legacy numeric queries while keeping selected text fields intact', () => {
        const { request, response, next } = responseFor({ query: { page: '2', search: '00123' }, body: { name: ' Fleet ' } })
        SchemaParserMiddleware(z.object({ name: z.string().trim() }), z.object({ page: z.number(), search: z.string() }), null, { stringQueryFields: ['search'] })(request, response, next)
        expect(next).toHaveBeenCalledWith()
        expect(request.body).toEqual({ name: 'Fleet' })
        expect(request.query).toEqual({ page: 2, search: '00123' })
    })

    test('Should validate and replace path parameters', () => {
        const { request, response, next } = responseFor({ query: {}, params: { id: '12' } })
        SchemaParserMiddleware(null, null, z.object({ id: z.coerce.number().int() }))(request, response, next)
        expect(request.params.id).toBe(12)
        expect(next).toHaveBeenCalledWith()
    })

    test('Should reject repeated query values rather than silently convert them', () => {
        const { request, response, next } = responseFor({ query: { page: ['2'] } })
        SchemaParserMiddleware(null, z.object({ page: z.number() }))(request, response, next)
        expect(response.status).toHaveBeenCalledWith(400)
        expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ id: 'invalid_schema' }))
        expect(next).not.toHaveBeenCalled()
    })
})
