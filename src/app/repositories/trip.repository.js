const { Op, fn, col } = require('sequelize')
const { Trip, Vehicle, User, OdometerReading, Fleet } = require('../database/models')
const utils = require('../utils')
const UserHistory = require('../utils/user-history')

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
     * @param {number} vehicleId
     * @param {object} options
     */
    async findInProgressByVehicleId(vehicleId, options = {}) {
        const trip = await Trip.findOne({
            attributes: ['id', 'startedAt'],
            where: { vehicleId, status: 'in_progress' },
            include: [
                UserHistory.include(User)
            ],
            ...options
        }).catch(utils.logError)
        if (trip === undefined) return utils.error(500, 'internal_server_error', 'Não foi possível consultar as viagens.')

        return trip
    }

    /**
     * @param {number[]} vehicleIds
     * @param {object} options
     */
    async countInProgressByVehicleIds(vehicleIds, options = {}) {
        if (!vehicleIds.length) return 0

        const count = await Trip.count({ where: { vehicleId: { [Op.in]: vehicleIds }, status: 'in_progress' }, ...options }).catch(utils.logError)
        if (count === undefined) return utils.error(500, 'internal_server_error', 'Não foi possível consultar as viagens.')

        return count
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

    /**
     * @param {object} conditions
     * @param {object} options
     */
    async findDetailed(conditions, options = {}) {
        const trip = await Trip.findOne({ where: conditions, include: this.#detailIncludes(), ...options }).catch(utils.logError)
        if (trip === undefined) return utils.error(500, 'internal_server_error', 'Não foi possível consultar a viagem.')
        if (!trip) return utils.error(404, 'trip_not_found', 'Viagem não encontrada.')

        return trip
    }

    /**
     * @param {number} driverId
     * @param {'all' | 'in_progress' | 'finished'} status
     * @param {object} options
     */
    async findAllByDriverId(driverId, status, options = {}) {
        const conditions = { driverId }
        if (status !== 'all') conditions.status = status

        const trips = await Trip.findAll({
            where: conditions,
            include: this.#detailIncludes(),
            order: [['startedAt', 'DESC'], ['id', 'DESC']],
            ...options
        }).catch(utils.logError)
        if (trips === undefined) return utils.error(500, 'internal_server_error', 'Não foi possível consultar as viagens.')

        return trips
    }

    /**
     * @param {number} id
     * @param {number} managerId
     * @param {object} options
     */
    async findDetailedForManager(id, managerId, options = {}) {
        const trip = await Trip.findOne({ where: { id }, include: this.#managerIncludes({ managerId }), ...options }).catch(utils.logError)
        if (trip === undefined) return utils.error(500, 'internal_server_error', 'Não foi possível consultar a viagem.')
        if (!trip) return utils.error(404, 'trip_not_found', 'Viagem não encontrada.')

        return trip
    }

    /**
     * @param {{ managerId: number, fleetId?: number, field: 'startedAt' | 'endedAt', from: Date, to: Date, status?: string }} filters
     * @param {object} options
     */
    async findAllForManager({ managerId, fleetId, field, from, to, status }, options = {}) {
        const conditions = { [field]: { [Op.gte]: from, [Op.lt]: to } }
        if (status) conditions.status = status

        const trips = await Trip.findAll({
            where: conditions,
            include: this.#managerIncludes({ managerId, fleetId }),
            order: [[field, 'DESC'], ['id', 'DESC']],
            ...options
        }).catch(utils.logError)
        if (trips === undefined) return utils.error(500, 'internal_server_error', 'Não foi possível consultar as viagens.')

        return trips
    }

    /**
     * @param {number} driverId
     * @param {number} vehicleId
     * @param {number} limit
     * @param {object} options
     */
    async findRecentByDriverAndVehicle(driverId, vehicleId, limit, options = {}) {
        const trips = await Trip.findAll({
            where: { driverId, vehicleId },
            include: this.#detailIncludes(),
            order: [['startedAt', 'DESC'], ['id', 'DESC']],
            limit,
            ...options
        }).catch(utils.logError)
        if (trips === undefined) return utils.error(500, 'internal_server_error', 'Não foi possível consultar as viagens.')

        return trips
    }

    /**
     * @param {number} id
     * @param {number} driverId
     * @param {object} options
     */
    async findByIdAndDriverId(id, driverId, options = {}) {
        const trip = await Trip.findOne({ where: { id, driverId }, ...options }).catch(utils.logError)
        if (trip === undefined) return utils.error(500, 'internal_server_error', 'Não foi possível consultar a viagem.')
        if (!trip) return utils.error(404, 'trip_not_found', 'Viagem não encontrada.')

        return trip
    }

    /**
     * @param {object} data
     * @param {object} options
     */
    async create(data, options = {}) {
        return Trip.create(data, options).catch((error) => this.#writeError(error, 'Não foi possível iniciar a viagem.'))
    }

    /**
     * @param {number} id
     * @param {object} data
     * @param {object} options
     */
    async update(id, data, options = {}) {
        const result = await Trip.update(data, { where: { id }, ...options }).catch((error) => this.#writeError(error, 'Não foi possível atualizar a viagem.'))
        if (result.error) return result

        return true
    }

    /**
     * @param {{ managerId: number, fleetId?: number }} owner
     */
    #managerIncludes({ managerId, fleetId }) {
        const fleetWhere = { managerId }
        if (fleetId) fleetWhere.id = fleetId

        return [
            {
                model: Vehicle,
                as: 'vehicle',
                attributes: ['id', 'plate', 'brand', 'model'],
                paranoid: false,
                required: true,
                include: [{ model: Fleet, as: 'fleet', attributes: [], where: fleetWhere, required: true }]
            },
            { model: OdometerReading, as: 'startReading', attributes: ['id', 'valueKm', 'photoId'] },
            { model: OdometerReading, as: 'endReading', attributes: ['id', 'valueKm', 'photoId'] },
            UserHistory.include(User)
        ]
    }

    #detailIncludes() {
        return [
            { model: Vehicle, as: 'vehicle', attributes: ['id', 'plate', 'brand', 'model'], paranoid: false },
            { model: OdometerReading, as: 'startReading', attributes: ['id', 'valueKm', 'photoId'] },
            { model: OdometerReading, as: 'endReading', attributes: ['id', 'valueKm', 'photoId'] }
        ]
    }

    /**
     * @param {Error} error
     * @param {string} message
     */
    #writeError(error, message) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            const fields = Object.keys(error.fields || {}).join(' ')
            if (fields.includes('active_driver')) return utils.error(409, 'driver_has_trip_in_progress', 'Você já tem uma viagem em andamento. Finalize-a antes de iniciar outra.')
            if (fields.includes('active_vehicle')) return utils.error(409, 'vehicle_on_trip', 'Este veículo já está em viagem.')
            return utils.error(409, 'photo_already_used', 'Esta foto já foi usada em outro registro. Tire uma nova foto do odômetro.')
        }

        utils.logError(error)

        return utils.error(500, 'internal_server_error', message)
    }
}

module.exports = new TripRepository()
