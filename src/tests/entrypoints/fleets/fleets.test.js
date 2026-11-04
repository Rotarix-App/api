const request = require('supertest')
const { randomUUID } = require('crypto')
const { Fleet, Vehicle, VehicleAssignment, User, Trip, Expense, Photo, OdometerReading, Refueling, Maintenance } = require('../../../app/database/models')
const { createTestUser } = require('../../utils/user.util')
const { createFleet, createVehicle, createLinkedFleet } = require('../../utils/fleet.util')

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

const endpoints = [
    ['post', '/fleets', { name: 'Test Fleet', baseRegion: 'MG' }],
    ['get', '/fleets', undefined],
    ['get', '/fleets/1', undefined],
    ['put', '/fleets/1', { name: 'Test Fleet', baseRegion: 'MG' }],
    ['patch', '/fleets/1/status', { status: 'inactive' }],
    ['delete', '/fleets/1', { confirmationName: 'Test Fleet' }],
    ['get', '/fleets/1/vehicles', undefined],
    ['get', '/fleets/1/drivers', undefined]
]

describe.each(endpoints)('%s %s access', (method, path, body) => {
    describe('errors', () => {
        test('Should reject missing authentication', async () => {
            const response = await request(global.app)[method](path).send(body)
            expect(response.status).toBe(401)
            expect(response.body.id).toBe('unauthorized')
        })

        test('Should reject invalid authentication', async () => {
            const response = await call(method, path, body, 'invalid.token')
            expect(response.status).toBe(401)
            expect(response.body.id).toBe('unauthorized')
        })

        test('Should reject drivers before loading fleet data', async () => {
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
        test.each(['0', '-1', '1.5', 'abc', '1e2', '2147483648'])('Should reject invalid id %s', async id => {
            const response = await call(method, path.replace('/1', `/${id}`), body)
            expect(response.status).toBe(400)
            expect(response.body.id).toBe('invalid_schema')
        })

        test('Should return 404 for an unknown fleet', async () => {
            const response = await call(method, path.replace('/1', '/2147483647'), body)
            expect(response.status).toBe(404)
            expect(response.body.id).toBe('fleet_not_found')
        })
    })
})

describe.each([
    ['get', '/fleets/1', undefined, Fleet, 'findByPk'],
    ['put', '/fleets/1', { name: 'Fleet', baseRegion: 'MG' }, Fleet, 'update'],
    ['patch', '/fleets/1/status', { status: 'inactive' }, Fleet, 'update'],
    ['get', '/fleets/1/vehicles', undefined, Vehicle, 'findAll'],
    ['get', '/fleets/1/drivers', undefined, User, 'findAll']
])('%s %s database failures', (method, path, body, model, methodName) => {
    describe('errors', () => {
        test('Should return internal_server_error and leave the fleet unchanged', async () => {
            const fleet = await createFleet()
            jest.spyOn(console, 'log').mockImplementation(() => {})
            jest.spyOn(model, methodName).mockRejectedValueOnce(new Error('Injected database failure'))
            const response = await call(method, path.replace('/1', `/${fleet.id}`), body)
            expect(response.status).toBe(500)
            expect(response.body.id).toBe('internal_server_error')
            jest.restoreAllMocks()
            expect((await Fleet.findByPk(fleet.id)).name).toBe(fleet.name)
        })
    })
})

describe('POST /fleets', () => {
    describe('errors', () => {
        test.each([
            {}, { name: '   ', baseRegion: 'MG' }, { name: 'Fleet' }, { name: 'Fleet', baseRegion: '   ' },
            { name: 'x'.repeat(101), baseRegion: 'MG' }, { name: 'Fleet', baseRegion: 'x'.repeat(121) },
            { name: 'Fleet', baseRegion: 'MG', description: 'x'.repeat(256) }, { name: 123, baseRegion: 'MG' }
        ])('Should reject invalid fleet data %j', async body => {
            const response = await call('post', '/fleets', body)
            expect(response.status).toBe(400)
            expect(response.body.id).toBe('invalid_schema')
        })

        test('Should return 500 when persistence fails', async () => {
            jest.spyOn(console, 'log').mockImplementation(() => {})
            jest.spyOn(Fleet, 'create').mockRejectedValueOnce(new Error('Injected database failure'))
            const response = await call('post', '/fleets', { name: 'Fleet', baseRegion: 'MG' })
            expect(response.status).toBe(500)
            expect(response.body.id).toBe('internal_server_error')
        })
    })

    describe('success', () => {
        test('Should normalize fields and create active fleets without accepting injected attributes', async () => {
            const response = await call('post', '/fleets', { name: '  123  ', baseRegion: '  MG ', description: ' ', status: 'inactive', id: 2147483647 })
            expect(response.status).toBe(201)
            expect(response.body.data).toMatchObject({ name: '123', baseRegion: 'MG', description: null, status: 'active' })
            expect(response.body.data.id).not.toBe(2147483647)
        })

        test('Should accept nullable description and maximum lengths', async () => {
            const response = await call('post', '/fleets', { name: 'x'.repeat(100), baseRegion: 'x'.repeat(120), description: null })
            expect(response.status).toBe(201)
            expect(response.body.data.description).toBeNull()
        })

        test('Should allow duplicate fleet names', async () => {
            const fleet = await createFleet()
            const response = await call('post', '/fleets', { name: fleet.name, baseRegion: 'MG' })
            expect(response.status).toBe(201)
        })
    })
})

describe('GET /fleets', () => {
    describe('errors', () => {
        test.each(['status=unknown', 'status=123', 'search=' + 'x'.repeat(101), 'search=one&search=two'])('Should reject query %s', async query => {
            const response = await call('get', `/fleets?${query}`)
            expect(response.status).toBe(400)
            expect(response.body.id).toBe('invalid_schema')
        })

        test('Should return 500 instead of 404 when a query fails', async () => {
            jest.spyOn(console, 'log').mockImplementation(() => {})
            jest.spyOn(Fleet, 'findAll').mockRejectedValueOnce(new Error('Injected database failure'))
            const response = await call('get', '/fleets')
            expect(response.status).toBe(500)
            expect(response.body.id).toBe('internal_server_error')
        })
    })

    describe('success', () => {
        test('Should preserve numeric searches and return empty results', async () => {
            const name = String(Date.now())
            const fleet = await createFleet({ name })
            const response = await call('get', `/fleets?search=${name}`)
            expect(response.status).toBe(200)
            expect(response.body.data.map(row => row.id)).toContain(fleet.id)
            const empty = await call('get', `/fleets?search=${randomUUID()}`)
            expect(empty.body.data).toEqual([])
        })

        test.each(['%', '_', "'", '\\'])('Should treat %s as literal search text', async character => {
            const suffix = randomUUID()
            const fleet = await createFleet({ name: `${character}${suffix}` })
            await createFleet({ name: `other${suffix}` })
            const response = await call('get', `/fleets?search=${encodeURIComponent(character + suffix)}`)
            expect(response.status).toBe(200)
            expect(response.body.data.map(row => row.id)).toEqual([fleet.id])
        })

        test('Should filter statuses and default to all fleets', async () => {
            const name = randomUUID()
            const active = await createFleet({ name })
            const inactiveFleet = await createFleet({ name, status: 'inactive' })
            const all = await call('get', `/fleets?search=${name}`)
            const onlyActive = await call('get', `/fleets?search=${name}&status=active`)
            const onlyInactive = await call('get', `/fleets?search=${name}&status=inactive`)
            expect(all.body.data.map(row => row.id)).toEqual([active.id, inactiveFleet.id])
            expect(onlyActive.body.data.map(row => row.id)).toEqual([active.id])
            expect(onlyInactive.body.data.map(row => row.id)).toEqual([inactiveFleet.id])
        })
    })
})

describe('GET /fleets/:id and relationship lists', () => {
    describe('success', () => {
        test('Should count distinct drivers, ignore soft-deleted rows and show trip states', async () => {
            const { fleet, vehicle, driver: assignedDriver } = await createLinkedFleet()
            const secondVehicle = await createVehicle(fleet.id)
            await VehicleAssignment.create({ driverId: assignedDriver.id, vehicleId: secondVehicle.id })
            const { user: secondDriver } = await createTestUser('driver')
            await VehicleAssignment.create({ driverId: secondDriver.id, vehicleId: vehicle.id })
            const deletedVehicle = await createVehicle(fleet.id)
            await deletedVehicle.destroy()
            const { user: deletedDriver } = await createTestUser('driver')
            await VehicleAssignment.create({ driverId: deletedDriver.id, vehicleId: vehicle.id })
            await User.destroy({ where: { id: deletedDriver.id } })

            const detail = await call('get', `/fleets/${fleet.id}`)
            expect(detail.status).toBe(200)
            expect(detail.body.data).toMatchObject({ vehicleCount: 2, driverCount: 2, onTripCount: 1 })
            const list = await call('get', `/fleets?search=${encodeURIComponent(fleet.name)}`)
            expect(list.body.data[0]).toMatchObject({ vehicleCount: 2, driverCount: 2, onTripCount: 1 })
            const vehicles = await call('get', `/fleets/${fleet.id}/vehicles`)
            expect(vehicles.status).toBe(200)
            expect(vehicles.body.data).toHaveLength(2)
            expect(vehicles.body.data.find(row => row.id === vehicle.id)).toMatchObject({
                tripStatus: 'in_progress',
                tripDriver: { id: assignedDriver.id, name: assignedDriver.name }
            })
            expect(vehicles.body.data.find(row => row.id === secondVehicle.id)).toMatchObject({ tripStatus: 'free', tripDriver: null })
            expect(vehicles.body.data.find(row => row.id === vehicle.id).assignedDrivers).toHaveLength(2)
            const drivers = await call('get', `/fleets/${fleet.id}/drivers`)
            expect(drivers.status).toBe(200)
            expect(drivers.body.data).toHaveLength(2)
            expect(drivers.body.data.find(row => row.id === assignedDriver.id)).toMatchObject({ tripStatus: 'in_progress' })
            expect(JSON.stringify([detail.body, vehicles.body, drivers.body])).not.toContain('passwordHash')
        })

        test('Should expose zero counts and empty relationship lists', async () => {
            const fleet = await createFleet()
            const detail = await call('get', `/fleets/${fleet.id}`)
            expect(detail.body.data).toMatchObject({ vehicleCount: 0, driverCount: 0, onTripCount: 0 })
            for (const suffix of ['vehicles', 'drivers']) {
                const response = await call('get', `/fleets/${fleet.id}/${suffix}`)
                expect(response.status).toBe(200)
                expect(response.body.data).toEqual([])
            }
        })
    })
})

describe('PUT /fleets/:id', () => {
    describe('errors', () => {
        test('Should require both editable fields', async () => {
            const fleet = await createFleet()
            const response = await call('put', `/fleets/${fleet.id}`, { name: 'Changed' })
            expect(response.status).toBe(400)
            expect(response.body.id).toBe('invalid_schema')
        })
    })

    describe('success', () => {
        test('Should let another manager view, edit, change status and delete a fleet (P07 assumption)', async () => {
            const created = await call('post', '/fleets', { name: 'Shared Fleet', baseRegion: 'MG' })
            const id = created.body.data.id
            expect((await call('get', `/fleets/${id}`, undefined, otherManager.token)).status).toBe(200)
            const edited = await call('put', `/fleets/${id}`, { name: 'Shared Changed', baseRegion: 'SP', status: 'inactive' }, otherManager.token)
            expect(edited.status).toBe(200)
            expect(edited.body.data).toMatchObject({ name: 'Shared Changed', baseRegion: 'SP', status: 'active' })
            expect((await call('patch', `/fleets/${id}/status`, { status: 'inactive' }, otherManager.token)).status).toBe(200)
            expect((await call('delete', `/fleets/${id}`, { confirmationName: 'Shared Changed' }, otherManager.token)).status).toBe(200)
        })
    })
})

describe('PATCH /fleets/:id/status', () => {
    describe('errors', () => {
        test('Should reject unknown statuses', async () => {
            const response = await call('patch', '/fleets/1/status', { status: 'deleted' })
            expect(response.status).toBe(400)
            expect(response.body.id).toBe('invalid_schema')
        })
    })

    describe('success', () => {
        test('Should deactivate and reactivate idempotently without altering links or trips', async () => {
            const { fleet, vehicle, trip } = await createLinkedFleet()
            for (const status of ['inactive', 'inactive', 'active', 'active']) {
                const response = await call('patch', `/fleets/${fleet.id}/status`, { status })
                expect(response.status).toBe(200)
                expect(response.body.data.status).toBe(status)
            }
            expect(await VehicleAssignment.count({ where: { vehicleId: vehicle.id } })).toBe(1)
            expect((await vehicle.reload()).fleetId).toBe(fleet.id)
            expect((await trip.reload()).status).toBe('in_progress')
        })
    })
})

describe('DELETE /fleets/:id', () => {
    describe('errors', () => {
        test('Should require a confirmation body', async () => {
            const response = await call('delete', '/fleets/1', {})
            expect(response.status).toBe(400)
            expect(response.body.id).toBe('invalid_schema')
        })

        test('Should compare the exact name and leave data untouched on mismatch', async () => {
            const { fleet, vehicle } = await createLinkedFleet({ name: 'Exact Name' })
            for (const name of ['exact name', 'Exact Name ', 'Wrong']) {
                const response = await call('delete', `/fleets/${fleet.id}`, { confirmationName: name })
                expect(response.status).toBe(400)
                expect(response.body.id).toBe('fleet_name_confirmation_mismatch')
            }
            expect(await Fleet.findByPk(fleet.id)).not.toBeNull()
            expect(await VehicleAssignment.count({ where: { vehicleId: vehicle.id } })).toBe(1)
        })

        test('Should roll back deleted assignments when fleet deletion fails', async () => {
            const { fleet, vehicle } = await createLinkedFleet()
            jest.spyOn(console, 'log').mockImplementation(() => {})
            jest.spyOn(Fleet, 'destroy').mockRejectedValueOnce(new Error('Injected deletion failure'))
            const response = await call('delete', `/fleets/${fleet.id}`, { confirmationName: fleet.name })
            expect(response.status).toBe(500)
            expect(response.body.id).toBe('internal_server_error')
            expect(await Fleet.findByPk(fleet.id)).not.toBeNull()
            expect((await vehicle.reload()).fleetId).toBe(fleet.id)
            expect(await VehicleAssignment.count({ where: { vehicleId: vehicle.id } })).toBe(1)
        })
    })

    describe('success', () => {
        test('Should delete an empty fleet', async () => {
            const fleet = await createFleet()
            const response = await call('delete', `/fleets/${fleet.id}`, { confirmationName: fleet.name })
            expect(response.status).toBe(200)
            expect(response.body.data).toEqual({})
            expect(await Fleet.findByPk(fleet.id)).toBeNull()
        })

        test('Should unlink all vehicles and preserve records including an ongoing trip', async () => {
            const { fleet, vehicle, driver: assignedDriver, trip, reading } = await createLinkedFleet()
            const deletedVehicle = await createVehicle(fleet.id)
            await VehicleAssignment.create({ driverId: assignedDriver.id, vehicleId: deletedVehicle.id })
            await deletedVehicle.destroy()
            const unrelatedFleet = await createFleet()
            const unrelatedVehicle = await createVehicle(unrelatedFleet.id)
            await VehicleAssignment.create({ driverId: driver.user.id, vehicleId: unrelatedVehicle.id })
            const photo = await Photo.create({ kind: 'receipt', storageKey: randomUUID(), mimeType: 'image/jpeg', sizeBytes: 100, uploadedBy: assignedDriver.id })
            const expense = await Expense.create({ vehicleId: vehicle.id, driverId: assignedDriver.id, tripId: trip.id, category: 'toll', amount: '20.00', receiptPhotoId: photo.id })
            const fuelReading = await OdometerReading.create({ vehicleId: vehicle.id, recordedBy: assignedDriver.id, valueKm: 0, source: 'refueling' })
            const refueling = await Refueling.create({ vehicleId: vehicle.id, driverId: assignedDriver.id, tripId: trip.id, odometerReadingId: fuelReading.id, liters: 10, pricePerLiter: 6, totalAmount: 60, gasStation: 'Test' })
            const maintenanceReading = await OdometerReading.create({ vehicleId: vehicle.id, recordedBy: assignedDriver.id, valueKm: 0, source: 'maintenance' })
            const maintenance = await Maintenance.create({ vehicleId: vehicle.id, driverId: assignedDriver.id, tripId: trip.id, odometerReadingId: maintenanceReading.id, type: 'urgent', service: 'Tire repair', amount: 20, workshop: 'Test' })

            const response = await call('delete', `/fleets/${fleet.id}`, { confirmationName: fleet.name })
            expect(response.status).toBe(200)
            expect(await Fleet.findByPk(fleet.id)).toBeNull()
            expect((await vehicle.reload()).fleetId).toBeNull()
            expect((await Vehicle.findByPk(deletedVehicle.id, { paranoid: false })).fleetId).toBeNull()
            expect(await VehicleAssignment.count({ where: { vehicleId: [vehicle.id, deletedVehicle.id] } })).toBe(0)
            expect(await VehicleAssignment.count({ where: { vehicleId: unrelatedVehicle.id } })).toBe(1)
            expect((await trip.reload()).status).toBe('in_progress')
            expect(await Expense.findByPk(expense.id)).not.toBeNull()
            expect(await Photo.findByPk(photo.id)).not.toBeNull()
            expect(await OdometerReading.findByPk(reading.id)).not.toBeNull()
            expect(await Refueling.findByPk(refueling.id)).not.toBeNull()
            expect(await Maintenance.findByPk(maintenance.id)).not.toBeNull()
            expect(await User.findByPk(assignedDriver.id)).not.toBeNull()
        })

        test('Should serialize concurrent deletions', async () => {
            const { fleet } = await createLinkedFleet()
            const responses = await Promise.all([
                call('delete', `/fleets/${fleet.id}`, { confirmationName: fleet.name }),
                call('delete', `/fleets/${fleet.id}`, { confirmationName: fleet.name }, otherManager.token)
            ])
            expect(responses.map(response => response.status).sort()).toEqual([200, 404])
        })

        test('Should serialize renaming with confirmation against the current name', async () => {
            const fleet = await createFleet()
            const [renamed, deleted] = await Promise.all([
                call('put', `/fleets/${fleet.id}`, { name: 'Renamed Fleet', baseRegion: 'MG' }),
                call('delete', `/fleets/${fleet.id}`, { confirmationName: fleet.name }, otherManager.token)
            ])
            expect([[200, 400], [404, 200]]).toContainEqual([renamed.status, deleted.status])
            if (renamed.status === 200) expect(deleted.body.id).toBe('fleet_name_confirmation_mismatch')
        })
    })
})
