const { Refueling } = require('../database/models')
const utils = require('../utils')
const scope = require('./record-scope')

class RefuelingRepository {
    /**
     * @param {number} tripId
     * @param {object} options
     */
    async findByTripId(tripId, options = {}) {
        const refuelings = await Refueling.findAll({
            where: { tripId },
            order: [['createdAt', 'DESC'], ['id', 'DESC']],
            ...options
        }).catch(utils.logError)
        if (refuelings === undefined) return utils.error(500, 'internal_server_error', 'Não foi possível consultar os abastecimentos.')

        return refuelings
    }

    /**
     * @param {number} id
     * @param {number} driverId
     * @param {object} options
     */
    async findByIdAndDriverId(id, driverId, options = {}) {
        const refueling = await Refueling.findOne({ where: { id, driverId }, include: [scope.vehicle(), scope.trip(), scope.reading()], ...options }).catch(utils.logError)
        if (refueling === undefined) return utils.error(500, 'internal_server_error', 'Não foi possível consultar o abastecimento.')
        if (!refueling) return utils.error(404, 'refueling_not_found', 'Abastecimento não encontrado.')

        return refueling
    }

    /**
     * @param {{ driverId?: number, vehicleId?: number, from?: Date, to?: Date }} filters
     * @param {{ managerId?: number, fleetId?: number }} owner
     * @param {object} options
     */
    async findAll(filters, owner = {}, options = {}) {
        const include = [scope.vehicle(owner), scope.trip(), scope.reading()]
        if (owner.managerId) include.push(scope.driver())

        const refuelings = await Refueling.findAll({ where: scope.where(filters), include, order: [['createdAt', 'DESC'], ['id', 'DESC']], ...options }).catch(utils.logError)
        if (refuelings === undefined) return utils.error(500, 'internal_server_error', 'Não foi possível consultar os abastecimentos.')

        return refuelings
    }

    /**
     * @param {object} data
     * @param {object} options
     */
    async create(data, options = {}) {
        return Refueling.create(data, options).catch((error) => {
            if (error.name === 'SequelizeUniqueConstraintError') {
                return utils.error(409, 'photo_already_used', 'Esta foto já foi usada em outro registro. Tire uma nova foto.')
            }

            utils.logError(error)

            return utils.error(500, 'internal_server_error', 'Não foi possível registrar o abastecimento.')
        })
    }
}

module.exports = new RefuelingRepository()
