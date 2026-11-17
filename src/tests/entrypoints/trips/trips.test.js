const request = require('supertest')
const { User, Vehicle, Trip, OdometerReading, Expense, Refueling, VehicleAssignment } = require('../../../app/database/models')
const { createTestUser } = require('../../utils/user.util')
const { createVehicle } = require('../../utils/fleet.util')
const { JPEG, uploadPhoto, createAssignedDriver, startTrip } = require('../../utils/trip.util')

let manager

beforeAll(async () => {
    manager = await createTestUser()
})

/**
 * @param {string} method
 * @param {string} path
 * @param {string} token
 * @param {object} body
 */
function call(method, path, token, body) {
    const pending = request(global.app)[method](path).set('Authorization', `Bearer ${token}`)
    return body === undefined ? pending : pending.send(body)
}

/**
 * @param {string} token
 * @param {number} tripId
 * @param {object} overrides
 */
async function finishTrip(token, tripId, overrides = {}) {
    const photo = await request(global.app)
        .post(`/trips/${tripId}/photos`)
        .set('Authorization', `Bearer ${token}`)
        .attach('photo', JPEG, 'odometer.jpg')

    return call('post', `/trips/${tripId}/finish`, token, {
        endOdometer: 184941,
        odometerPhotoId: photo.body.data.id,
        notes: 'Trânsito intenso na Anchieta',
        ...overrides
    })
}

