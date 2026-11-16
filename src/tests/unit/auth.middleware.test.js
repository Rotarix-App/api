const AuthMiddleware = require('../../app/middlewares/auth.middleware')
const AuthService = require('../../app/services/auth.service')
const UserService = require('../../app/services/user.service')
const TripRepository = require('../../app/repositories/trip.repository')

afterEach(() => jest.restoreAllMocks())

/**
 * @param {string} action
 * @param {object | null} trip
 * @param {object} user
 */
async function run(action, trip, user = { id: 15, role: 'driver', status: 'inactive' }) {
    jest.spyOn(AuthService, 'verifyToken').mockReturnValue({ sub: '15' })
    jest.spyOn(UserService, 'findById').mockResolvedValue(user)
    jest.spyOn(TripRepository, 'findInProgressByDriverId').mockResolvedValue(trip)
    const req = { headers: { authorization: 'Bearer test-placeholder' }, params: { id: '20' } }
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() }
    const next = jest.fn()
    await (action ? AuthMiddleware.forTripAction(action) : AuthMiddleware)(req, res, next)
    return { req, res, next }
}

describe('Restricted sessions (D33)', () => {
    test.each(['finish', 'cancel'])('Should permit only %s of the inactive driver own ongoing trip', async (action) => {
        const { req, next } = await run(action, { id: 20 })
        expect(next).toHaveBeenCalledTimes(1)
        expect(req.restrictedSession).toBe(true)
        expect(TripRepository.findInProgressByDriverId).toHaveBeenCalledWith(15)
    })

    test.each([null, { id: 21 }])('Should block inactive drivers after completion or for other trips', async (trip) => {
        const { res, next } = await run('finish', trip)
        expect(next).not.toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(403)
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: 'account_inactive' }))
    })

    test('Should keep all ordinary routes blocked for inactive users, even during a trip', async () => {
        const { res, next } = await run(null, { id: 20 })
        expect(next).not.toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(403)
        expect(TripRepository.findInProgressByDriverId).not.toHaveBeenCalled()
    })

    test('Should validate trip ownership for active users too', async () => {
        const { res, next } = await run('cancel', null, { id: 15, role: 'driver', status: 'active' })
        expect(next).not.toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(404)
    })

    test('Should reject managers in restricted trip routes', async () => {
        const { res, next } = await run('finish', { id: 20 }, { id: 15, role: 'manager', status: 'inactive' })
        expect(next).not.toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(403)
    })

    test('Should propagate database failures without authorizing the session', async () => {
        const { res, next } = await run('finish', { error: true, httpStatus: 500, id: 'internal_server_error' })
        expect(next).not.toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(500)
    })

    test('Should reject configuring any action beyond finish/cancel', () => {
        expect(() => AuthMiddleware.forTripAction('expense')).toThrow(TypeError)
    })
})
