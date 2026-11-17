const fs = require('fs')
const request = require('supertest')
const { Vehicle, Photo, Expense, OdometerReading, ServiceReminder, VehicleAssignment } = require('../../../app/database/models')
const storage = require('../../../app/utils/storage')
const { createTestUser } = require('../../utils/user.util')
const { createVehicle } = require('../../utils/fleet.util')
const { uploadPhoto, createAssignedDriver, startTrip } = require('../../utils/trip.util')

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
 * @param {object} overrides
 */
async function refuelingBody(token, overrides = {}) {
    const photo = await uploadPhoto(token)
    return { liters: 220, pricePerLiter: 6.42, odometer: 184500, gasStation: 'Posto Graal', odometerPhotoId: photo.id, ...overrides }
}

/**
 * @param {string} token
 * @param {object} overrides
 */
async function maintenanceBody(token, overrides = {}) {
    const photo = await uploadPhoto(token)
    return { type: 'preventive', service: 'Revisão dos 190 mil', amount: 1280, workshop: 'Oficina Diesel Norte', odometer: 190100, odometerPhotoId: photo.id, ...overrides }
}

describe('POST /expenses', () => {
    describe('errors', () => {
        test('Should reject managers', async () => {
            const response = await call('post', '/expenses', manager.token, { category: 'toll', amount: 10 })
            expect(response.status).toBe(403)
            expect(response.body.id).toBe('forbidden')
        })

        test('Should reject fuel as a plain expense', async () => {
            const { driver, vehicle } = await createAssignedDriver(manager.user.id)
            const response = await call('post', '/expenses', driver.token, { vehicleId: vehicle.id, category: 'fuel', amount: 100 })
            expect(response.status).toBe(400)
            expect(response.body.id).toBe('invalid_schema')
        })

        test('Should validate the amount', async () => {
            const { driver, vehicle } = await createAssignedDriver(manager.user.id)
            for (const amount of [0, -5, 10.123, '10']) {
                const response = await call('post', '/expenses', driver.token, { vehicleId: vehicle.id, category: 'toll', amount })
                expect(response.status).toBe(400)
                expect(response.body.id).toBe('invalid_schema')
            }
        })

        test('Should require the vehicle outside a trip', async () => {
            const { driver } = await createAssignedDriver(manager.user.id)
            const response = await call('post', '/expenses', driver.token, { category: 'toll', amount: 48.3 })
            expect(response.status).toBe(400)
            expect(response.body.id).toBe('vehicle_required')
        })

        test('Should return 404 for a vehicle not assigned to the driver', async () => {
            const { driver } = await createAssignedDriver(manager.user.id)
            const { vehicle } = await createAssignedDriver(manager.user.id)
            const response = await call('post', '/expenses', driver.token, { vehicleId: vehicle.id, category: 'toll', amount: 48.3 })
            expect(response.status).toBe(404)
            expect(response.body.id).toBe('vehicle_not_found')
        })

        test('Should reject an assigned vehicle on a trip with another driver', async () => {
            const { fleet, vehicle, driver } = await createAssignedDriver(manager.user.id)
            const { driver: other } = await createAssignedDriver(manager.user.id, { fleetRecord: fleet, vehicleRecord: vehicle })
            await startTrip(other.token, vehicle.id)

            const response = await call('post', '/expenses', driver.token, { vehicleId: vehicle.id, category: 'toll', amount: 48.3 })
            expect(response.status).toBe(409)
            expect(response.body.id).toBe('vehicle_on_trip')
        })

        test('Should reject an odometer photo as the receipt', async () => {
            const { driver, vehicle } = await createAssignedDriver(manager.user.id)
            const photo = await uploadPhoto(driver.token, 'odometer')
            const response = await call('post', '/expenses', driver.token, { vehicleId: vehicle.id, category: 'toll', amount: 48.3, receiptPhotoId: photo.id })
            expect(response.status).toBe(400)
            expect(response.body.id).toBe('invalid_photo_kind')
        })
    })

    describe('success', () => {
        test('Should record an expense on a chosen vehicle without a receipt', async () => {
            const { driver, vehicle } = await createAssignedDriver(manager.user.id)
            const response = await call('post', '/expenses', driver.token, { vehicleId: vehicle.id, category: 'food', amount: 42, description: '  Almoço em Uberaba ' })

            expect(response.status).toBe(201)
            expect(response.body.data).toMatchObject({
                type: 'expense', category: 'food', amount: 42, description: 'Almoço em Uberaba',
                receiptPhotoId: null, hasReceipt: false, trip: null, vehicle: { id: vehicle.id, plate: vehicle.plate }
            })
        })

        test('Should link to the trip in progress and ignore the vehicle sent', async () => {
            const { fleet, vehicle, driver } = await createAssignedDriver(manager.user.id)
            const other = await createVehicle(fleet.id)
            await VehicleAssignment.create({ driverId: driver.user.id, vehicleId: other.id })
            const trip = await startTrip(driver.token, vehicle.id)
            const receipt = await uploadPhoto(driver.token, 'receipt')

            const response = await call('post', '/expenses', driver.token, { vehicleId: other.id, category: 'toll', amount: 48.3, receiptPhotoId: receipt.id })

            expect(response.status).toBe(201)
            expect(response.body.data).toMatchObject({ vehicle: { id: vehicle.id }, trip: { id: trip.body.data.id }, hasReceipt: true })

            const detail = await call('get', `/trips/${trip.body.data.id}`, driver.token)
            expect(detail.body.data.summary.totalExpenses).toBe(48.3)
        })
    })
})