describe('POST /trips', () => {
    describe('errors', () => {
        test('Should reject missing authentication', async () => {
            const response = await request(global.app).post('/trips').send({})
            expect(response.status).toBe(401)
            expect(response.body.id).toBe('unauthorized')
        })

        test('Should reject managers', async () => {
            const response = await call('post', '/trips', manager.token, {})
            expect(response.status).toBe(403)
            expect(response.body.id).toBe('forbidden')
        })

        test('Should validate the body', async () => {
            const { driver } = await createAssignedDriver(manager.user.id)
            const response = await call('post', '/trips', driver.token, { vehicleId: 'x', origin: ' ', startOdometer: -1 })

            expect(response.status).toBe(400)
            expect(response.body.id).toBe('invalid_schema')
            const paths = response.body.data.errors.map((error) => error.path[0])
            expect(paths).toEqual(expect.arrayContaining(['vehicleId', 'origin', 'destination', 'startOdometer', 'odometerPhotoId']))
        })

        test('Should return 404 for a vehicle not assigned to the driver', async () => {
            const { driver } = await createAssignedDriver(manager.user.id)
            const { vehicle } = await createAssignedDriver(manager.user.id)

            const response = await startTrip(driver.token, vehicle.id)
            expect(response.status).toBe(404)
            expect(response.body.id).toBe('vehicle_not_found')
        })

        test("Should return 404 for another driver's photo", async () => {
            const { driver, vehicle } = await createAssignedDriver(manager.user.id)
            const other = await createTestUser('driver')
            const photo = await uploadPhoto(other.token)

            const response = await startTrip(driver.token, vehicle.id, { odometerPhotoId: photo.id })
            expect(response.status).toBe(404)
            expect(response.body.id).toBe('photo_not_found')
        })

        test('Should reject a photo that is not of the odometer', async () => {
            const { driver, vehicle } = await createAssignedDriver(manager.user.id)
            const photo = await uploadPhoto(driver.token, 'receipt')

            const response = await startTrip(driver.token, vehicle.id, { odometerPhotoId: photo.id })
            expect(response.status).toBe(400)
            expect(response.body.id).toBe('invalid_photo_kind')
        })

        test('Should reject an odometer below the last reading', async () => {
            const { driver, vehicle } = await createAssignedDriver(manager.user.id)

            const response = await startTrip(driver.token, vehicle.id, { startOdometer: 184120 })
            expect(response.status).toBe(400)
            expect(response.body.id).toBe('odometer_below_last_reading')
            expect(await Trip.count({ where: { vehicleId: vehicle.id } })).toBe(0)
        })

        test('Should reject a vehicle on a trip with another driver', async () => {
            const { fleet, vehicle, driver } = await createAssignedDriver(manager.user.id)
            const { driver: other } = await createAssignedDriver(manager.user.id, { fleetRecord: fleet, vehicleRecord: vehicle })
            expect((await startTrip(other.token, vehicle.id)).status).toBe(201)

            const response = await startTrip(driver.token, vehicle.id)
            expect(response.status).toBe(409)
            expect(response.body.id).toBe('vehicle_on_trip')
        })

        test('Should reject a second trip for the same driver', async () => {
            const { fleet, vehicle, driver } = await createAssignedDriver(manager.user.id)
            const second = await createVehicle(fleet.id, { currentOdometer: 1000 })
            await VehicleAssignment.create({ driverId: driver.user.id, vehicleId: second.id })
            expect((await startTrip(driver.token, vehicle.id)).status).toBe(201)

            const response = await startTrip(driver.token, second.id, { startOdometer: 1000 })
            expect(response.status).toBe(409)
            expect(response.body.id).toBe('driver_has_trip_in_progress')
        })

        test('Should reject an inactive vehicle', async () => {
            const { driver, vehicle } = await createAssignedDriver(manager.user.id, { vehicle: { status: 'inactive' } })

            const response = await startTrip(driver.token, vehicle.id)
            expect(response.status).toBe(409)
            expect(response.body.id).toBe('vehicle_unavailable')
        })

        test('Should reject a vehicle of an inactive fleet', async () => {
            const { driver, vehicle } = await createAssignedDriver(manager.user.id, { fleet: { status: 'inactive' } })

            const response = await startTrip(driver.token, vehicle.id)
            expect(response.status).toBe(409)
            expect(response.body.id).toBe('vehicle_unavailable')
        })

        test('Should reject an inactive driver', async () => {
            const { driver, vehicle } = await createAssignedDriver(manager.user.id)
            const photo = await uploadPhoto(driver.token)
            await User.update({ status: 'inactive' }, { where: { id: driver.user.id } })

            const response = await startTrip(driver.token, vehicle.id, { odometerPhotoId: photo.id })
            expect(response.status).toBe(403)
            expect(response.body.id).toBe('account_inactive')
        })

        test('Should reject a photo already used by another reading', async () => {
            const { driver, vehicle } = await createAssignedDriver(manager.user.id)
            const started = await startTrip(driver.token, vehicle.id)
            await call('post', `/trips/${started.body.data.id}/cancel`, driver.token)

            const response = await startTrip(driver.token, vehicle.id, { odometerPhotoId: started.body.data.startPhotoId })
            expect(response.status).toBe(409)
            expect(response.body.id).toBe('photo_already_used')
        })

        test('Should start only one of two concurrent trips on the same vehicle', async () => {
            const { fleet, vehicle, driver } = await createAssignedDriver(manager.user.id)
            const { driver: other } = await createAssignedDriver(manager.user.id, { fleetRecord: fleet, vehicleRecord: vehicle })
            const photos = await Promise.all([uploadPhoto(driver.token), uploadPhoto(other.token)])

            const responses = await Promise.all([
                startTrip(driver.token, vehicle.id, { odometerPhotoId: photos[0].id }),
                startTrip(other.token, vehicle.id, { odometerPhotoId: photos[1].id })
            ])

            expect(responses.map((response) => response.status).sort()).toEqual([201, 409])
            expect(responses.find((response) => response.status === 409).body.id).toBe('vehicle_on_trip')
            expect(await Trip.count({ where: { vehicleId: vehicle.id, status: 'in_progress' } })).toBe(1)
        })
    })

    describe('success', () => {
        test('Should start the trip, record the reading and advance the odometer', async () => {
            const { driver, vehicle } = await createAssignedDriver(manager.user.id)
            const before = Date.now()

            const response = await startTrip(driver.token, vehicle.id, { startOdometer: 184310, origin: '  Uberlândia, MG ' })

            expect(response.status).toBe(201)
            expect(response.body.data).toMatchObject({
                status: 'in_progress',
                origin: 'Uberlândia, MG',
                destination: 'Santos, SP',
                vehicle: { id: vehicle.id, plate: vehicle.plate, brand: 'Scania', model: 'R450' },
                startOdometer: 184310,
                endOdometer: null,
                distanceKm: null,
                endedAt: null,
                records: [],
                summary: { totalExpenses: 0, costPerKm: null, receiptCount: 0, odometerPhotoCount: 1 }
            })
            expect(new Date(response.body.data.startedAt).getTime()).toBeGreaterThanOrEqual(before - 1000)

            const reading = await OdometerReading.findOne({ where: { vehicleId: vehicle.id, source: 'trip_start' } })
            expect(reading).toMatchObject({ valueKm: 184310, recordedBy: driver.user.id, photoId: response.body.data.startPhotoId })
            expect((await Vehicle.findByPk(vehicle.id)).currentOdometer).toBe(184310)
        })

        test('Should accept an odometer equal to the last reading', async () => {
            const { driver, vehicle } = await createAssignedDriver(manager.user.id)

            const response = await startTrip(driver.token, vehicle.id, { startOdometer: 184302 })
            expect(response.status).toBe(201)
        })
    })
})

