const { Op, fn, col } = require('sequelize')
const { Vehicle, User, Trip, Fleet } = require('../database/models')
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

    /**
     * @param {number} id
     * @param {number} managerId
     * @param {object} options
     */
    async findByIdAndManagerId(id, managerId, options = {}) {
        const vehicle = await Vehicle.findOne({
            where: { id },
            include: [
                {
                    model: Fleet,
                    as: 'fleet',
                    attributes: ['id', 'name', 'status'],
                    where: { managerId }
                }
            ],
            ...options
        }).catch(utils.logError)
        if (vehicle === undefined) return utils.error(500, 'internal_server_error', 'Não foi possível consultar o veículo.')
        if (!vehicle) return utils.error(404, 'vehicle_not_found', 'Veículo não encontrado.')

        return vehicle
    }

    /**
     * @param {number} id
     * @param {number} fleetId
     * @param {object} options
     */
    async findByIdAndFleetId(id, fleetId, options = {}) {
        const vehicle = await Vehicle.findOne({ where: { id, fleetId }, ...options }).catch(utils.logError)
        if (vehicle === undefined) return utils.error(500, 'internal_server_error', 'Não foi possível consultar o veículo.')
        if (!vehicle) return utils.error(404, 'vehicle_not_found', 'Veículo não encontrado.')

        return vehicle
    }

    /**
     * @param {object} data
     * @param {object} options
     */
    async create(data, options = {}) {
        return Vehicle.create(data, options)
            .then((vehicle) => vehicle.reload(options))
            .catch((error) => this.#writeError(error, 'Não foi possível cadastrar o veículo.'))
    }

    /**
     * @param {number} id
     * @param {object} data
     * @param {object} options
     */
    async update(id, data, options = {}) {
        const result = await Vehicle.update(data, { where: { id }, ...options }).catch((error) => this.#writeError(error, 'Não foi possível atualizar o veículo.'))
        if (result.error) return result

        return true
    }

    /**
     * @param {number[]} ids
     * @param {object} options
     */
    async destroy(ids, options = {}) {
        if (!ids.length) return true

        const result = await Vehicle.destroy({ where: { id: { [Op.in]: ids } }, ...options }).catch(utils.logError)
        if (result === undefined) return utils.error(500, 'internal_server_error', 'Não foi possível excluir o veículo.')

        return true
    }

    /**
     * @param {Error} error
     * @param {string} message
     */
    #writeError(error, message) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return utils.error(409, 'plate_already_exists', 'Esta placa já está cadastrada em outro veículo.')
        }

        utils.logError(error)

        return utils.error(500, 'internal_server_error', message)
    }
}

module.exports = new VehicleRepository()
