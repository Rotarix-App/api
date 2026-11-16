const request = require('supertest')
const { createTestUser, buildUser } = require('../../utils/user.util')
const { createFleet, createVehicle, createLinkedFleet, finishTrip } = require('../../utils/fleet.util')
const { User, VehicleAssignment, Trip, Expense, Photo } = require('../../../app/database/models')
const { randomUUID } = require('crypto')
const UserHistory = require('../../../app/utils/user-history')

let manager, other, driverAccount

beforeAll(async () => {
    manager = await createTestUser('manager')
    other = await createTestUser('manager')
    driverAccount = await createTestUser('driver')
})

/**
 * @param {string} method
 * @param {string} path
 * @param {object} body
 * @param {string} token
 */
function call(method, path, body, token = manager.token) {
    const req = request(global.app)[method](path)
    if (token) req.set('Authorization', `Bearer ${token}`)
    return body === undefined ? req : req.send(body)
}

/** @param {object} overrides */
async function createDriver(overrides = {}) {
    const payload = buildUser('driver', overrides)
    const response = await call('post', '/drivers', payload)
    expect(response.status).toBe(201)
    expect(JSON.stringify(response.body)).not.toContain('passwordHash')
    return { ...response.body.data, payload }
}

/** @param {number} managerId */
async function linkedTrip(managerId = manager.user.id) {
    const fixture = await createLinkedFleet(managerId)
    return fixture
}

const operations = [
    ['get', '/drivers'], ['post', '/drivers'], ['post', '/drivers/link'],
    ['get', '/drivers/1'], ['put', '/drivers/1'], ['patch', '/drivers/1/status'],
    ['delete', '/drivers/1'], ['delete', '/drivers/1/assignments'], ['put', '/drivers/1/assignments']
]

describe('Driver permissions', () => {
    describe('errors', () => {
        test("Should hide another manager's driver on every endpoint", async () => {
            const driver = await createDriver()
            const fleet = await createFleet(other.user.id)
            const vehicle = await createVehicle(fleet.id)
            for (const [method, suffix, body] of [
                ['get', '', undefined], ['put', '', driver.payload], ['patch', '/status', { status: 'inactive' }],
                ['delete', '', { confirmation: 'EXCLUIR' }], ['delete', '/assignments', undefined],
                ['put', '/assignments', { fleetId: fleet.id, vehicleIds: [vehicle.id] }]
            ]) {
                const response = await call(method, `/drivers/${driver.id}${suffix}`, body, other.token)
                expect(response.status).toBe(404)
                expect(response.body.id).toBe('driver_not_found')
            }
            expect((await call('get', '/drivers', undefined, other.token)).body.data.map((row) => row.id)).not.toContain(driver.id)
            expect(await User.findByPk(driver.id)).toMatchObject({ status: 'active', managerId: manager.user.id })
        })

        test.each(operations)('Should require authentication on %s %s', async (method, path) => {
            const response = await call(method, path, {}, null)
            expect(response.status).toBe(401)
            expect(response.body.id).toBe('unauthorized')
        })
        test.each(operations)('Should reject drivers on %s %s', async (method, path) => {
            const response = await call(method, path, {}, driverAccount.token)
            expect(response.status).toBe(403)
            expect(response.body.id).toBe('forbidden')
        })
        test('Should return 404 for missing drivers on all resource endpoints', async () => {
            const driver = await createDriver()
            const id = 2147483647
            const fleet = await createFleet(other.user.id)
            const vehicle = await createVehicle(fleet.id)
            for (const [method, suffix, body] of [
                ['get', '', undefined], ['put', '', driver.payload], ['patch', '/status', { status: 'inactive' }],
                ['delete', '', { confirmation: 'EXCLUIR' }], ['delete', '/assignments', undefined],
                ['put', '/assignments', { fleetId: fleet.id, vehicleIds: [vehicle.id] }]
            ]) {
                const response = await call(method, `/drivers/${id}${suffix}`, body, other.token)
                expect(response.status).toBe(404)
                expect(response.body.id).toBe('driver_not_found')
            }
        })
    })
})