describe('GET /trips', () => {
    describe('errors', () => {
        test('Should reject managers', async () => {
            const response = await call('get', '/trips', manager.token)
            expect(response.status).toBe(403)
            expect(response.body.id).toBe('forbidden')
        })

        test('Should reject an invalid filter', async () => {
            const { driver } = await createAssignedDriver(manager.user.id)
            const response = await call('get', '/trips?status=cancelled', driver.token)
            expect(response.status).toBe(400)
            expect(response.body.id).toBe('invalid_schema')
        })
    })

    describe('success', () => {
        test("Should list only the driver's trips, newest first, with the filter", async () => {
            const { driver, vehicle } = await createAssignedDriver(manager.user.id)
            const { driver: other, vehicle: otherVehicle } = await createAssignedDriver(manager.user.id)
            await startTrip(other.token, otherVehicle.id)

            const cancelled = await startTrip(driver.token, vehicle.id)
            await call('post', `/trips/${cancelled.body.data.id}/cancel`, driver.token)
            const finished = await startTrip(driver.token, vehicle.id)
            await finishTrip(driver.token, finished.body.data.id)
            const current = await startTrip(driver.token, vehicle.id, { startOdometer: 184941 })

            const all = await call('get', '/trips', driver.token)
            expect(all.status).toBe(200)
            expect(all.body.data.map((trip) => trip.id)).toEqual([current.body.data.id, finished.body.data.id, cancelled.body.data.id])
            expect(all.body.data[1]).toMatchObject({ status: 'finished', distanceKm: 639, vehicle: { plate: vehicle.plate } })
            expect(all.body.data[2]).toMatchObject({ status: 'cancelled', distanceKm: null })

            const inProgress = await call('get', '/trips?status=in_progress', driver.token)
            expect(inProgress.body.data.map((trip) => trip.id)).toEqual([current.body.data.id])

            const done = await call('get', '/trips?status=finished', driver.token)
            expect(done.body.data.map((trip) => trip.id)).toEqual([finished.body.data.id])
        })

        test('Should keep trips of a deleted vehicle in the history', async () => {
            const { driver, vehicle } = await createAssignedDriver(manager.user.id)
            const started = await startTrip(driver.token, vehicle.id)
            await finishTrip(driver.token, started.body.data.id)
            await Vehicle.destroy({ where: { id: vehicle.id } })

            const response = await call('get', '/trips', driver.token)
            expect(response.body.data[0].vehicle.plate).toBe(vehicle.plate)
        })
    })
})

