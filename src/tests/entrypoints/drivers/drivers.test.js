const request = require('supertest')
const { createTestUser, buildUser } = require('../../utils/user.util')
const { createFleet, createVehicle, createLinkedFleet, finishTrip } = require('../../utils/fleet.util')
const { User, Fleet, VehicleAssignment, Trip, Expense, Photo } = require('../../../app/database/models')
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
    ['get', '/drivers'], ['post', '/drivers'],
    ['get', '/drivers/1'], ['put', '/drivers/1'], ['patch', '/drivers/1/status'],
    ['delete', '/drivers/1'], ['delete', '/drivers/1/assignments'], ['put', '/drivers/1/assignments']
]

describe('Driver permissions (D38, RN02)', () => {
    describe('errors', () => {
        test('Should remove direct manager link endpoints', async () => {
            expect((await call('post', '/drivers/link', { email: driverAccount.user.email })).status).toBe(404)
            expect((await call('delete', `/drivers/${driverAccount.user.id}/manager`)).status).toBe(404)
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
        test('Should create a shared driver and support temporary password login', async () => {
            const driver = await createDriver({ managerId: other.user.id })
            expect(driver).not.toHaveProperty('managerId')
            const login = await request(global.app).post('/login').send({ email: driver.email, password: driver.payload.password })
            expect(login.status).toBe(200)
            expect(login.body.data.user.role).toBe('driver')
        })
        test('Should share self-registered unassigned drivers between managers', async () => {
            const account = await createTestUser('driver')
            expect(account.user).not.toHaveProperty('managerId')
            expect(User.rawAttributes).not.toHaveProperty('managerId')
            for (const token of [manager.token, other.token]) {
                const response = await call('get', '/drivers/' + account.user.id, undefined, token)
                expect(response.status).toBe(200)
                expect(response.body.data).toMatchObject({ id: account.user.id, fleet: null, assignedVehicles: [] })
                expect(response.body.data).not.toHaveProperty('managerId')
            }
            expect(Fleet.rawAttributes).toHaveProperty('managerId')
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
            const response = await call('put', `/drivers/${driver.id}`, { ...driver.payload, name: 'Updated Driver', role: 'manager', managerId: other.user.id, password: 'Other123' }, other.token)
            expect(response.status).toBe(200)
            expect(response.body.data).toMatchObject({ name: 'Updated Driver' })
            expect(response.body.data).not.toHaveProperty('managerId')
            expect((await User.findByPk(driver.id)).role).toBe('driver')
            expect((await call('get', `/drivers/${driver.id}`)).body.data.name).toBe('Updated Driver')
        })
    })
})

describe('PUT /drivers/:id/assignments (S14, D35)', () => {
    describe('errors', () => {
        test('Should block another manager from replacing or releasing assignments until explicit owner release', async () => {
            const driver = await createDriver()
            const firstFleet = await createFleet(manager.user.id)
            const firstVehicle = await createVehicle(firstFleet.id)
            const nextFleet = await createFleet(other.user.id)
            const nextVehicle = await createVehicle(nextFleet.id)
            expect((await call('put', `/drivers/${driver.id}/assignments`, { fleetId: firstFleet.id, vehicleIds: [firstVehicle.id] })).status).toBe(200)
            for (const method of ['put', 'delete']) {
                const response = await call(method, `/drivers/${driver.id}/assignments`, method === 'put' ? { fleetId: nextFleet.id, vehicleIds: [nextVehicle.id] } : undefined, other.token)
                expect(response.status).toBe(409)
                expect(response.body.id).toBe('driver_assigned_to_another_manager')
            }
            expect(await VehicleAssignment.count({ where: { driverId: driver.id, vehicleId: firstVehicle.id } })).toBe(1)
            expect((await call('delete', `/drivers/${driver.id}/assignments`)).status).toBe(200)
            expect((await call('put', `/drivers/${driver.id}/assignments`, { fleetId: nextFleet.id, vehicleIds: [nextVehicle.id] }, other.token)).status).toBe(200)
            expect(await VehicleAssignment.count({ where: { driverId: driver.id, vehicleId: nextVehicle.id } })).toBe(1)
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
        test('Should serialize competing assignments to different manager fleets', async () => {
            const driver = await createDriver()
            const fleetA = await createFleet(manager.user.id)
            const fleetB = await createFleet(other.user.id)
            const vehicleA = await createVehicle(fleetA.id)
            const vehicleB = await createVehicle(fleetB.id)
            const responses = await Promise.all([
                call('put', `/drivers/${driver.id}/assignments`, { fleetId: fleetA.id, vehicleIds: [vehicleA.id] }),
                call('put', `/drivers/${driver.id}/assignments`, { fleetId: fleetB.id, vehicleIds: [vehicleB.id] }, other.token)
            ])
            expect(responses.map((response) => response.status).sort()).toEqual([200, 409])
            expect(await VehicleAssignment.count({ where: { driverId: driver.id } })).toBe(1)
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
            expect((await call('delete', `/drivers/${free.id}/assignments`)).status).toBe(200)
            expect(await VehicleAssignment.count({ where: { driverId: free.id } })).toBe(0)
        })
    })
})

describe('PATCH status and DELETE driver data (M08/M09)', () => {
    describe('errors', () => {
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
                expect(response.body.data.status).toBe(status)
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