describe('POST /drivers', () => {
    describe('errors', () => {
        test.each(['name', 'email', 'phone', 'password', 'cnhNumber', 'cnhCategory'])('Should validate %s', async (field) => {
            const response = await call('post', '/drivers', { ...buildUser('driver'), [field]: undefined })
            expect(response.status).toBe(400)
            expect(response.body.id).toBe('invalid_schema')
        })
        test('Should reject duplicate email', async () => {
            const driver = await createDriver()
            const response = await call('post', '/drivers', driver.payload)
            expect(response.status).toBe(409)
            expect(response.body.id).toBe('email_already_exists')
        })
    })
    describe('success', () => {
        test('Should create a driver owned by the creating manager and support temporary password login', async () => {
            const driver = await createDriver({ managerId: other.user.id })
            expect(driver).not.toHaveProperty('managerId')
            expect((await User.findByPk(driver.id)).managerId).toBe(manager.user.id)
            const login = await request(global.app).post('/login').send({ email: driver.email, password: driver.payload.password })
            expect(login.status).toBe(200)
            expect(login.body.data.user.role).toBe('driver')
        })
        test('Should leave self-registered drivers without a manager and out of every list', async () => {
            const account = await createTestUser('driver', { managerId: manager.user.id })
            expect((await User.findByPk(account.user.id)).managerId).toBeNull()
            for (const token of [manager.token, other.token]) {
                expect((await call('get', '/drivers/' + account.user.id, undefined, token)).status).toBe(404)
                expect((await call('get', '/drivers', undefined, token)).body.data.map((row) => row.id)).not.toContain(account.user.id)
            }
        })
    })
})

describe('POST /drivers/link', () => {
    describe('errors', () => {
        test.each([{}, { email: 'invalid' }])('Should validate the email %j', async (body) => {
            const response = await call('post', '/drivers/link', body)
            expect(response.status).toBe(400)
            expect(response.body.id).toBe('invalid_schema')
        })
        test("Should answer 404 for unknown emails, managers and another manager's driver", async () => {
            const owned = await createDriver()
            for (const email of [`unknown.${Date.now()}@rotarix.test`, other.user.email, owned.email]) {
                const response = await call('post', '/drivers/link', { email }, other.token)
                expect(response.status).toBe(404)
                expect(response.body.id).toBe('driver_not_found')
            }
            expect((await User.findByPk(owned.id)).managerId).toBe(manager.user.id)
        })
    })
    describe('success', () => {
        test('Should link a driver without a manager by exact email, idempotently', async () => {
            const account = await createTestUser('driver')
            for (let attempt = 0; attempt < 2; attempt++) {
                const response = await call('post', '/drivers/link', { email: account.user.email.toUpperCase() })
                expect(response.status).toBe(200)
                expect(response.body.data).toMatchObject({ id: account.user.id, fleet: null, assignedVehicles: [] })
                expect(response.body.data).not.toHaveProperty('managerId')
            }
            expect((await User.findByPk(account.user.id)).managerId).toBe(manager.user.id)
            expect((await call('get', `/drivers/${account.user.id}`)).status).toBe(200)
            expect((await call('get', `/drivers/${account.user.id}`, undefined, other.token)).status).toBe(404)
        })
        test('Should serialize competing links so only one manager wins', async () => {
            const account = await createTestUser('driver')
            const responses = await Promise.all([manager.token, other.token].map((token) => call('post', '/drivers/link', { email: account.user.email }, token)))
            expect(responses.map((response) => response.status).sort()).toEqual([200, 404])
            const winner = responses[0].status === 200 ? manager : other
            expect((await User.findByPk(account.user.id)).managerId).toBe(winner.user.id)
        })
    })
})

