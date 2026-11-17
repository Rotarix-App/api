const request = require('supertest')
const { Expense, ServiceReminder } = require('../../../app/database/models')
const { createTestUser } = require('../../utils/user.util')
const { createFleet } = require('../../utils/fleet.util')
const { JPEG, uploadPhoto, createAssignedDriver, startTrip } = require('../../utils/trip.util')

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
 * @param {number} endOdometer
 */
async function finish(token, tripId, endOdometer) {
    const photo = await request(global.app).post(`/trips/${tripId}/photos`).set('Authorization', `Bearer ${token}`).attach('photo', JPEG, 'a.jpg')
    return call('post', `/trips/${tripId}/finish`, token, { endOdometer, odometerPhotoId: photo.body.data.id })
}

async function scenario() {
    const manager = await createTestUser()
    const { fleet, vehicle, driver } = await createAssignedDriver(manager.user.id)
    const trip = await startTrip(driver.token, vehicle.id)
    const tripId = trip.body.data.id
    await call('post', '/expenses', driver.token, { category: 'toll', amount: 48.3 })
    await call('post', '/expenses', driver.token, { category: 'food', amount: 42 })
    const odometer = await uploadPhoto(driver.token)
    await call('post', '/refuelings', driver.token, { liters: 220, pricePerLiter: 6.42, odometer: 184500, gasStation: 'Posto Graal', odometerPhotoId: odometer.id })
    await finish(driver.token, tripId, 184941)
    const maintenancePhoto = await uploadPhoto(driver.token)
    await call('post', '/maintenances', driver.token, { vehicleId: vehicle.id, type: 'urgent', service: 'Troca de mangueira', amount: 300, workshop: 'Oficina Norte', odometer: 184950, odometerPhotoId: maintenancePhoto.id })

    return { manager, fleet, vehicle, driver, tripId }
}

let data

beforeAll(async () => {
    data = await scenario()
})

describe('GET /metrics', () => {
    describe('errors', () => {
        test('Should reject drivers', async () => {
            const response = await call('get', '/metrics', data.driver.token)
            expect(response.status).toBe(403)
            expect(response.body.id).toBe('forbidden')
        })

        test('Should validate the period', async () => {
            for (const query of ['days=15', 'from=2026-01-01', 'from=2026-02-01&to=2026-01-01', 'from=2025-01-01&to=2026-06-01']) {
                const response = await call('get', `/metrics?${query}`, data.manager.token)
                expect(response.status).toBe(400)
                expect(response.body.id).toBe('invalid_schema')
            }
        })

        test("Should return 404 for another manager's fleet", async () => {
            const other = await createTestUser()
            const response = await call('get', `/metrics?fleetId=${data.fleet.id}`, other.token)
            expect(response.status).toBe(404)
            expect(response.body.id).toBe('fleet_not_found')
        })
    })

    describe('success', () => {
        test('Should compute spend, trips, km, cost per km and alerts', async () => {
            await ServiceReminder.create({ vehicleId: data.vehicle.id, title: 'Revisão', dueOdometer: 185750 })
            const old = await Expense.create({ driverId: data.driver.user.id, vehicleId: data.vehicle.id, category: 'food', amount: '100.00' })
            await Expense.sequelize.query('UPDATE expenses SET created_at = DATE_SUB(UTC_TIMESTAMP(), INTERVAL 40 DAY) WHERE id = ?', { replacements: [old.id] })

            const response = await call('get', `/metrics?days=30&fleetId=${data.fleet.id}`, data.manager.token)

            expect(response.status).toBe(200)
            expect(response.body.data.spend).toMatchObject({
                total: 1802.7,
                byCategory: { fuel: 1412.4, toll: 48.3, food: 42, tire_repair: 0, urgent_maintenance: 300 },
                previousTotal: 100,
                changePercent: 1702.7
            })
            expect(response.body.data).toMatchObject({ trips: 1, km: 639, costPerKm: 2.82 })
            expect(response.body.data.spendSeries).toHaveLength(6)
            expect(response.body.data.spendSeries.reduce((sum, bucket) => sum + bucket.total, 0)).toBeCloseTo(1802.7)
            expect(response.body.data.vehicles).toEqual([expect.objectContaining({ vehicle: expect.objectContaining({ id: data.vehicle.id }), total: 1802.7, km: 639, costPerKm: 2.82 })])
            expect(response.body.data.alerts).toEqual([expect.objectContaining({ title: 'Revisão', remainingKm: 800, vehicle: expect.objectContaining({ plate: data.vehicle.plate }) })])
        })

        test('Should be empty for a manager without fleets', async () => {
            const other = await createTestUser()
            const response = await call('get', '/metrics?days=7', other.token)
            expect(response.status).toBe(200)
            expect(response.body.data).toMatchObject({ spend: { total: 0, changePercent: null }, trips: 0, km: 0, costPerKm: null, vehicles: [], alerts: [] })
            expect(response.body.data.spendSeries).toHaveLength(2)
        })
    })
})

