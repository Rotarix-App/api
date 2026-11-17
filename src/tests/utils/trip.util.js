const request = require('supertest')
const { User, VehicleAssignment } = require('../../app/database/models')
const { createTestUser } = require('./user.util')
const { createFleet, createVehicle } = require('./fleet.util')

const JPEG = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0xFF, 0xD9])
const PNG = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D])

/**
 * @param {string} token
 * @param {'odometer' | 'receipt' | 'invoice'} kind
 * @param {Buffer} buffer
 */
async function uploadPhoto(token, kind = 'odometer', buffer = JPEG) {
    const response = await request(global.app)
        .post('/photos')
        .set('Authorization', `Bearer ${token}`)
        .field('kind', kind)
        .attach('photo', buffer, 'odometer.jpg')

    return response.body.data
}

/**
 * @param {number} managerId
 * @param {{ fleet?: object, vehicle?: object, driver?: object, fleetRecord?: object, vehicleRecord?: object }} overrides
 */
async function createAssignedDriver(managerId, overrides = {}) {
    const fleet = overrides.fleetRecord || await createFleet(managerId, overrides.fleet)
    const vehicle = overrides.vehicleRecord || await createVehicle(fleet.id, { currentOdometer: 184302, ...overrides.vehicle })
    const driver = await createTestUser('driver', overrides.driver)
    await User.update({ managerId }, { where: { id: driver.user.id } })
    await VehicleAssignment.create({ driverId: driver.user.id, vehicleId: vehicle.id })

    return { fleet, vehicle, driver }
}

/**
 * @param {string} token
 * @param {number} vehicleId
 * @param {object} overrides
 */
async function startTrip(token, vehicleId, overrides = {}) {
    const odometerPhotoId = overrides.odometerPhotoId ?? (await uploadPhoto(token))?.id

    return request(global.app)
        .post('/trips')
        .set('Authorization', `Bearer ${token}`)
        .send({
            vehicleId,
            origin: 'Uberlândia, MG',
            destination: 'Santos, SP',
            startOdometer: 184302,
            ...overrides,
            odometerPhotoId
        })
}

module.exports = { JPEG, PNG, uploadPhoto, createAssignedDriver, startTrip }
