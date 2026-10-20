const roleMiddleware = require('../../app/middlewares/role.middleware')

/**
 * @param {object | undefined} user
 * @param {string[]} roles
 */
function run(user, roles) {
    const req = { user }
    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
    }
    const next = jest.fn()

    roleMiddleware(...roles)(req, res, next)

    return { res, next }
}

describe('roleMiddleware', () => {
    test('Should call next for an allowed role', () => {
        const { res, next } = run({ role: 'manager' }, ['manager'])

        expect(next).toHaveBeenCalled()
        expect(res.status).not.toHaveBeenCalled()
    })

    test('Should return 403 for a role that is not allowed', () => {
        const { res, next } = run({ role: 'driver' }, ['manager'])

        expect(next).not.toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(403)
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: 'forbidden' }))
    })

    test('Should return 403 when there is no user', () => {
        const { res } = run(undefined, ['manager', 'driver'])

        expect(res.status).toHaveBeenCalledWith(403)
    })
})
