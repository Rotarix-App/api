const { VehicleAssignment } = require('../database/models')
const utils = require('../utils')

class VehicleAssignmentRepository {
    /**
     * @param {number} driverId
     * @param {{ transaction?: import('sequelize').Transaction }} options
     */
    async deleteByDriverId(driverId, options = {}) {
        const result = await VehicleAssignment.destroy({ where: { driverId }, ...options }).catch(utils.logError)
        if (result === undefined) return utils.error(500, 'internal_server_error', 'Não foi possível remover as atribuições do motorista.')

        return true
    }
}

module.exports = new VehicleAssignmentRepository()
