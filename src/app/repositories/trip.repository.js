const { Op, fn, col } = require('sequelize')
const { Trip, Vehicle } = require('../database/models')
const utils = require('../utils')

class TripRepository {
    /**
     * @param {number[]} fleetIds
     * @param {object} options
     */
    async countInProgressByFleetIds(fleetIds, options = {}) {
        const rows = await Trip.findAll({
            attributes: [[col('vehicle.fleet_id'), 'fleetId'], [fn('COUNT', fn('DISTINCT', col('Trip.vehicle_id'))), 'count']],
            where: { status: 'in_progress' },
            include: [{ model: Vehicle, as: 'vehicle', attributes: [], where: { fleetId: { [Op.in]: fleetIds } } }],
            group: ['vehicle.fleet_id'],
            raw: true,
            ...options
        }).catch(utils.logError)
        if (rows === undefined) return utils.error(500, 'internal_server_error', 'Não foi possível contar as viagens em andamento.')

        return rows
    }

    /**
     * @param {number} driverId
     * @param {{ transaction?: import('sequelize').Transaction }} options
     */
    async findInProgressByDriverId(driverId, options = {}) {
        const trip = await Trip.findOne({ where: { driverId, status: 'in_progress' }, ...options }).catch(utils.logError)
        if (trip === undefined) return utils.error(500, 'internal_server_error', 'Não foi possível consultar as viagens.')

        return trip
    }
}

module.exports = new TripRepository()
