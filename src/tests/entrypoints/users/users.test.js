const request = require('supertest')
const { User, Fleet, Vehicle, OdometerReading, Trip } = require('../../../app/database/models')
const { createTestUser } = require('../../utils/user.util')

/**
 * @param {number} driverId
 */
async function startTripFor(driverId) {
    const { user: manager } = await createTestUser('manager')
    const fleet = await Fleet.create({ managerId: manager.id, name: 'Grãos Triângulo', baseRegion: 'Uberlândia, MG' })
    const vehicle = await Vehicle.create({
        fleetId: fleet.id,
        plate: `T${String(Date.now()).slice(-6)}`,
        brand: 'Scania',
        model: 'R450',
        year: 2022,
        currentOdometer: 184302
    })
    const reading = await OdometerReading.create({ vehicleId: vehicle.id, recordedBy: driverId, valueKm: 184302, source: 'trip_start' })

    return Trip.create({
        driverId,
        vehicleId: vehicle.id,
        origin: 'Uberlândia, MG',
        destination: 'Santos, SP',
        startReadingId: reading.id,
        startedAt: new Date()
    })
}

describe('GET /users/@me', () => {
    describe('errors', () => {
        test('Should return 401 without a token', async () => {
            const response = await request(global.app).get('/users/@me')

            expect(response.status).toBe(401)
            expect(response.body.id).toBe('unauthorized')
        })

        test('Should return 401 with an invalid token', async () => {
            const response = await request(global.app)
                .get('/users/@me')
                .set('Authorization', 'Bearer invalid.token.value')

            expect(response.status).toBe(401)
            expect(response.body.id).toBe('unauthorized')
        })

        test('Should return 403 for a deactivated user', async () => {
            const { token, user } = await createTestUser('driver')
            await User.update({ status: 'inactive' }, { where: { id: user.id } })

            const response = await request(global.app)
                .get('/users/@me')
                .set('Authorization', `Bearer ${token}`)

            expect(response.status).toBe(403)
            expect(response.body.id).toBe('account_inactive')
        })
    })

    describe('success', () => {
        test('Should return the profile without the password hash', async () => {
            const { token, user } = await createTestUser('driver')

            const response = await request(global.app)
                .get('/users/@me')
                .set('Authorization', `Bearer ${token}`)

            expect(response.status).toBe(200)
            expect(response.body.data).toMatchObject({ id: user.id, role: 'driver', email: user.email })
            expect(response.body.data.passwordHash).toBeUndefined()
        })
    })
})

describe('PUT /users/@me', () => {
    describe('errors', () => {
        test('Should reject an invalid phone', async () => {
            const { token, payload } = await createTestUser()

            const response = await request(global.app)
                .put('/users/@me')
                .set('Authorization', `Bearer ${token}`)
                .send({ name: payload.name, email: payload.email, phone: '(34) 99812-4471' })

            expect(response.status).toBe(400)
            expect(response.body.id).toBe('invalid_schema')
        })

        test('Should require the CNH for drivers', async () => {
            const { token, payload } = await createTestUser('driver')

            const response = await request(global.app)
                .put('/users/@me')
                .set('Authorization', `Bearer ${token}`)
                .send({ name: payload.name, email: payload.email, phone: payload.phone })

            expect(response.status).toBe(400)
            expect(response.body.id).toBe('cnh_required')
        })

        test('Should reject an email used by another account', async () => {
            const { payload: other } = await createTestUser()
            const { token, payload } = await createTestUser()

            const response = await request(global.app)
                .put('/users/@me')
                .set('Authorization', `Bearer ${token}`)
                .send({ name: payload.name, email: other.email, phone: payload.phone })

            expect(response.status).toBe(409)
            expect(response.body.id).toBe('email_already_exists')
        })
    })

    describe('success', () => {
        test('Should update a manager and ignore CNH fields', async () => {
            const { token, payload } = await createTestUser()
            const email = `updated.${payload.email}`

            const response = await request(global.app)
                .put('/users/@me')
                .set('Authorization', `Bearer ${token}`)
                .send({ name: 'Marcos Carvalho Filho', email, phone: '34999990000', cnhNumber: '04728391650', cnhCategory: 'E' })

            expect(response.status).toBe(200)
            expect(response.body.data).toMatchObject({ name: 'Marcos Carvalho Filho', email, phone: '34999990000', cnhNumber: null })
        })

        test('Should update a driver CNH', async () => {
            const { token, payload } = await createTestUser('driver')

            const response = await request(global.app)
                .put('/users/@me')
                .set('Authorization', `Bearer ${token}`)
                .send({ name: payload.name, email: payload.email, phone: payload.phone, cnhNumber: '05918274031', cnhCategory: 'D' })

            expect(response.status).toBe(200)
            expect(response.body.data).toMatchObject({ cnhNumber: '05918274031', cnhCategory: 'D' })
        })
    })
})

