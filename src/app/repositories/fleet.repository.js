const { Op, fn, col, where } = require('sequelize')
const { Fleet } = require('../database/models')
const utils = require('../utils')

class FleetRepository {
    /**
     * @param {{ search?: string, status?: string, id?: number }} filters
     * @param {object} options
     */
    async findAll({ search, status, id } = {}, options = {}) {
        const conditions = {}
        if (id !== undefined) conditions.id = id
        if (status && status !== 'all') conditions.status = status
        if (search) conditions[Op.and] = where(fn('LOCATE', search, col('Fleet.name')), { [Op.gt]: 0 })

        const fleets = await Fleet.findAll({ where: conditions, order: [['name', 'ASC'], ['id', 'ASC']], ...options }).catch(utils.logError)
        if (fleets === undefined) return utils.error(500, 'internal_server_error', 'Não foi possível consultar as frotas.')

        return fleets
    }

    /**
     * @param {number} id
     * @param {object} options
     */
    async findById(id, options = {}) {
        const fleet = await Fleet.findByPk(id, options).catch(utils.logError)
        if (fleet === undefined) return utils.error(500, 'internal_server_error', 'Não foi possível consultar a frota.')
        if (!fleet) return utils.error(404, 'fleet_not_found', 'Frota não encontrada.')

        return fleet
    }

    /**
     * @param {object} data
     * @param {object} options
     */
    async create(data, options = {}) {
        const fleet = await Fleet.create(data, options).then(created => created.reload(options)).catch(utils.logError)
        if (!fleet) return utils.error(500, 'internal_server_error', 'Não foi possível criar a frota.')

        return fleet
    }

    /**
     * @param {number} id
     * @param {object} data
     * @param {object} options
     */
    async update(id, data, options = {}) {
        const result = await Fleet.update(data, { where: { id }, ...options }).catch(utils.logError)
        if (result === undefined) return utils.error(500, 'internal_server_error', 'Não foi possível atualizar a frota.')

        return true
    }

    /**
     * @param {number} id
     * @param {object} options
     */
    async destroy(id, options = {}) {
        const result = await Fleet.destroy({ where: { id }, ...options }).catch(utils.logError)
        if (result === undefined) return utils.error(500, 'internal_server_error', 'Não foi possível excluir a frota.')

        return true
    }
}

module.exports = new FleetRepository()