describe('GET /drivers and GET/PUT /drivers/:id', () => {
    describe('errors', () => {
        test.each(['?status=bad', '?search[]=x', '?search[x]=y'])('Should reject invalid query %s', async (query) => {
            expect((await call('get', '/drivers' + query)).status).toBe(400)
        })
        test.each(['0', 'abc', '2147483648'])('Should reject invalid path id %s', async (id) => {
            expect((await call('get', `/drivers/${id}`)).status).toBe(400)
        })
        test.each(['name', 'email', 'phone', 'cnhNumber', 'cnhCategory'])('Should validate %s on edit', async (field) => {
            const driver = await createDriver()
            const response = await call('put', `/drivers/${driver.id}`, { ...driver.payload, [field]: undefined })
            expect(response.status).toBe(400)
            expect(response.body.id).toBe('invalid_schema')
        })
        test('Should reject editing to an email already in use', async () => {
            const driver = await createDriver()
            const taken = await createDriver()
            const response = await call('put', `/drivers/${driver.id}`, { ...driver.payload, email: taken.email })
            expect(response.status).toBe(409)
            expect(response.body.id).toBe('email_already_exists')
        })
    })
    describe('success', () => {
        test('Should search by name and numeric CNH, filter statuses and include unassigned drivers', async () => {
            const driver = await createDriver({ name: 'Unique Driver', cnhNumber: '00000000012' })
            for (const query of ['?search=Unique', '?search=00000000012', '?status=active']) {
                const response = await call('get', '/drivers' + query)
                expect(response.status).toBe(200)
                expect(response.body.data.map((row) => row.id)).toContain(driver.id)
                expect(response.body.data.every((row) => !Object.hasOwn(row, 'managerId'))).toBe(true)
            }
            expect((await call('get', '/drivers?search=%')).body.data).toEqual([])
            await call('patch', `/drivers/${driver.id}/status`, { status: 'inactive' })
            const inactive = await call('get', '/drivers?status=inactive')
            expect(inactive.body.data.find((row) => row.id === driver.id)).toMatchObject({ tripStatus: 'inactive', cnhCategory: 'E', fleet: null })
            expect((await call('get', '/drivers?status=active')).body.data.map((row) => row.id)).not.toContain(driver.id)
        })
        test('Should edit profile without changing password or manager', async () => {
            const driver = await createDriver()
            const response = await call('put', `/drivers/${driver.id}`, { ...driver.payload, name: 'Updated Driver', role: 'manager', managerId: other.user.id, password: 'Other123' })
            expect(response.status).toBe(200)
            expect(response.body.data).toMatchObject({ name: 'Updated Driver' })
            expect(response.body.data).not.toHaveProperty('managerId')
            expect(await User.findByPk(driver.id)).toMatchObject({ role: 'driver', managerId: manager.user.id })
            expect((await call('get', `/drivers/${driver.id}`)).body.data.name).toBe('Updated Driver')
        })
    })
})

