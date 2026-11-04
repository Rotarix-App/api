const { Op, fn, col } = require('sequelize')
const { VehicleAssignment, Vehicle, User } = require('../database/models')
const utils = require('../utils')

class VehicleAssignmentRepository {
    /**
     * @param {number[]} fleetIds
     * @param {object} options
     */
    async countDriversByFleetIds(fleetIds, options = {}) {
        const rows = await VehicleAssignment.findAll({
            attributes: [[col('vehicle.fleet_id'), 'fleetId'], [fn('COUNT', fn('DISTINCT', col('VehicleAssignment.driver_id'))), 'count']],
            include: [
                { model: Vehicle, as: 'vehicle', attributes: [], where: { fleetId: { [Op.in]: fleetIds } } },
                { model: User, as: 'driver', attributes: [], where: { role: 'driver' } }
            ],
            group: ['vehicle.fleet_id'],
            raw: true,
            ...options
        }).catch(utils.logError)
        if (rows === undefined) return utils.error(500, 'internal_server_error', 'Não foi possível contar os motoristas.')

        return rows
    }

    /**
     * @param {number[]} vehicleIds
     * @param {object} options
     */
    async deleteByVehicleIds(vehicleIds, options = {}) {
        if (!vehicleIds.length) return true

        const result = await VehicleAssignment.destroy({ where: { vehicleId: { [Op.in]: vehicleIds } }, ...options }).catch(utils.logError)
        if (result === undefined) return utils.error(500, 'internal_server_error', 'Não foi possível remover as atribuições dos veículos.')

        return true
    }

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
