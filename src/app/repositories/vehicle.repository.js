const { Op, fn, col } = require('sequelize')
const { Vehicle, User, Trip } = require('../database/models')
const utils = require('../utils')

class VehicleRepository {
    /**
     * @param {number[]} fleetIds
     * @param {object} options
     */
    async countByFleetIds(fleetIds, options = {}) {
        const rows = await Vehicle.findAll({
            attributes: ['fleetId', [fn('COUNT', col('id')), 'count']],
            where: { fleetId: { [Op.in]: fleetIds } },
            group: ['fleetId'],
            raw: true,
            ...options
        }).catch(utils.logError)
        if (rows === undefined) return utils.error(500, 'internal_server_error', 'Não foi possível contar os veículos.')

        return rows
    }

    /**
     * @param {number} fleetId
     * @param {object} options
     */
    async findByFleetId(fleetId, options = {}) {
        const vehicles = await Vehicle.findAll({
            where: { fleetId },
            include: [
                {
                    model: User,
                    as: 'assignedDrivers',
                    attributes: ['id', 'name'],
                    where: { role: 'driver' },
                    through: { attributes: [] },
                    required: false
                },
                {
                    model: Trip,
                    as: 'trips',
                    attributes: ['id'],
                    where: { status: 'in_progress' },
                    required: false,
                    include: [
                        {
                            model: User,
                            as: 'driver',
                            attributes: ['id', 'name']
                        }
                    ]
                }
            ],
            order: [['plate', 'ASC'], ['assignedDrivers', 'name', 'ASC']],
            ...options
        }).catch(utils.logError)
        if (vehicles === undefined) return utils.error(500, 'internal_server_error', 'Não foi possível consultar os veículos.')

        return vehicles
    }

    /**
     * @param {number} fleetId
     * @param {object} options
     */
    async findIdsByFleetId(fleetId, options = {}) {
        const vehicles = await Vehicle.findAll({
            attributes: ['id'],
            where: { fleetId },
            paranoid: false,
            order: [['id', 'ASC']],
            ...options
        }).catch(utils.logError)
        if (vehicles === undefined) return utils.error(500, 'internal_server_error', 'Não foi possível consultar os veículos.')

        return vehicles.map((vehicle) => vehicle.id)
    }
}

module.exports = new VehicleRepository()