describe('GET/PUT/DELETE /expenses/:id', () => {
    describe('errors', () => {
        test("Should return 404 for another driver's expense", async () => {
            const { driver, vehicle } = await createAssignedDriver(manager.user.id)
            const { driver: other } = await createAssignedDriver(manager.user.id)
            const created = await call('post', '/expenses', driver.token, { vehicleId: vehicle.id, category: 'toll', amount: 10 })

            for (const [method, body] of [['get'], ['put', { category: 'toll', amount: 20 }], ['delete']]) {
                const response = await call(method, `/expenses/${created.body.data.id}`, other.token, body)
                expect(response.status).toBe(404)
                expect(response.body.id).toBe('expense_not_found')
            }
        })
    })

    describe('success', () => {
        test('Should edit, replace the receipt and delete the old one', async () => {
            const { driver, vehicle } = await createAssignedDriver(manager.user.id)
            const first = await uploadPhoto(driver.token, 'receipt')
            const created = await call('post', '/expenses', driver.token, { vehicleId: vehicle.id, category: 'toll', amount: 10, receiptPhotoId: first.id })
            const firstKey = (await Photo.findByPk(first.id)).storageKey
            const second = await uploadPhoto(driver.token, 'receipt')

            const response = await call('put', `/expenses/${created.body.data.id}`, driver.token, { category: 'tire_repair', amount: 150.5, description: 'Pneu furado', receiptPhotoId: second.id })

            expect(response.status).toBe(200)
            expect(response.body.data).toMatchObject({ category: 'tire_repair', amount: 150.5, description: 'Pneu furado', receiptPhotoId: second.id })
            expect(await Photo.findByPk(first.id)).toBeNull()
            expect(fs.existsSync(storage.path(firstKey))).toBe(false)
        })

        test('Should keep the receipt when it is omitted', async () => {
            const { driver, vehicle } = await createAssignedDriver(manager.user.id)
            const receipt = await uploadPhoto(driver.token, 'receipt')
            const created = await call('post', '/expenses', driver.token, { vehicleId: vehicle.id, category: 'toll', amount: 10, receiptPhotoId: receipt.id })

            const response = await call('put', `/expenses/${created.body.data.id}`, driver.token, { category: 'toll', amount: 12 })
            expect(response.status).toBe(200)
            expect(response.body.data.receiptPhotoId).toBe(receipt.id)
        })

        test('Should delete the expense with its receipt', async () => {
            const { driver, vehicle } = await createAssignedDriver(manager.user.id)
            const receipt = await uploadPhoto(driver.token, 'receipt')
            const created = await call('post', '/expenses', driver.token, { vehicleId: vehicle.id, category: 'toll', amount: 10, receiptPhotoId: receipt.id })
            const key = (await Photo.findByPk(receipt.id)).storageKey

            const response = await call('delete', `/expenses/${created.body.data.id}`, driver.token)
            expect(response.status).toBe(200)
            expect(await Expense.findByPk(created.body.data.id)).toBeNull()
            expect(await Photo.findByPk(receipt.id)).toBeNull()
            expect(fs.existsSync(storage.path(key))).toBe(false)
        })
    })
})