describe('GET /trips/current', () => {
    describe('errors', () => {
        test('Should reject managers', async () => {
            const response = await call('get', '/trips/current', manager.token)
            expect(response.status).toBe(403)
            expect(response.body.id).toBe('forbidden')
        })
    })

    describe('success', () => {
        test('Should return null without a trip in progress', async () => {
            const { driver } = await createAssignedDriver(manager.user.id)

            const response = await call('get', '/trips/current', driver.token)
            expect(response.status).toBe(200)
            expect(response.body.data).toBeNull()
        })

        test('Should return the trip in progress', async () => {
            const { driver, vehicle } = await createAssignedDriver(manager.user.id)
            const started = await startTrip(driver.token, vehicle.id)

            const response = await call('get', '/trips/current', driver.token)
            expect(response.status).toBe(200)
            expect(response.body.data).toMatchObject({ id: started.body.data.id, status: 'in_progress' })
        })
    })
})

describe('GET /trips/:id', () => {
    describe('errors', () => {
        test('Should reject an invalid id', async () => {
            const { driver } = await createAssignedDriver(manager.user.id)
            const response = await call('get', '/trips/0', driver.token)
            expect(response.status).toBe(400)
            expect(response.body.id).toBe('invalid_schema')
        })

        test("Should return 404 for another driver's trip", async () => {
            const { driver, vehicle } = await createAssignedDriver(manager.user.id)
            const other = await createTestUser('driver')
            const started = await startTrip(driver.token, vehicle.id)

            const response = await call('get', `/trips/${started.body.data.id}`, other.token)
            expect(response.status).toBe(404)
            expect(response.body.id).toBe('trip_not_found')
        })
    })

    describe('success', () => {
        test('Should return the records and the summary of a finished trip', async () => {
            const { driver, vehicle } = await createAssignedDriver(manager.user.id)
            const started = await startTrip(driver.token, vehicle.id)
            const tripId = started.body.data.id
            const receipt = await uploadPhoto(driver.token, 'receipt')
            const invoice = await uploadPhoto(driver.token, 'invoice')
            const base = { driverId: driver.user.id, vehicleId: vehicle.id, tripId }
            await Expense.create({ ...base, category: 'toll', amount: '48.30', receiptPhotoId: receipt.id })
            await Expense.create({ ...base, category: 'food', amount: '42.00' })
            const fuelReading = await OdometerReading.create({ vehicleId: vehicle.id, recordedBy: driver.user.id, valueKm: 184500, source: 'refueling' })
            await Refueling.create({ ...base, odometerReadingId: fuelReading.id, liters: '220.00', pricePerLiter: '6.420', totalAmount: '1412.40', gasStation: 'Posto Graal', invoicePhotoId: invoice.id })
            await Vehicle.update({ currentOdometer: 184500 }, { where: { id: vehicle.id } })
            await finishTrip(driver.token, tripId)

            const response = await call('get', `/trips/${tripId}`, driver.token)

            expect(response.status).toBe(200)
            expect(response.body.data.records).toHaveLength(3)
            expect(response.body.data.records).toEqual(expect.arrayContaining([
                expect.objectContaining({ type: 'expense', category: 'toll', amount: 48.3, hasReceipt: true }),
                expect.objectContaining({ type: 'expense', category: 'food', amount: 42, hasReceipt: false }),
                expect.objectContaining({ type: 'refueling', category: 'fuel', amount: 1412.4, liters: 220, gasStation: 'Posto Graal', hasReceipt: true })
            ]))
            expect(response.body.data).toMatchObject({
                distanceKm: 639,
                notes: 'Trânsito intenso na Anchieta',
                summary: { totalExpenses: 1502.7, costPerKm: 2.35, receiptCount: 2, odometerPhotoCount: 2 }
            })
        })
    })
})

describe('POST /trips/:id/photos', () => {
    describe('errors', () => {
        test("Should return 404 for another driver's trip", async () => {
            const { driver, vehicle } = await createAssignedDriver(manager.user.id)
            const { driver: other } = await createAssignedDriver(manager.user.id)
            const started = await startTrip(driver.token, vehicle.id)

            const response = await request(global.app)
                .post(`/trips/${started.body.data.id}/photos`)
                .set('Authorization', `Bearer ${other.token}`)
                .attach('photo', JPEG, 'a.jpg')
            expect(response.status).toBe(404)
            expect(response.body.id).toBe('trip_not_found')
        })
    })

    describe('success', () => {
        test('Should store an odometer photo for a driver deactivated during the trip', async () => {
            const { driver, vehicle } = await createAssignedDriver(manager.user.id)
            const started = await startTrip(driver.token, vehicle.id)
            await User.update({ status: 'inactive' }, { where: { id: driver.user.id } })

            const response = await request(global.app)
                .post(`/trips/${started.body.data.id}/photos`)
                .set('Authorization', `Bearer ${driver.token}`)
                .attach('photo', JPEG, 'a.jpg')
            expect(response.status).toBe(201)
            expect(response.body.data).toMatchObject({ kind: 'odometer', mimeType: 'image/jpeg' })
        })
    })
})

