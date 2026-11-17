const request = require('supertest')
const { Fleet, Vehicle, ServiceReminder } = require('../../../app/database/models')
const { createTestUser } = require('../../utils/user.util')
const { createAssignedDriver, startTrip, uploadPhoto } = require('../../utils/trip.util')

let manager

beforeAll(async () => {
    manager = await createTestUser()
})

/**
 * @param {string} path
 * @param {string} token
 */
function get(path, token) {
    return request(global.app).get(path).set('Authorization', `Bearer ${token}`)
}

describe('GET /users/@me/vehicles', () => {
    describe('errors', () => {
        test('Should reject managers', async () => {
            const response = await get('/users/@me/vehicles', manager.token)
            expect(response.status).toBe(403)
            expect(response.body.id).toBe('forbidden')
        })
    })

    describe('success', () => {
        test('Should list only assigned vehicles with their trip status and next alert', async () => {
            const { fleet, vehicle, driver } = await createAssignedDriver(manager.user.id)
            const { driver: other } = await createAssignedDriver(manager.user.id, { fleetRecord: fleet, vehicleRecord: vehicle })
            await createAssignedDriver(manager.user.id)
            await ServiceReminder.create({ vehicleId: vehicle.id, title: 'Revisão', dueOdometer: 185102 })
            await startTrip(other.token, vehicle.id)

            const response = await get('/users/@me/vehicles', driver.token)

            expect(response.status).toBe(200)
            expect(response.body.data).toHaveLength(1)
            expect(response.body.data[0]).toMatchObject({
                id: vehicle.id,
                plate: vehicle.plate,
                tripStatus: 'unavailable',
                trip: { id: null, driver: { id: other.user.id, name: other.user.name } },
                serviceAlert: { title: 'Revisão', remainingKm: 800, overdue: false }
            })

            const own = await get('/users/@me/vehicles', other.token)
            expect(own.body.data[0]).toMatchObject({ tripStatus: 'on_trip', trip: { id: expect.any(Number) } })
        })

        test('Should flag vehicles of an inactive fleet', async () => {
            const { fleet, driver } = await createAssignedDriver(manager.user.id)
            await Fleet.update({ status: 'inactive' }, { where: { id: fleet.id } })

            const response = await get('/users/@me/vehicles', driver.token)
            expect(response.body.data[0].tripStatus).toBe('inactive')
        })
    })
})

describe('GET /users/@me/vehicles/:id', () => {
    describe('errors', () => {
        test('Should return 404 for an unassigned vehicle', async () => {
            const { driver } = await createAssignedDriver(manager.user.id)
            const { vehicle } = await createAssignedDriver(manager.user.id)

            const response = await get(`/users/@me/vehicles/${vehicle.id}`, driver.token)
            expect(response.status).toBe(404)
            expect(response.body.id).toBe('vehicle_not_found')
        })
    })

    describe('success', () => {
        test('Should return the last reading, alerts and recent history', async () => {
            const { vehicle, driver } = await createAssignedDriver(manager.user.id)
            await ServiceReminder.create({ vehicleId: vehicle.id, title: 'Troca de óleo', dueOdometer: 183882 })
            const started = await startTrip(driver.token, vehicle.id)
            const photo = await uploadPhoto(driver.token)
            await request(global.app).post('/refuelings').set('Authorization', `Bearer ${driver.token}`)
                .send({ liters: 100, pricePerLiter: 6, odometer: 184400, gasStation: 'Posto Graal', odometerPhotoId: photo.id })

            const response = await get(`/users/@me/vehicles/${vehicle.id}`, driver.token)

            expect(response.status).toBe(200)
            expect(response.body.data).toMatchObject({
                tripStatus: 'on_trip',
                currentOdometer: 184400,
                lastReading: { valueKm: 184400, source: 'refueling', hasPhoto: true },
                serviceAlerts: [{ title: 'Troca de óleo', remainingKm: -518, overdue: true }]
            })
            expect(response.body.data.recentTrips.map((trip) => trip.id)).toEqual([started.body.data.id])
            expect(response.body.data.recentRefuelings[0]).toMatchObject({ amount: 600, trip: { id: started.body.data.id } })
            expect((await Vehicle.findByPk(vehicle.id)).currentOdometer).toBe(184400)
        })
    })
})