describe('POST /refuelings', () => {
    describe('errors', () => {
        test('Should require the odometer photo', async () => {
            const { driver, vehicle } = await createAssignedDriver(manager.user.id)
            const body = await refuelingBody(driver.token, { vehicleId: vehicle.id })
            delete body.odometerPhotoId

            const response = await call('post', '/refuelings', driver.token, body)
            expect(response.status).toBe(400)
            expect(response.body.id).toBe('invalid_schema')
        })

        test('Should reject an odometer below the last reading', async () => {
            const { driver, vehicle } = await createAssignedDriver(manager.user.id)
            const response = await call('post', '/refuelings', driver.token, await refuelingBody(driver.token, { vehicleId: vehicle.id, odometer: 100 }))
            expect(response.status).toBe(400)
            expect(response.body.id).toBe('odometer_below_last_reading')
            expect(await OdometerReading.count({ where: { vehicleId: vehicle.id, source: 'refueling' } })).toBe(0)
        })

        test('Should reject a photo already used', async () => {
            const { driver, vehicle } = await createAssignedDriver(manager.user.id)
            const body = await refuelingBody(driver.token, { vehicleId: vehicle.id })
            expect((await call('post', '/refuelings', driver.token, body)).status).toBe(201)

            const response = await call('post', '/refuelings', driver.token, { ...body, odometer: 184600 })
            expect(response.status).toBe(409)
            expect(response.body.id).toBe('photo_already_used')
        })
    })

    describe('success', () => {
        test('Should compute the total, record the reading and advance the odometer', async () => {
            const { driver, vehicle } = await createAssignedDriver(manager.user.id)
            const invoice = await uploadPhoto(driver.token, 'invoice')

            const response = await call('post', '/refuelings', driver.token, await refuelingBody(driver.token, { vehicleId: vehicle.id, invoicePhotoId: invoice.id }))

            expect(response.status).toBe(201)
            expect(response.body.data).toMatchObject({ type: 'refueling', category: 'fuel', amount: 1412.4, liters: 220, pricePerLiter: 6.42, odometer: 184500, gasStation: 'Posto Graal', hasReceipt: true })
            expect((await Vehicle.findByPk(vehicle.id)).currentOdometer).toBe(184500)

            const shown = await call('get', `/refuelings/${response.body.data.id}`, driver.token)
            expect(shown.status).toBe(200)
            expect(shown.body.data.odometerPhotoId).toBe(response.body.data.odometerPhotoId)
        })
    })
})

