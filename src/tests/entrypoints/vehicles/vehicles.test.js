const request = require('supertest')
const { Vehicle, VehicleAssignment, User, Trip, OdometerReading } = require('../../../app/database/models')
const { createTestUser } = require('../../utils/user.util')
const { randomPlate, createFleet, createVehicle, createLinkedFleet, finishTrip } = require('../../utils/fleet.util')

let manager
let otherManager
let driver
let inactive

beforeAll(async () => {
    manager = await createTestUser()
    otherManager = await createTestUser()
    driver = await createTestUser('driver')
    inactive = await createTestUser()
    await User.update({ status: 'inactive' }, { where: { id: inactive.user.id } })
})

afterEach(() => jest.restoreAllMocks())

/**
 * @param {string} method
 * @param {string} path
 * @param {object} body
 * @param {string} token
 */
function call(method, path, body, token = manager.token) {
    const pending = request(global.app)[method](path).set('Authorization', `Bearer ${token}`)
    return body === undefined ? pending : pending.send(body)
}

/**
 * @param {number} fleetId
 * @param {object} overrides
 */
function vehicleBody(fleetId, overrides = {}) {
    return {
        plate: randomPlate(),
        brand: 'Scania',
        model: 'R450',
        year: 2022,
        currentOdometer: 184302,
        fleetId,
        ...overrides
    }
}

/**
 * @param {object} vehicle
 */
function editBody(vehicle) {
    return {
        plate: vehicle.plate,
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
        currentOdometer: vehicle.currentOdometer,
        fleetId: vehicle.fleetId
    }
}

const endpoints = [
    ['post', '/vehicles', vehicleBody(1)],
    ['get', '/vehicles/1', undefined],
    ['put', '/vehicles/1', vehicleBody(1)],
    ['patch', '/vehicles/1/status', { status: 'inactive' }],
    ['delete', '/vehicles/1', { confirmationPlate: 'ABC1D23' }]
]

describe.each(endpoints)('%s %s access', (method, path, body) => {
    describe('errors', () => {
        test('Should reject missing authentication', async () => {
            const response = await request(global.app)[method](path).send(body)
            expect(response.status).toBe(401)
            expect(response.body.id).toBe('unauthorized')
        })

        test('Should reject drivers', async () => {
            const response = await call(method, path, body, driver.token)
            expect(response.status).toBe(403)
            expect(response.body.id).toBe('forbidden')
        })

        test('Should reject inactive managers', async () => {
            const response = await call(method, path, body, inactive.token)
            expect(response.status).toBe(403)
            expect(response.body.id).toBe('account_inactive')
        })
    })
})

describe.each(endpoints.filter(([, path]) => path.includes('/1')))('%s %s resource validation', (method, path, body) => {
    describe('errors', () => {
        test.each(['0', '-1', '1.5', 'abc', '2147483648'])('Should reject invalid id %s', async (id) => {
            const response = await call(method, path.replace('/1', `/${id}`), body)
            expect(response.status).toBe(400)
            expect(response.body.id).toBe('invalid_schema')
        })

        test('Should return 404 for an unknown vehicle', async () => {
            const fleet = await createFleet(manager.user.id)
            const validBody = body && body.fleetId ? vehicleBody(fleet.id) : body
            const response = await call(method, path.replace('/1', '/2147483647'), validBody)
            expect(response.status).toBe(404)
            expect(response.body.id).toBe('vehicle_not_found')
        })
    })
})

describe.each([
    ['get', '', () => undefined],
    ['put', '', (vehicle, fleet) => ({ ...editBody(vehicle), brand: 'Volvo', fleetId: fleet.id })],
    ['patch', '/status', () => ({ status: 'inactive' })],
    ['delete', '', (vehicle) => ({ confirmationPlate: vehicle.plate })]
])('%s /vehicles/:id%s ownership', (method, suffix, buildBody) => {
    describe('errors', () => {
        test('Should return 404 for a vehicle in another manager\'s fleet and leave it unchanged', async () => {
            const fleet = await createFleet(manager.user.id)
            const vehicle = await createVehicle(fleet.id)
            const otherFleet = await createFleet(otherManager.user.id)
            const response = await call(method, `/vehicles/${vehicle.id}${suffix}`, buildBody(vehicle, otherFleet), otherManager.token)
            expect(response.status).toBe(404)
            expect(response.body.id).toBe('vehicle_not_found')
            expect(await Vehicle.findByPk(vehicle.id)).toMatchObject({ brand: 'Scania', status: 'active', fleetId: fleet.id })
        })
    })
})

