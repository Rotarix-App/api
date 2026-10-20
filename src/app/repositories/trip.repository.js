const { Trip } = require('../database/models')
const utils = require('../utils')

class TripRepository {
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
