const { Expense } = require('../database/models')
const utils = require('../utils')

class ExpenseRepository {
    /**
     * @param {number} tripId
     * @param {object} options
     */
    async findByTripId(tripId, options = {}) {
        const expenses = await Expense.findAll({
            attributes: ['id', 'category', 'amount', 'description', 'receiptPhotoId', 'createdAt'],
            where: { tripId },
            order: [['createdAt', 'DESC'], ['id', 'DESC']],
            ...options
        }).catch(utils.logError)
        if (expenses === undefined) return utils.error(500, 'internal_server_error', 'Não foi possível consultar as despesas.')

        return expenses
    }
}

module.exports = new ExpenseRepository()
