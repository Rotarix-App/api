const { Op } = require('sequelize')
const { Vehicle, Fleet, Trip, User, OdometerReading } = require('../database/models')
const UserHistory = require('../utils/user-history')

class RecordScope {
    /**
     * @param {{ managerId?: number, fleetId?: number }} owner
     */
    vehicle({ managerId, fleetId } = {}) {
        const vehicle = { model: Vehicle, as: 'vehicle', attributes: ['id', 'plate', 'brand', 'model', 'fleetId'], paranoid: false }
        if (!managerId) return vehicle

        const fleetWhere = { managerId }
        if (fleetId) fleetWhere.id = fleetId

        return { ...vehicle, required: true, include: [{ model: Fleet, as: 'fleet', attributes: [], where: fleetWhere, required: true }] }
    }

    trip() {
        return { model: Trip, as: 'trip', attributes: ['id', 'origin', 'destination', 'status'] }
    }

    driver() {
        return UserHistory.include(User)
    }

    reading() {
        return { model: OdometerReading, as: 'odometerReading', attributes: ['id', 'valueKm', 'photoId'] }
    }

    /**
     * @param {{ driverId?: number, vehicleId?: number, from?: Date, to?: Date }} filters
     */
    where({ driverId, vehicleId, from, to } = {}) {
        const conditions = {}
        if (driverId) conditions.driverId = driverId
        if (vehicleId) conditions.vehicleId = vehicleId
        if (from && to) conditions.createdAt = { [Op.gte]: from, [Op.lt]: to }

        return conditions
    }
}

module.exports = new RecordScope()