describe('PUT /drivers/:id/assignments', () => {
    describe('errors', () => {
        test('Should reject assignments to an inactive driver', async () => {
            const driver = await createDriver()
            const fleet = await createFleet(manager.user.id)
            const vehicle = await createVehicle(fleet.id)
            await call('patch', `/drivers/${driver.id}/status`, { status: 'inactive' })
            const response = await call('put', `/drivers/${driver.id}/assignments`, { fleetId: fleet.id, vehicleIds: [vehicle.id] })
            expect(response.status).toBe(409)
            expect(response.body.id).toBe('driver_inactive')
            expect(await VehicleAssignment.count({ where: { driverId: driver.id } })).toBe(0)
        })

        test('Should roll back replacement if inserting the new assignments fails', async () => {
            const driver = await createDriver()
            const fleet = await createFleet(manager.user.id)
            const first = await createVehicle(fleet.id)
            const next = await createVehicle(fleet.id)
            await VehicleAssignment.create({ driverId: driver.id, vehicleId: first.id })
            const log = jest.spyOn(console, 'log').mockImplementation(() => {})
            const insert = jest.spyOn(VehicleAssignment, 'bulkCreate').mockRejectedValueOnce(new Error('Injected write failure'))
            try {
                const response = await call('put', `/drivers/${driver.id}/assignments`, { fleetId: fleet.id, vehicleIds: [next.id] })
                expect(response.status).toBe(500)
                expect(response.body.id).toBe('internal_server_error')
                expect(await VehicleAssignment.count({ where: { driverId: driver.id, vehicleId: first.id } })).toBe(1)
            } finally {
                insert.mockRestore()
                log.mockRestore()
            }
        })

        test('Should reject foreign/inactive fleets, mixed vehicles and empty/duplicate lists', async () => {
            const driver = await createDriver()
            const fleet = await createFleet(manager.user.id)
            const vehicle = await createVehicle(fleet.id)
            const foreign = await createFleet(other.user.id)
            const inactive = await createFleet(manager.user.id, { status: 'inactive' })
            const mixed = await createVehicle((await createFleet(manager.user.id)).id)
            for (const [body, status, id] of [
                [{ fleetId: foreign.id, vehicleIds: [vehicle.id] }, 404, 'fleet_not_found'],
                [{ fleetId: inactive.id, vehicleIds: [vehicle.id] }, 409, 'fleet_inactive'],
                [{ fleetId: fleet.id, vehicleIds: [vehicle.id, mixed.id] }, 404, 'vehicle_not_found'],
                [{ fleetId: fleet.id, vehicleIds: [] }, 400, 'invalid_schema'],
                [{ fleetId: fleet.id, vehicleIds: [vehicle.id, vehicle.id] }, 400, 'invalid_schema']
            ]) {
                const response = await call('put', `/drivers/${driver.id}/assignments`, body)
                expect(response.status).toBe(status)
                expect(response.body.id).toBe(id)
                expect(await VehicleAssignment.count({ where: { driverId: driver.id } })).toBe(0)
            }
        })
        test('Should reject removing the ongoing trip vehicle and releasing that driver', async () => {
            const { driver, fleet, vehicle } = await linkedTrip()
            const replacement = await createVehicle(fleet.id)
            const response = await call('put', `/drivers/${driver.id}/assignments`, { fleetId: fleet.id, vehicleIds: [replacement.id] })
            expect(response.status).toBe(409)
            expect(response.body.id).toBe('driver_has_trip_in_progress')
            const released = await call('delete', `/drivers/${driver.id}/assignments`)
            expect(released.status).toBe(409)
            expect(released.body.id).toBe('driver_has_trip_in_progress')
            expect(await VehicleAssignment.findOne({ where: { driverId: driver.id, vehicleId: vehicle.id } })).not.toBeNull()
        })
    })
    describe('success', () => {
        test('Should release the driver to no manager, then let another manager link and assign them', async () => {
            const driver = await createDriver()
            const firstFleet = await createFleet(manager.user.id)
            const firstVehicle = await createVehicle(firstFleet.id)
            const nextFleet = await createFleet(other.user.id)
            const nextVehicle = await createVehicle(nextFleet.id)
            expect((await call('put', `/drivers/${driver.id}/assignments`, { fleetId: firstFleet.id, vehicleIds: [firstVehicle.id] })).status).toBe(200)
            expect((await call('delete', `/drivers/${driver.id}/assignments`)).status).toBe(200)
            expect(await User.findByPk(driver.id)).toMatchObject({ managerId: null, status: 'active' })
            expect(await VehicleAssignment.count({ where: { driverId: driver.id } })).toBe(0)
            expect((await call('get', `/drivers/${driver.id}`)).status).toBe(404)
            expect((await call('post', '/drivers/link', { email: driver.email }, other.token)).status).toBe(200)
            expect((await call('put', `/drivers/${driver.id}/assignments`, { fleetId: nextFleet.id, vehicleIds: [nextVehicle.id] }, other.token)).status).toBe(200)
            expect(await VehicleAssignment.count({ where: { driverId: driver.id, vehicleId: nextVehicle.id } })).toBe(1)
        })

        test('Should replace assignments and derive fleet, including trip status', async () => {
            const { driver, fleet, vehicle } = await linkedTrip()
            const second = await createVehicle(fleet.id)
            const assigned = await call('put', `/drivers/${driver.id}/assignments`, { fleetId: fleet.id, vehicleIds: [vehicle.id, second.id] })
            expect(assigned.status).toBe(200)
            expect(assigned.body.data).toMatchObject({ fleet: { id: fleet.id }, tripStatus: 'in_progress' })
            expect(assigned.body.data.assignedVehicles).toHaveLength(2)
            expect(assigned.body.data.assignedVehicles.find((row) => row.id === vehicle.id).tripStatus).toBe('in_progress')
            const free = await createDriver()
            for (const ids of [[vehicle.id, second.id], [second.id]]) {
                expect((await call('put', `/drivers/${free.id}/assignments`, { fleetId: fleet.id, vehicleIds: ids })).status).toBe(200)
                expect(await VehicleAssignment.count({ where: { driverId: free.id } })).toBe(ids.length)
            }
        })
    })
})