describe('POST /vehicles', () => {
    describe('errors', () => {
        test.each([
            { plate: 'ABC12' },
            { plate: '1BC1D23' },
            { plate: 123 },
            { brand: '  ' },
            { model: 'x'.repeat(61) },
            { year: 1949 },
            { year: new Date().getFullYear() + 2 },
            { year: '2022' },
            { currentOdometer: -1 },
            { currentOdometer: 1.5 },
            { currentOdometer: 10000000 },
            { fleetId: undefined }
        ])('Should reject invalid vehicle data %j', async (overrides) => {
            const fleet = await createFleet(manager.user.id)
            const response = await call('post', '/vehicles', vehicleBody(fleet.id, overrides))
            expect(response.status).toBe(400)
            expect(response.body.id).toBe('invalid_schema')
        })

        test('Should return 404 for a fleet of another manager', async () => {
            const fleet = await createFleet(otherManager.user.id)
            const body = vehicleBody(fleet.id)
            const response = await call('post', '/vehicles', body)
            expect(response.status).toBe(404)
            expect(response.body.id).toBe('fleet_not_found')
            expect(await Vehicle.count({ where: { plate: body.plate } })).toBe(0)
        })

        test('Should reject a plate already used by another vehicle', async () => {
            const fleet = await createFleet(manager.user.id)
            const existing = await createVehicle((await createFleet(otherManager.user.id)).id)
            const response = await call('post', '/vehicles', vehicleBody(fleet.id, { plate: existing.plate }))
            expect(response.status).toBe(409)
            expect(response.body.id).toBe('plate_already_exists')
        })

        test('Should roll back the vehicle when the reading fails', async () => {
            const fleet = await createFleet(manager.user.id)
            const body = vehicleBody(fleet.id)
            jest.spyOn(console, 'log').mockImplementation(() => {})
            jest.spyOn(OdometerReading, 'create').mockRejectedValueOnce(new Error('Injected database failure'))
            const response = await call('post', '/vehicles', body)
            expect(response.status).toBe(500)
            expect(response.body.id).toBe('internal_server_error')
            expect(await Vehicle.count({ where: { plate: body.plate } })).toBe(0)
        })
    })

    describe('success', () => {
        test('Should normalize the plate and record the initial odometer', async () => {
            const fleet = await createFleet(manager.user.id)
            const plate = randomPlate()
            const response = await call('post', '/vehicles', vehicleBody(fleet.id, {
                plate: `${plate.slice(0, 3)}-${plate.slice(3)}`.toLowerCase(),
                brand: '  Scania ',
                status: 'inactive'
            }))
            expect(response.status).toBe(201)
            expect(response.body.data).toMatchObject({
                plate,
                brand: 'Scania',
                currentOdometer: 184302,
                status: 'active',
                available: true,
                fleet: { id: fleet.id, name: fleet.name, status: 'active' }
            })
            const readings = await OdometerReading.findAll({ where: { vehicleId: response.body.data.id } })
            expect(readings).toHaveLength(1)
            expect(readings[0]).toMatchObject({ valueKm: 184302, source: 'manual', recordedBy: manager.user.id, photoId: null })
        })

        test('Should accept an inactive fleet and report the vehicle as unavailable', async () => {
            const fleet = await createFleet(manager.user.id, { status: 'inactive' })
            const response = await call('post', '/vehicles', vehicleBody(fleet.id))
            expect(response.status).toBe(201)
            expect(response.body.data).toMatchObject({ status: 'active', available: false })
        })

        test('Should reuse the plate of a deleted vehicle', async () => {
            const fleet = await createFleet(manager.user.id)
            const deleted = await createVehicle(fleet.id)
            await deleted.destroy()
            const response = await call('post', '/vehicles', vehicleBody(fleet.id, { plate: deleted.plate }))
            expect(response.status).toBe(201)
        })
    })
})