describe('GET /activity/trips', () => {
    describe('success', () => {
        test("Should list trips of the manager's fleets with the driver", async () => {
            const response = await call('get', '/activity/trips', data.manager.token)
            expect(response.status).toBe(200)
            expect(response.body.data).toEqual([expect.objectContaining({ id: data.tripId, distanceKm: 639, driver: { id: data.driver.user.id, name: data.driver.user.name } })])

            const other = await createTestUser()
            const empty = await call('get', '/activity/trips', other.token)
            expect(empty.body.data).toEqual([])
        })
    })
})

describe('GET /activity/trips/:id', () => {
    describe('errors', () => {
        test("Should return 404 for another manager's trip", async () => {
            const other = await createTestUser()
            const response = await call('get', `/activity/trips/${data.tripId}`, other.token)
            expect(response.status).toBe(404)
            expect(response.body.id).toBe('trip_not_found')
        })
    })

    describe('success', () => {
        test('Should return the trip with records and let the manager download its odometer photos', async () => {
            const response = await call('get', `/activity/trips/${data.tripId}`, data.manager.token)

            expect(response.status).toBe(200)
            expect(response.body.data).toMatchObject({ distanceKm: 639, summary: { totalExpenses: 1502.7, costPerKm: 2.35 }, driver: { name: data.driver.user.name } })
            expect(response.body.data.records).toHaveLength(3)

            const photo = await call('get', `/photos/${response.body.data.endPhotoId}`, data.manager.token)
            expect(photo.status).toBe(200)
            expect(photo.headers['content-type']).toBe('image/jpeg')

            const other = await createTestUser()
            const denied = await call('get', `/photos/${response.body.data.endPhotoId}`, other.token)
            expect(denied.status).toBe(404)
            expect(denied.body.id).toBe('photo_not_found')
        })
    })
})

describe('GET /activity/expenses', () => {
    describe('errors', () => {
        test('Should validate the category', async () => {
            const response = await call('get', '/activity/expenses?category=parking', data.manager.token)
            expect(response.status).toBe(400)
            expect(response.body.id).toBe('invalid_schema')
        })
    })

    describe('success', () => {
        test('Should list every record with totals and filter by category', async () => {
            const all = await call('get', '/activity/expenses', data.manager.token)
            expect(all.status).toBe(200)
            expect(all.body.data.total).toBe(1802.7)
            expect(all.body.data.items).toHaveLength(4)
            expect(all.body.data.items[0].driver).toEqual({ id: data.driver.user.id, name: data.driver.user.name })

            const fuel = await call('get', '/activity/expenses?category=fuel', data.manager.token)
            expect(fuel.body.data).toMatchObject({ total: 1412.4, items: [expect.objectContaining({ type: 'refueling', liters: 220 })] })
        })
    })
})

describe('GET /activity/maintenances', () => {
    describe('success', () => {
        test("Should list the fleets' maintenances", async () => {
            const response = await call('get', `/activity/maintenances?fleetId=${data.fleet.id}`, data.manager.token)
            expect(response.status).toBe(200)
            expect(response.body.data).toMatchObject({ total: 300, items: [expect.objectContaining({ maintenanceType: 'urgent', service: 'Troca de mangueira', odometer: 184950 })] })
        })

        test('Should not show records of a fleet from another manager', async () => {
            const other = await createTestUser()
            await createFleet(other.user.id)
            const response = await call('get', '/activity/maintenances', other.token)
            expect(response.body.data).toEqual({ total: 0, items: [] })
        })
    })
})
