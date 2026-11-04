const { randomUUID } = require('crypto')
const { Fleet, Vehicle, VehicleAssignment, OdometerReading, Trip } = require('../../app/database/models')
const { createTestUser } = require('./user.util')

/**
 * @param {number} managerId
 * @param {object} overrides
 */
async function createFleet(managerId, overrides = {}) {
    return Fleet.create({ managerId, name: `Fleet ${randomUUID()}`, baseRegion: 'Uberlândia, MG', ...overrides })
}

/**
 * @param {number} fleetId
 * @param {object} overrides
 */
async function createVehicle(fleetId, overrides = {}) {
    return Vehicle.create({
        fleetId, plate: randomUUID().replace(/-/g, '').slice(0, 7).toUpperCase(), brand: 'Scania', model: 'R450', year: 2022,
        ...overrides
    })
}

/**
 * @param {number} managerId
 * @param {object} overrides
 */
async function createLinkedFleet(managerId, overrides = {}) {
    const fleet = await createFleet(managerId, overrides)
    const vehicle = await createVehicle(fleet.id)
    const { user: driver } = await createTestUser('driver')
    await VehicleAssignment.create({ driverId: driver.id, vehicleId: vehicle.id })
    const reading = await OdometerReading.create({ vehicleId: vehicle.id, recordedBy: driver.id, valueKm: 0, source: 'trip_start' })
    const trip = await Trip.create({
        driverId: driver.id, vehicleId: vehicle.id, origin: 'Uberlândia', destination: 'Santos',
        startReadingId: reading.id, startedAt: new Date()
    })

    return { fleet, vehicle, driver, trip, reading }
}

module.exports = { createFleet, createVehicle, createLinkedFleet }