describe('GET /vehicles/:id', () => {
    describe('success', () => {
        test('Should return the last reading, the trip in progress and the assigned drivers', async () => {
            const { fleet, vehicle, driver: tripDriver, trip } = await createLinkedFleet(manager.user.id)
            const { user: freeDriver } = await createTestUser('driver')
            await VehicleAssignment.create({ driverId: freeDriver.id, vehicleId: vehicle.id })

            const response = await call('get', `/vehicles/${vehicle.id}`)
            expect(response.status).toBe(200)
            expect(response.body.data).toMatchObject({
                id: vehicle.id,
                plate: vehicle.plate,
                available: false,
                fleet: { id: fleet.id, status: 'active' },
                lastReading: { valueKm: 0, source: 'trip_start', hasPhoto: false },
                trip: { id: trip.id, driver: { id: tripDriver.id, name: tripDriver.name } }
            })
            expect(response.body.data.assignedDrivers).toHaveLength(2)
            expect(response.body.data.assignedDrivers.find((row) => row.id === tripDriver.id)).toMatchObject({ tripStatus: 'in_progress' })
            expect(response.body.data.assignedDrivers.find((row) => row.id === freeDriver.id)).toMatchObject({ tripStatus: 'free' })
            expect(JSON.stringify(response.body)).not.toContain('passwordHash')
        })

        test('Should report an empty history and availability', async () => {
            const fleet = await createFleet(manager.user.id)
            const vehicle = await createVehicle(fleet.id)
            const response = await call('get', `/vehicles/${vehicle.id}`)
            expect(response.status).toBe(200)
            expect(response.body.data).toMatchObject({ available: true, lastReading: null, trip: null, assignedDrivers: [] })
        })

        test.each([
            ['an inactive vehicle', { status: 'inactive' }, {}],
            ['an inactive fleet', {}, { status: 'inactive' }]
        ])('Should report %s as unavailable', async (_, vehicleOverrides, fleetOverrides) => {
            const fleet = await createFleet(manager.user.id, fleetOverrides)
            const vehicle = await createVehicle(fleet.id, vehicleOverrides)
            const response = await call('get', `/vehicles/${vehicle.id}`)
            expect(response.status).toBe(200)
            expect(response.body.data.available).toBe(false)
        })
    })
})

