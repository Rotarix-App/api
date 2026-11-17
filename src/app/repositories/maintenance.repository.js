const { Maintenance } = require('../database/models')
const utils = require('../utils')
const scope = require('./record-scope')

class MaintenanceRepository {
    /**
     * @param {number} tripId
     * @param {object} options
     */
    async findByTripId(tripId, options = {}) {
        const maintenances = await Maintenance.findAll({
            where: { tripId },
            order: [['createdAt', 'DESC'], ['id', 'DESC']],
            ...options
        }).catch(utils.logError)
        if (maintenances === undefined) return utils.error(500, 'internal_server_error', 'Não foi possível consultar as manutenções.')

        return maintenances
    }

    /**
     * @param {number} id
     * @param {number} driverId
     * @param {object} options
     */
    async findByIdAndDriverId(id, driverId, options = {}) {
        const maintenance = await Maintenance.findOne({ where: { id, driverId }, include: [scope.vehicle(), scope.trip(), scope.reading()], ...options }).catch(utils.logError)
        if (maintenance === undefined) return utils.error(500, 'internal_server_error', 'Não foi possível consultar a manutenção.')
        if (!maintenance) return utils.error(404, 'maintenance_not_found', 'Manutenção não encontrada.')

        return maintenance
    }

    /**
     * @param {{ driverId?: number, vehicleId?: number, from?: Date, to?: Date }} filters
     * @param {{ managerId?: number, fleetId?: number }} owner
     * @param {object} options
     */
    async findAll(filters, owner = {}, options = {}) {
        const include = [scope.vehicle(owner), scope.trip(), scope.reading()]
        if (owner.managerId) include.push(scope.driver())

        const maintenances = await Maintenance.findAll({ where: scope.where(filters), include, order: [['createdAt', 'DESC'], ['id', 'DESC']], ...options }).catch(utils.logError)
        if (maintenances === undefined) return utils.error(500, 'internal_server_error', 'Não foi possível consultar as manutenções.')

        return maintenances
    }

    /**
     * @param {object} data
     * @param {object} options
     */
    async create(data, options = {}) {
        return Maintenance.create(data, options).catch((error) => {
            if (error.name === 'SequelizeUniqueConstraintError') {
                return utils.error(409, 'photo_already_used', 'Esta foto já foi usada em outro registro. Tire uma nova foto.')
            }

            utils.logError(error)

            return utils.error(500, 'internal_server_error', 'Não foi possível registrar a manutenção.')
        })
    }
}

module.exports = new MaintenanceRepository()
