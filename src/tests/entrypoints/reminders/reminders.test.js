const request = require('supertest')
const { ServiceReminder } = require('../../../app/database/models')
const { createTestUser } = require('../../utils/user.util')
const { createFleet, createVehicle } = require('../../utils/fleet.util')

let manager
let otherManager
let driver

beforeAll(async () => {
    manager = await createTestUser()
    otherManager = await createTestUser()
    driver = await createTestUser('driver')
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

async function vehicle() {
    const fleet = await createFleet(manager.user.id)
    return createVehicle(fleet.id, { currentOdometer: 184302 })
}

describe('POST /vehicles/:id/reminders', () => {
    describe('errors', () => {
        test('Should reject drivers', async () => {
            const response = await call('post', '/vehicles/1/reminders', driver.token, { title: 'Revisão', dueOdometer: 1 })
            expect(response.status).toBe(403)
            expect(response.body.id).toBe('forbidden')
        })

        test('Should validate the body', async () => {
            const { id } = await vehicle()
            const response = await call('post', `/vehicles/${id}/reminders`, manager.token, { title: ' ', dueOdometer: -1, intervalKm: 0 })
            expect(response.status).toBe(400)
            expect(response.body.id).toBe('invalid_schema')
        })

        test("Should return 404 for another manager's vehicle", async () => {
            const { id } = await vehicle()
            const response = await call('post', `/vehicles/${id}/reminders`, otherManager.token, { title: 'Revisão', dueOdometer: 190000 })
            expect(response.status).toBe(404)
            expect(response.body.id).toBe('vehicle_not_found')
        })
    })

    describe('success', () => {
        test('Should create a reminder with the remaining km', async () => {
            const { id } = await vehicle()
            const response = await call('post', `/vehicles/${id}/reminders`, manager.token, { title: 'Revisão', dueOdometer: 185102, intervalKm: 10000 })

            expect(response.status).toBe(201)
            expect(response.body.data).toMatchObject({ title: 'Revisão', dueOdometer: 185102, intervalKm: 10000, remainingKm: 800, overdue: false, completedAt: null })

            const detail = await call('get', `/vehicles/${id}`, manager.token)
            expect(detail.body.data.serviceAlerts).toEqual([expect.objectContaining({ title: 'Revisão', remainingKm: 800 })])
        })
    })
})

describe('GET/PUT/DELETE /vehicles/:id/reminders', () => {
    describe('errors', () => {
        test('Should not edit a completed reminder', async () => {
            const { id } = await vehicle()
            const reminder = await ServiceReminder.create({ vehicleId: id, title: 'Revisão', dueOdometer: 180000, completedAt: new Date() })

            const response = await call('put', `/vehicles/${id}/reminders/${reminder.id}`, manager.token, { title: 'Revisão', dueOdometer: 190000 })
            expect(response.status).toBe(409)
            expect(response.body.id).toBe('reminder_completed')
        })

        test('Should return 404 for a reminder of another vehicle', async () => {
            const first = await vehicle()
            const second = await vehicle()
            const reminder = await ServiceReminder.create({ vehicleId: second.id, title: 'Revisão', dueOdometer: 190000 })

            const response = await call('delete', `/vehicles/${first.id}/reminders/${reminder.id}`, manager.token)
            expect(response.status).toBe(404)
            expect(response.body.id).toBe('reminder_not_found')
        })
    })

    describe('success', () => {
        test('Should list, edit and delete reminders', async () => {
            const { id } = await vehicle()
            const created = await call('post', `/vehicles/${id}/reminders`, manager.token, { title: 'Troca de óleo', dueOdometer: 183882 })

            const list = await call('get', `/vehicles/${id}/reminders`, manager.token)
            expect(list.status).toBe(200)
            expect(list.body.data).toEqual([expect.objectContaining({ remainingKm: -420, overdue: true })])

            const edited = await call('put', `/vehicles/${id}/reminders/${created.body.data.id}`, manager.token, { title: 'Troca de óleo', dueOdometer: 194302, intervalKm: null })
            expect(edited.status).toBe(200)
            expect(edited.body.data).toMatchObject({ dueOdometer: 194302, remainingKm: 10000, overdue: false })

            const deleted = await call('delete', `/vehicles/${id}/reminders/${created.body.data.id}`, manager.token)
            expect(deleted.status).toBe(200)
            expect(await ServiceReminder.findByPk(created.body.data.id)).toBeNull()
        })
    })
})
