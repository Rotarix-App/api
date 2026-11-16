const { Op, fn, col, where } = require('sequelize')
const { User, Vehicle, Fleet, Trip } = require('../database/models')
const utils = require('../utils')

class DriverRepository {
    /**
     * @param {number} managerId
     * @param {object} filters
     * @param {object} options
     */
    async list(managerId, { search, status } = {}, options = {}) {
        const conditions = { role: 'driver', managerId }
        if (status && status !== 'all') conditions.status = status
        if (search) conditions[Op.or] = ['name', 'cnh_number'].map((field) => where(fn('LOCATE', search, col(`User.${field}`)), { [Op.gt]: 0 }))

        const drivers = await User.findAll({
            where: conditions,
            include: [
                { model: Vehicle, as: 'assignedVehicles', through: { attributes: [] }, include: [
                    { model: Fleet, as: 'fleet', attributes: ['id', 'name', 'status'], required: true },
                    { model: Trip, as: 'trips', attributes: ['id'], where: { status: 'in_progress' }, required: false }
                ] },
                { model: Trip, as: 'trips', attributes: ['id'], where: { status: 'in_progress' }, required: false }
            ],
            order: [['name', 'ASC'], ['id', 'ASC'], ['assignedVehicles', 'id', 'ASC']],
            ...options
        }).catch(utils.logError)
        if (drivers === undefined) return utils.error(500, 'internal_server_error', 'Não foi possível consultar os motoristas.')
        return drivers
    }

    /**
     * @param {object} conditions
     * @param {object} options
     */
    async find(conditions, options = {}) {
        const driver = await User.findOne({ where: { ...conditions, role: 'driver' }, ...options }).catch(utils.logError)
        if (driver === undefined) return utils.error(500, 'internal_server_error', 'Não foi possível consultar o motorista.')
        if (!driver) return utils.error(404, 'driver_not_found', 'Motorista não encontrado.')
        return driver
    }

    /**
     * @param {number} driverId
     * @param {object} options
     */
    async assignedVehicles(driverId, options = {}) {
        const vehicles = await Vehicle.findAll({
            attributes: ['id', 'plate', 'brand', 'model', 'status'],
            include: [
                { model: User, as: 'assignedDrivers', attributes: [], where: { id: driverId }, through: { attributes: [] } },
                { model: Fleet, as: 'fleet', attributes: ['id', 'name', 'status'], required: true },
                { model: Trip, as: 'trips', attributes: ['id'], where: { status: 'in_progress' }, required: false }
            ],
            order: [['id', 'ASC']],
            ...options
        }).catch(utils.logError)
        if (vehicles === undefined) return utils.error(500, 'internal_server_error', 'Não foi possível consultar as atribuições.')
        return vehicles
    }
}

module.exports = new DriverRepository()