describe('PUT /vehicles/:id', () => {
    describe('errors', () => {
        test('Should reject an odometer below the last reading', async () => {
            const fleet = await createFleet(manager.user.id)
            const vehicle = await createVehicle(fleet.id, { currentOdometer: 1000 })
            const response = await call('put', `/vehicles/${vehicle.id}`, { ...editBody(vehicle), currentOdometer: 999 })
            expect(response.status).toBe(400)
            expect(response.body.id).toBe('odometer_below_last_reading')
            expect((await vehicle.reload()).currentOdometer).toBe(1000)
        })

        test.each([
            ['fleet', async (vehicle) => ({ fleetId: (await createFleet(manager.user.id)).id })],
            ['odometer', async (vehicle) => ({ currentOdometer: vehicle.currentOdometer + 10 })]
        ])('Should block changing the %s during a trip', async (_, buildChanges) => {
            const { vehicle } = await createLinkedFleet(manager.user.id)
            const response = await call('put', `/vehicles/${vehicle.id}`, { ...editBody(vehicle), ...(await buildChanges(vehicle)) })
            expect(response.status).toBe(409)
            expect(response.body.id).toBe('vehicle_on_trip')
            expect(await Vehicle.findByPk(vehicle.id)).toMatchObject({ fleetId: vehicle.fleetId, currentOdometer: vehicle.currentOdometer })
            expect(await VehicleAssignment.count({ where: { vehicleId: vehicle.id } })).toBe(1)
        })

        test('Should return 404 when moving to another manager\'s fleet', async () => {
            const fleet = await createFleet(manager.user.id)
            const vehicle = await createVehicle(fleet.id)
            const otherFleet = await createFleet(otherManager.user.id)
            const response = await call('put', `/vehicles/${vehicle.id}`, { ...editBody(vehicle), fleetId: otherFleet.id })
            expect(response.status).toBe(404)
            expect(response.body.id).toBe('fleet_not_found')
            expect((await vehicle.reload()).fleetId).toBe(fleet.id)
        })

        test('Should reject a plate already used by another vehicle', async () => {
            const fleet = await createFleet(manager.user.id)
            const vehicle = await createVehicle(fleet.id)
            const other = await createVehicle(fleet.id)
            const response = await call('put', `/vehicles/${vehicle.id}`, { ...editBody(vehicle), plate: other.plate })
            expect(response.status).toBe(409)
            expect(response.body.id).toBe('plate_already_exists')
        })

        test('Should return 500 and leave the vehicle unchanged when the update fails', async () => {
            const fleet = await createFleet(manager.user.id)
            const vehicle = await createVehicle(fleet.id)
            jest.spyOn(console, 'log').mockImplementation(() => {})
            jest.spyOn(Vehicle, 'update').mockRejectedValueOnce(new Error('Injected database failure'))
            const response = await call('put', `/vehicles/${vehicle.id}`, { ...editBody(vehicle), brand: 'Volvo', currentOdometer: 50 })
            expect(response.status).toBe(500)
            expect(response.body.id).toBe('internal_server_error')
            expect(await Vehicle.findByPk(vehicle.id)).toMatchObject({ brand: 'Scania', currentOdometer: 0 })
            expect(await OdometerReading.count({ where: { vehicleId: vehicle.id } })).toBe(0)
        })
    })

    describe('success', () => {
        test('Should edit the other fields during a trip', async () => {
            const { vehicle } = await createLinkedFleet(manager.user.id)
            const response = await call('put', `/vehicles/${vehicle.id}`, { ...editBody(vehicle), brand: 'Volvo', model: 'FH 540', year: 2021 })
            expect(response.status).toBe(200)
            expect(response.body.data).toMatchObject({ brand: 'Volvo', model: 'FH 540', year: 2021, available: false })
        })

        test('Should move the vehicle to another fleet and remove its assignments', async () => {
            const { vehicle, trip } = await createLinkedFleet(manager.user.id)
            await finishTrip(trip)
            const target = await createFleet(manager.user.id)
            const response = await call('put', `/vehicles/${vehicle.id}`, { ...editBody(vehicle), fleetId: target.id })
            expect(response.status).toBe(200)
            expect(response.body.data.fleet).toMatchObject({ id: target.id, name: target.name })
            expect(await VehicleAssignment.count({ where: { vehicleId: vehicle.id } })).toBe(0)
        })

        test('Should record a higher odometer as a manual reading', async () => {
            const fleet = await createFleet(manager.user.id)
            const vehicle = await createVehicle(fleet.id, { currentOdometer: 1000 })
            const response = await call('put', `/vehicles/${vehicle.id}`, { ...editBody(vehicle), currentOdometer: 1500 })
            expect(response.status).toBe(200)
            expect(response.body.data.currentOdometer).toBe(1500)
            const readings = await OdometerReading.findAll({ where: { vehicleId: vehicle.id } })
            expect(readings).toHaveLength(1)
            expect(readings[0]).toMatchObject({ valueKm: 1500, source: 'manual', recordedBy: manager.user.id })
        })

        test('Should not record a reading when the odometer is unchanged', async () => {
            const fleet = await createFleet(manager.user.id)
            const vehicle = await createVehicle(fleet.id, { currentOdometer: 1000 })
            const response = await call('put', `/vehicles/${vehicle.id}`, { ...editBody(vehicle), brand: 'DAF' })
            expect(response.status).toBe(200)
            expect(await OdometerReading.count({ where: { vehicleId: vehicle.id } })).toBe(0)
        })
    })
})

