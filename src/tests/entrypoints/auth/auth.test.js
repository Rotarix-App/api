const request = require('supertest')
const { User } = require('../../../app/database/models')
const { buildUser, createTestUser } = require('../../utils/user.util')

describe('POST /register', () => {
    describe('errors', () => {
        test('Should reject a body without the required fields', async () => {
            const response = await request(global.app)
                .post('/register')
                .send({ role: 'manager' })

            expect(response.status).toBe(400)
            expect(response.body.id).toBe('invalid_schema')
            expect(response.body.data.errors.map((e) => e.path[0])).toEqual(expect.arrayContaining(['name', 'email', 'phone', 'password']))
        })

        test('Should reject an unknown role', async () => {
            const response = await request(global.app)
                .post('/register')
                .send(buildUser('manager', { role: 'admin' }))

            expect(response.status).toBe(400)
            expect(response.body.id).toBe('invalid_schema')
        })

        test('Should require the CNH for drivers', async () => {
            const payload = buildUser('driver')
            delete payload.cnhNumber
            delete payload.cnhCategory

            const response = await request(global.app)
                .post('/register')
                .send(payload)

            expect(response.status).toBe(400)
            expect(response.body.data.errors.map((e) => e.path[0])).toEqual(expect.arrayContaining(['cnhNumber', 'cnhCategory']))
        })

        test('Should reject a weak password', async () => {
            const response = await request(global.app)
                .post('/register')
                .send(buildUser('manager', { password: 'senha123' }))

            expect(response.status).toBe(400)
            expect(response.body.id).toBe('invalid_schema')
        })

        test('Should reject an email that is already registered', async () => {
            const { payload } = await createTestUser()

            const response = await request(global.app)
                .post('/register')
                .send(buildUser('manager', { email: payload.email.toUpperCase() }))

            expect(response.status).toBe(409)
            expect(response.body.id).toBe('email_already_exists')
        })
    })

    describe('success', () => {
        test('Should create a manager, ignore CNH fields and return a token', async () => {
            const payload = buildUser('manager', { cnhNumber: '04728391650', cnhCategory: 'E' })

            const response = await request(global.app)
                .post('/register')
                .send(payload)

            expect(response.status).toBe(201)
            expect(response.body.error).toBe(false)
            expect(response.body.data.token).toEqual(expect.any(String))
            expect(response.body.data.user).toMatchObject({
                role: 'manager',
                email: payload.email,
                cnhNumber: null,
                cnhCategory: null,
                status: 'active'
            })
            expect(response.body.data.user.passwordHash).toBeUndefined()
        })

        test('Should create a driver with CNH', async () => {
            const payload = buildUser('driver')

            const response = await request(global.app)
                .post('/register')
                .send(payload)

            expect(response.status).toBe(201)
            expect(response.body.data.user).toMatchObject({
                role: 'driver',
                cnhNumber: payload.cnhNumber,
                cnhCategory: payload.cnhCategory
            })
        })

        test('Should store the email trimmed and in lower case', async () => {
            const payload = buildUser('manager')

            const response = await request(global.app)
                .post('/register')
                .send({ ...payload, email: `  ${payload.email.toUpperCase()} ` })

            expect(response.status).toBe(201)
            expect(response.body.data.user.email).toBe(payload.email)
        })
    })
})

describe('POST /login', () => {
    describe('errors', () => {
        test('Should reject a wrong password', async () => {
            const { payload } = await createTestUser()

            const response = await request(global.app)
                .post('/login')
                .send({ email: payload.email, password: 'Errada123' })

            expect(response.status).toBe(401)
            expect(response.body.id).toBe('invalid_credentials')
        })

        test('Should reject an unknown email with the same error', async () => {
            const response = await request(global.app)
                .post('/login')
                .send({ email: 'nobody@rotarix.test', password: 'Senha123' })

            expect(response.status).toBe(401)
            expect(response.body.id).toBe('invalid_credentials')
        })

        test('Should reject a body without password', async () => {
            const response = await request(global.app)
                .post('/login')
                .send({ email: 'nobody@rotarix.test' })

            expect(response.status).toBe(400)
            expect(response.body.id).toBe('invalid_schema')
        })

        test('Should block a deactivated user', async () => {
            const { payload, user } = await createTestUser('driver')
            await User.update({ status: 'inactive' }, { where: { id: user.id } })

            const response = await request(global.app)
                .post('/login')
                .send({ email: payload.email, password: payload.password })

            expect(response.status).toBe(403)
            expect(response.body.id).toBe('account_inactive')
        })
    })

    describe('success', () => {
        test('Should sign in with valid credentials', async () => {
            const { payload, user } = await createTestUser()

            const response = await request(global.app)
                .post('/login')
                .send({ email: payload.email, password: payload.password })

            expect(response.status).toBe(200)
            expect(response.body.data.token).toEqual(expect.any(String))
            expect(response.body.data.user.id).toBe(user.id)
            expect(response.body.data.user.passwordHash).toBeUndefined()
        })

        test('Should accept the email in any case', async () => {
            const { payload } = await createTestUser()

            const response = await request(global.app)
                .post('/login')
                .send({ email: payload.email.toUpperCase(), password: payload.password })

            expect(response.status).toBe(200)
        })
    })
})
