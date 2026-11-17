const { Refueling } = require('../database/models')
const utils = require('../utils')

class RefuelingRepository {
    /**
     * @param {number} tripId
     * @param {object} options
     */
    async findByTripId(tripId, options = {}) {
        const refuelings = await Refueling.findAll({
            attributes: ['id', 'liters', 'totalAmount', 'gasStation', 'invoicePhotoId', 'createdAt'],
            where: { tripId },
            order: [['createdAt', 'DESC'], ['id', 'DESC']],
            ...options
        }).catch(utils.logError)
        if (refuelings === undefined) return utils.error(500, 'internal_server_error', 'Não foi possível consultar os abastecimentos.')

        return refuelings
    }
}

module.exports = new RefuelingRepository()