describe('PATCH /vehicles/:id/status', () => {
    describe('errors', () => {
        test('Should reject unknown statuses', async () => {
            const fleet = await createFleet(manager.user.id)
            const vehicle = await createVehicle(fleet.id)
            const response = await call('patch', `/vehicles/${vehicle.id}/status`, { status: 'deleted' })
            expect(response.status).toBe(400)
            expect(response.body.id).toBe('invalid_schema')
        })

        test('Should block deactivation during a trip', async () => {
            const { vehicle } = await createLinkedFleet(manager.user.id)
            const response = await call('patch', `/vehicles/${vehicle.id}/status`, { status: 'inactive' })
            expect(response.status).toBe(409)
            expect(response.body.id).toBe('vehicle_on_trip')
            expect((await vehicle.reload()).status).toBe('active')
        })
    })

    describe('success', () => {
        test('Should deactivate and reactivate idempotently, keeping the assignments', async () => {
            const { vehicle, trip } = await createLinkedFleet(manager.user.id)
            await finishTrip(trip)
            for (const status of ['inactive', 'inactive', 'active', 'active']) {
                const response = await call('patch', `/vehicles/${vehicle.id}/status`, { status })
                expect(response.status).toBe(200)
                expect(response.body.data).toMatchObject({ status, available: status === 'active' })
            }
            expect(await VehicleAssignment.count({ where: { vehicleId: vehicle.id } })).toBe(1)
        })
    })
})

describe('DELETE /vehicles/:id', () => {
    describe('errors', () => {
        test('Should require a confirmation body', async () => {
            const fleet = await createFleet(manager.user.id)
            const vehicle = await createVehicle(fleet.id)
            const response = await call('delete', `/vehicles/${vehicle.id}`, {})
            expect(response.status).toBe(400)
            expect(response.body.id).toBe('invalid_schema')
        })

        test('Should reject a different plate and keep the vehicle', async () => {
            const fleet = await createFleet(manager.user.id)
            const vehicle = await createVehicle(fleet.id)
            const response = await call('delete', `/vehicles/${vehicle.id}`, { confirmationPlate: randomPlate() })
            expect(response.status).toBe(400)
            expect(response.body.id).toBe('plate_confirmation_mismatch')
            expect(await Vehicle.findByPk(vehicle.id)).not.toBeNull()
        })

        test('Should block deletion during a trip', async () => {
            const { vehicle } = await createLinkedFleet(manager.user.id)
            const response = await call('delete', `/vehicles/${vehicle.id}`, { confirmationPlate: vehicle.plate })
            expect(response.status).toBe(409)
            expect(response.body.id).toBe('vehicle_on_trip')
            expect(await Vehicle.findByPk(vehicle.id)).not.toBeNull()
            expect(await VehicleAssignment.count({ where: { vehicleId: vehicle.id } })).toBe(1)
        })
    })

    describe('success', () => {
        test('Should delete the vehicle and its assignments, keeping its history', async () => {
            const { vehicle, trip, reading } = await createLinkedFleet(manager.user.id)
            await finishTrip(trip)
            const confirmationPlate = `${vehicle.plate.slice(0, 3)}-${vehicle.plate.slice(3)}`.toLowerCase()
            const response = await call('delete', `/vehicles/${vehicle.id}`, { confirmationPlate })
            expect(response.status).toBe(200)
            expect(response.body.data).toEqual({})
            expect(await Vehicle.findByPk(vehicle.id)).toBeNull()
            expect(await Vehicle.findByPk(vehicle.id, { paranoid: false })).not.toBeNull()
            expect(await VehicleAssignment.count({ where: { vehicleId: vehicle.id } })).toBe(0)
            expect(await Trip.findByPk(trip.id)).not.toBeNull()
            expect(await OdometerReading.findByPk(reading.id)).not.toBeNull()
            expect((await call('get', `/vehicles/${vehicle.id}`)).status).toBe(404)
        })

        test('Should serialize concurrent deletions', async () => {
            const fleet = await createFleet(manager.user.id)
            const vehicle = await createVehicle(fleet.id)
            const responses = await Promise.all([
                call('delete', `/vehicles/${vehicle.id}`, { confirmationPlate: vehicle.plate }),
                call('delete', `/vehicles/${vehicle.id}`, { confirmationPlate: vehicle.plate })
            ])
            expect(responses.map((response) => response.status).sort()).toEqual([200, 404])
        })
    })
})