describe('POST /trips/:id/finish', () => {
    describe('errors', () => {
        test('Should return 404 for a manager', async () => {
            const response = await call('post', '/trips/1/finish', manager.token, { endOdometer: 1, odometerPhotoId: 1 })
            expect(response.status).toBe(404)
            expect(response.body.id).toBe('trip_not_found')
        })

        test('Should validate the body', async () => {
            const { driver, vehicle } = await createAssignedDriver(manager.user.id)
            const started = await startTrip(driver.token, vehicle.id)

            const response = await call('post', `/trips/${started.body.data.id}/finish`, driver.token, { endOdometer: 1.5, notes: 'x'.repeat(501) })
            expect(response.status).toBe(400)
            expect(response.body.id).toBe('invalid_schema')
        })

        test('Should reject a final odometer below the last reading', async () => {
            const { driver, vehicle } = await createAssignedDriver(manager.user.id)
            const started = await startTrip(driver.token, vehicle.id)

            const response = await finishTrip(driver.token, started.body.data.id, { endOdometer: 184301 })
            expect(response.status).toBe(400)
            expect(response.body.id).toBe('odometer_below_last_reading')
            expect((await Trip.findByPk(started.body.data.id)).status).toBe('in_progress')
        })

        test('Should reject the start photo', async () => {
            const { driver, vehicle } = await createAssignedDriver(manager.user.id)
            const started = await startTrip(driver.token, vehicle.id)

            const response = await call('post', `/trips/${started.body.data.id}/finish`, driver.token, { endOdometer: 184941, odometerPhotoId: started.body.data.startPhotoId })
            expect(response.status).toBe(409)
            expect(response.body.id).toBe('photo_already_used')
        })

        test('Should not finish a trip twice, so the final odometer stays locked', async () => {
            const { driver, vehicle } = await createAssignedDriver(manager.user.id)
            const started = await startTrip(driver.token, vehicle.id)
            await finishTrip(driver.token, started.body.data.id)

            const photo = await uploadPhoto(driver.token)
            const response = await call('post', `/trips/${started.body.data.id}/finish`, driver.token, { endOdometer: 190000, odometerPhotoId: photo.id })
            expect(response.status).toBe(404)
            expect(response.body.id).toBe('trip_not_found')
            expect((await Vehicle.findByPk(vehicle.id)).currentOdometer).toBe(184941)
        })

        test("Should return 404 for another driver's trip", async () => {
            const { driver, vehicle } = await createAssignedDriver(manager.user.id)
            const { driver: other } = await createAssignedDriver(manager.user.id)
            const started = await startTrip(driver.token, vehicle.id)
            const photo = await uploadPhoto(other.token)

            const response = await call('post', `/trips/${started.body.data.id}/finish`, other.token, { endOdometer: 184941, odometerPhotoId: photo.id })
            expect(response.status).toBe(404)
            expect(response.body.id).toBe('trip_not_found')
        })
    })

    describe('success', () => {
        test('Should finish the trip with the final reading and the summary', async () => {
            const { driver, vehicle } = await createAssignedDriver(manager.user.id)
            const started = await startTrip(driver.token, vehicle.id)

            const response = await finishTrip(driver.token, started.body.data.id)

            expect(response.status).toBe(200)
            expect(response.body.data).toMatchObject({
                status: 'finished',
                startOdometer: 184302,
                endOdometer: 184941,
                distanceKm: 639,
                notes: 'Trânsito intenso na Anchieta',
                summary: { totalExpenses: 0, costPerKm: 0, odometerPhotoCount: 2 }
            })
            expect(response.body.data.endedAt).not.toBeNull()
            expect((await Vehicle.findByPk(vehicle.id)).currentOdometer).toBe(184941)
            expect(await OdometerReading.count({ where: { vehicleId: vehicle.id, source: 'trip_end', valueKm: 184941 } })).toBe(1)

            const current = await call('get', '/trips/current', driver.token)
            expect(current.body.data).toBeNull()
        })

        test('Should store empty notes as null', async () => {
            const { driver, vehicle } = await createAssignedDriver(manager.user.id)
            const started = await startTrip(driver.token, vehicle.id)

            const response = await finishTrip(driver.token, started.body.data.id, { notes: '   ' })
            expect(response.status).toBe(200)
            expect(response.body.data.notes).toBeNull()
        })

        test('Should let a driver deactivated during the trip finish it, then block access', async () => {
            const { driver, vehicle } = await createAssignedDriver(manager.user.id)
            const started = await startTrip(driver.token, vehicle.id)
            await call('patch', `/drivers/${driver.user.id}/status`, manager.token, { status: 'inactive' })
            expect(await VehicleAssignment.count({ where: { driverId: driver.user.id } })).toBe(0)

            const response = await finishTrip(driver.token, started.body.data.id)
            expect(response.status).toBe(200)
            expect(response.body.data.status).toBe('finished')

            const after = await call('get', '/trips', driver.token)
            expect(after.status).toBe(403)
            expect(after.body.id).toBe('account_inactive')
        })
    })
})