describe('PATCH /drivers/:id/status and DELETE /drivers/:id', () => {
    describe('errors', () => {
        test.each([{}, { status: 'deleted' }])('Should validate the status %j', async (body) => {
            const driver = await createDriver()
            const response = await call('patch', `/drivers/${driver.id}/status`, body)
            expect(response.status).toBe(400)
            expect(response.body.id).toBe('invalid_schema')
        })
        test('Should require the deletion confirmation field', async () => {
            const driver = await createDriver()
            const response = await call('delete', `/drivers/${driver.id}`, {})
            expect(response.status).toBe(400)
            expect(response.body.id).toBe('invalid_schema')
        })
        test('Should require exact deletion confirmation and block ongoing trips', async () => {
            const { driver } = await linkedTrip()
            expect((await call('delete', `/drivers/${driver.id}`, { confirmation: 'excluir' })).status).toBe(400)
            const response = await call('delete', `/drivers/${driver.id}`, { confirmation: 'EXCLUIR' })
            expect(response.status).toBe(409)
            expect(response.body.id).toBe('driver_has_trip_in_progress')
        })
    })
    describe('success', () => {
        test('Should deactivate during a trip, remove assignments and block login; reactivate without restoring assignments', async () => {
            const { driver, trip } = await linkedTrip()
            for (const status of ['inactive', 'inactive', 'active', 'active']) {
                const response = await call('patch', `/drivers/${driver.id}/status`, { status })
                expect(response.status).toBe(200)
                expect(response.body.data).toMatchObject({ status, tripStatus: 'in_progress' })
                expect(await VehicleAssignment.count({ where: { driverId: driver.id } })).toBe(0)
                if (status === 'inactive') {
                    const login = await request(global.app).post('/login').send({ email: driver.email, password: 'Senha123' })
                    expect(login.status).toBe(403)
                    expect(login.body.id).toBe('account_inactive')
                }
            }
            expect((await Trip.findByPk(trip.id)).status).toBe('in_progress')
            await finishTrip(trip)
            const login = await request(global.app).post('/login').send({ email: driver.email, password: 'Senha123' })
            expect(login.status).toBe(200)
            expect((await call('get', `/drivers/${driver.id}`)).body.data.tripStatus).toBe('free')
        }, 15000)
        test('Should anonymize, remove assignments and prevent reactivation or personal data access', async () => {
            const { driver, trip, vehicle } = await linkedTrip()
            await finishTrip(trip)
            const photo = await Photo.create({ kind: 'receipt', storageKey: `receipts/${randomUUID()}`, mimeType: 'image/jpeg', sizeBytes: 150, uploadedBy: driver.id })
            const expense = await Expense.create({ driverId: driver.id, vehicleId: vehicle.id, tripId: trip.id, category: 'toll', amount: 10, receiptPhotoId: photo.id })
            const response = await call('delete', `/drivers/${driver.id}`, { confirmation: 'EXCLUIR' })
            expect(response.status).toBe(200)
            const removed = await User.findByPk(driver.id, { paranoid: false })
            expect(removed.deletedAt).not.toBeNull()
            for (const field of ['email', 'phone', 'cnhNumber']) expect(removed[field]).not.toBe(driver[field])
            expect(removed.name).not.toBe(driver.name)
            expect(await VehicleAssignment.count({ where: { driverId: driver.id } })).toBe(0)
            expect((await call('get', `/drivers/${driver.id}`)).status).toBe(404)
            expect((await call('patch', `/drivers/${driver.id}/status`, { status: 'active' })).status).toBe(404)
            expect((await call('get', '/drivers')).body.data.map((row) => row.id)).not.toContain(driver.id)
            expect(await Photo.findByPk(photo.id)).not.toBeNull()
            expect(await Expense.findByPk(expense.id)).not.toBeNull()
            const history = await Trip.findByPk(trip.id, { include: [UserHistory.include(User)] })
            expect(UserHistory.present(history.driver)).toEqual({ name: 'Motorista removido' })
            expect(history.toJSON().driver).toEqual({ name: 'Motorista removido' })
            expect(removed.toJSON()).toEqual({ name: 'Motorista removido' })
        })
    })
})
