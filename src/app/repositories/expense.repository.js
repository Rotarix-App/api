const { Expense } = require('../database/models')
const utils = require('../utils')
const scope = require('./record-scope')

class ExpenseRepository {
    /**
     * @param {number} tripId
     * @param {object} options
     */
    async findByTripId(tripId, options = {}) {
        const expenses = await Expense.findAll({
            where: { tripId },
            order: [['createdAt', 'DESC'], ['id', 'DESC']],
            ...options
        }).catch(utils.logError)
        if (expenses === undefined) return utils.error(500, 'internal_server_error', 'Não foi possível consultar as despesas.')

        return expenses
    }

    /**
     * @param {number} id
     * @param {number} driverId
     * @param {object} options
     */
    async findByIdAndDriverId(id, driverId, options = {}) {
        const expense = await Expense.findOne({ where: { id, driverId }, include: [scope.vehicle(), scope.trip()], ...options }).catch(utils.logError)
        if (expense === undefined) return utils.error(500, 'internal_server_error', 'Não foi possível consultar a despesa.')
        if (!expense) return utils.error(404, 'expense_not_found', 'Despesa não encontrada.')

        return expense
    }

    /**
     * @param {{ driverId?: number, vehicleId?: number, from?: Date, to?: Date }} filters
     * @param {{ managerId?: number, fleetId?: number }} owner
     * @param {object} options
     */
    async findAll(filters, owner = {}, options = {}) {
        const include = [scope.vehicle(owner), scope.trip()]
        if (owner.managerId) include.push(scope.driver())

        const expenses = await Expense.findAll({ where: scope.where(filters), include, order: [['createdAt', 'DESC'], ['id', 'DESC']], ...options }).catch(utils.logError)
        if (expenses === undefined) return utils.error(500, 'internal_server_error', 'Não foi possível consultar as despesas.')

        return expenses
    }

    /**
     * @param {object} data
     * @param {object} options
     */
    async create(data, options = {}) {
        return Expense.create(data, options).catch((error) => this.#writeError(error, 'Não foi possível registrar a despesa.'))
    }

    /**
     * @param {number} id
     * @param {object} data
     * @param {object} options
     */
    async update(id, data, options = {}) {
        const result = await Expense.update(data, { where: { id }, ...options }).catch((error) => this.#writeError(error, 'Não foi possível atualizar a despesa.'))
        if (result.error) return result

        return true
    }

    /**
     * @param {number} id
     * @param {object} options
     */
    async destroy(id, options = {}) {
        const result = await Expense.destroy({ where: { id }, ...options }).catch(utils.logError)
        if (result === undefined) return utils.error(500, 'internal_server_error', 'Não foi possível excluir a despesa.')

        return true
    }

    /**
     * @param {Error} error
     * @param {string} message
     */
    #writeError(error, message) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return utils.error(409, 'photo_already_used', 'Esta foto já foi usada em outro registro. Tire uma nova foto.')
        }

        utils.logError(error)

        return utils.error(500, 'internal_server_error', message)
    }
}

module.exports = new ExpenseRepository()