describe('POST /maintenances', () => {
    describe('errors', () => {
        test('Should validate the type', async () => {
            const { driver, vehicle } = await createAssignedDriver(manager.user.id)
            const response = await call('post', '/maintenances', driver.token, await maintenanceBody(driver.token, { vehicleId: vehicle.id, type: 'other' }))
            expect(response.status).toBe(400)
            expect(response.body.id).toBe('invalid_schema')
        })

        test("Should return 404 for another driver's maintenance", async () => {
            const { driver, vehicle } = await createAssignedDriver(manager.user.id)
            const other = await createTestUser('driver')
            const created = await call('post', '/maintenances', driver.token, await maintenanceBody(driver.token, { vehicleId: vehicle.id }))

            const response = await call('get', `/maintenances/${created.body.data.id}`, other.token)
            expect(response.status).toBe(404)
            expect(response.body.id).toBe('maintenance_not_found')
        })
    })

    describe('success', () => {
        test('Should complete the due reminder and schedule the next one', async () => {
            const { driver, vehicle } = await createAssignedDriver(manager.user.id)
            const due = await ServiceReminder.create({ vehicleId: vehicle.id, title: 'Revisão', dueOdometer: 190000, intervalKm: 10000 })
            const later = await ServiceReminder.create({ vehicleId: vehicle.id, title: 'Troca de óleo', dueOdometer: 195000 })

            const response = await call('post', '/maintenances', driver.token, await maintenanceBody(driver.token, { vehicleId: vehicle.id }))

            expect(response.status).toBe(201)
            expect(response.body.data).toMatchObject({ type: 'maintenance', category: 'urgent_maintenance', maintenanceType: 'preventive', amount: 1280, odometer: 190100 })
            await due.reload()
            await later.reload()
            expect(due.completedMaintenanceId).toBe(response.body.data.id)
            expect(later.completedAt).toBeNull()
            expect(await ServiceReminder.count({ where: { vehicleId: vehicle.id, title: 'Revisão', dueOdometer: 200100, completedAt: null } })).toBe(1)
        })

        test('Should not complete reminders with a corrective maintenance', async () => {
            const { driver, vehicle } = await createAssignedDriver(manager.user.id)
            const due = await ServiceReminder.create({ vehicleId: vehicle.id, title: 'Revisão', dueOdometer: 185000 })

            const response = await call('post', '/maintenances', driver.token, await maintenanceBody(driver.token, { vehicleId: vehicle.id, type: 'corrective' }))
            expect(response.status).toBe(201)
            await due.reload()
            expect(due.completedAt).toBeNull()
        })
    })
})

describe('GET /users/@me/spending', () => {
    describe('errors', () => {
        test('Should validate the month', async () => {
            const { driver } = await createAssignedDriver(manager.user.id)
            const response = await call('get', '/users/@me/spending?month=2026-13', driver.token)
            expect(response.status).toBe(400)
            expect(response.body.id).toBe('invalid_schema')
        })
    })

    describe('success', () => {
        test("Should total the month's records by category", async () => {
            const { driver, vehicle } = await createAssignedDriver(manager.user.id)
            await call('post', '/expenses', driver.token, { vehicleId: vehicle.id, category: 'toll', amount: 48.3 })
            await call('post', '/refuelings', driver.token, await refuelingBody(driver.token, { vehicleId: vehicle.id }))
            await call('post', '/maintenances', driver.token, await maintenanceBody(driver.token, { vehicleId: vehicle.id, type: 'urgent', amount: 300 }))
            const old = await Expense.create({ driverId: driver.user.id, vehicleId: vehicle.id, category: 'food', amount: '99.00' })
            await Expense.sequelize.query('UPDATE expenses SET created_at = ? WHERE id = ?', { replacements: [new Date('2026-01-15T15:00:00Z'), old.id] })

            const response = await call('get', '/users/@me/spending', driver.token)

            expect(response.status).toBe(200)
            expect(response.body.data).toMatchObject({
                total: 1760.7,
                byCategory: { fuel: 1412.4, toll: 48.3, food: 0, tire_repair: 0, urgent_maintenance: 300 }
            })
            expect(response.body.data.expenses).toHaveLength(1)
            expect(response.body.data.refuelings).toHaveLength(1)
            expect(response.body.data.maintenances).toHaveLength(1)

            const january = await call('get', '/users/@me/spending?month=2026-01', driver.token)
            expect(january.body.data).toMatchObject({ month: '2026-01', total: 99 })
        })
    })
})