describe('POST /trips/:id/cancel', () => {
    describe('errors', () => {
        test("Should return 404 for another driver's trip", async () => {
            const { driver, vehicle } = await createAssignedDriver(manager.user.id)
            const { driver: other } = await createAssignedDriver(manager.user.id)
            const started = await startTrip(driver.token, vehicle.id)

            const response = await call('post', `/trips/${started.body.data.id}/cancel`, other.token)
            expect(response.status).toBe(404)
            expect(response.body.id).toBe('trip_not_found')
        })

        test('Should not cancel a finished trip', async () => {
            const { driver, vehicle } = await createAssignedDriver(manager.user.id)
            const started = await startTrip(driver.token, vehicle.id)
            await finishTrip(driver.token, started.body.data.id)

            const response = await call('post', `/trips/${started.body.data.id}/cancel`, driver.token)
            expect(response.status).toBe(404)
            expect(response.body.id).toBe('trip_not_found')
            expect((await Trip.findByPk(started.body.data.id)).status).toBe('finished')
        })
    })

    describe('success', () => {
        test('Should cancel the trip without an arrival and keep its expenses', async () => {
            const { driver, vehicle } = await createAssignedDriver(manager.user.id)
            const started = await startTrip(driver.token, vehicle.id)
            await Expense.create({ driverId: driver.user.id, vehicleId: vehicle.id, tripId: started.body.data.id, category: 'toll', amount: '48.30' })

            const response = await call('post', `/trips/${started.body.data.id}/cancel`, driver.token)

            expect(response.status).toBe(200)
            expect(response.body.data).toMatchObject({ status: 'cancelled', endOdometer: null, distanceKm: null, summary: { totalExpenses: 48.3 } })
            expect(response.body.data.endedAt).not.toBeNull()
            expect((await Vehicle.findByPk(vehicle.id)).currentOdometer).toBe(184302)

            const again = await startTrip(driver.token, vehicle.id)
            expect(again.status).toBe(201)
        })

        test('Should let a driver deactivated during the trip cancel it', async () => {
            const { driver, vehicle } = await createAssignedDriver(manager.user.id)
            const started = await startTrip(driver.token, vehicle.id)
            await User.update({ status: 'inactive' }, { where: { id: driver.user.id } })

            const response = await call('post', `/trips/${started.body.data.id}/cancel`, driver.token)
            expect(response.status).toBe(200)
            expect(response.body.data.status).toBe('cancelled')
        })
    })
})