describe('PUT /users/@me/password', () => {
    describe('errors', () => {
        test('Should reject a wrong current password', async () => {
            const { token } = await createTestUser()

            const response = await request(global.app)
                .put('/users/@me/password')
                .set('Authorization', `Bearer ${token}`)
                .send({ currentPassword: 'Errada123', newPassword: 'NovaSenha1', newPasswordConfirmation: 'NovaSenha1' })

            expect(response.status).toBe(400)
            expect(response.body.id).toBe('invalid_current_password')
        })

        test('Should reject a confirmation that does not match', async () => {
            const { token, payload } = await createTestUser()

            const response = await request(global.app)
                .put('/users/@me/password')
                .set('Authorization', `Bearer ${token}`)
                .send({ currentPassword: payload.password, newPassword: 'NovaSenha1', newPasswordConfirmation: 'OutraSenha1' })

            expect(response.status).toBe(400)
            expect(response.body.id).toBe('invalid_schema')
            expect(response.body.data.errors[0].path).toEqual(['newPasswordConfirmation'])
        })
    })

    describe('success', () => {
        test('Should change the password', async () => {
            const { token, payload } = await createTestUser()

            const response = await request(global.app)
                .put('/users/@me/password')
                .set('Authorization', `Bearer ${token}`)
                .send({ currentPassword: payload.password, newPassword: 'NovaSenha1', newPasswordConfirmation: 'NovaSenha1' })

            expect(response.status).toBe(200)

            const oldLogin = await request(global.app).post('/login').send({ email: payload.email, password: payload.password })
            const newLogin = await request(global.app).post('/login').send({ email: payload.email, password: 'NovaSenha1' })

            expect(oldLogin.status).toBe(401)
            expect(newLogin.status).toBe(200)
        })
    })
})

describe('DELETE /users/@me', () => {
    describe('errors', () => {
        test('Should block a driver with a trip in progress', async () => {
            const { token, user } = await createTestUser('driver')
            await startTripFor(user.id)

            const response = await request(global.app)
                .delete('/users/@me')
                .set('Authorization', `Bearer ${token}`)

            expect(response.status).toBe(409)
            expect(response.body.id).toBe('trip_in_progress')
        })
    })

    describe('success', () => {
        test('Should anonymize the account and revoke access', async () => {
            const { token, user, payload } = await createTestUser('driver')

            const response = await request(global.app)
                .delete('/users/@me')
                .set('Authorization', `Bearer ${token}`)

            expect(response.status).toBe(200)

            const stored = await User.findByPk(user.id, { paranoid: false })
            expect(stored.deletedAt).not.toBeNull()
            expect(stored).toMatchObject({ name: 'Usuário removido', phone: null, cnhNumber: null, cnhCategory: null })

            const profile = await request(global.app).get('/users/@me').set('Authorization', `Bearer ${token}`)
            const login = await request(global.app).post('/login').send({ email: payload.email, password: payload.password })
            const register = await request(global.app).post('/register').send(payload)

            expect(profile.status).toBe(401)
            expect(login.status).toBe(401)
            expect(register.status).toBe(201)
        })
    })
})
