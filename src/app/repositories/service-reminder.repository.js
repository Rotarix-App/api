const { Op } = require('sequelize')
const { ServiceReminder, Vehicle, Fleet } = require('../database/models')
const utils = require('../utils')

class ServiceReminderRepository {
    /**
     * @param {number[]} vehicleIds
     * @param {object} options
     */
    async findPendingByVehicleIds(vehicleIds, options = {}) {
        if (!vehicleIds.length) return []

        const reminders = await ServiceReminder.findAll({
            where: { vehicleId: { [Op.in]: vehicleIds }, completedAt: null },
            order: [['dueOdometer', 'ASC'], ['id', 'ASC']],
            ...options
        }).catch(utils.logError)
        if (reminders === undefined) return utils.error(500, 'internal_server_error', 'Não foi possível consultar os lembretes de revisão.')

        return reminders
    }

    /**
     * @param {{ managerId: number, fleetId?: number }} owner
     * @param {object} options
     */
    async findPendingByManager({ managerId, fleetId }, options = {}) {
        const fleetWhere = { managerId }
        if (fleetId) fleetWhere.id = fleetId

        const reminders = await ServiceReminder.findAll({
            where: { completedAt: null },
            include: [{
                model: Vehicle,
                as: 'vehicle',
                attributes: ['id', 'plate', 'brand', 'model', 'currentOdometer'],
                required: true,
                include: [{ model: Fleet, as: 'fleet', attributes: [], where: fleetWhere, required: true }]
            }],
            order: [['dueOdometer', 'ASC'], ['id', 'ASC']],
            ...options
        }).catch(utils.logError)
        if (reminders === undefined) return utils.error(500, 'internal_server_error', 'Não foi possível consultar os lembretes de revisão.')

        return reminders
    }

    /**
     * @param {number} vehicleId
     * @param {object} options
     */
    async findAllByVehicleId(vehicleId, options = {}) {
        const reminders = await ServiceReminder.findAll({
            where: { vehicleId },
            order: [['completedAt', 'ASC'], ['dueOdometer', 'ASC'], ['id', 'ASC']],
            ...options
        }).catch(utils.logError)
        if (reminders === undefined) return utils.error(500, 'internal_server_error', 'Não foi possível consultar os lembretes de revisão.')

        return reminders
    }

    /**
     * @param {number} id
     * @param {number} vehicleId
     * @param {object} options
     */
    async findByIdAndVehicleId(id, vehicleId, options = {}) {
        const reminder = await ServiceReminder.findOne({ where: { id, vehicleId }, ...options }).catch(utils.logError)
        if (reminder === undefined) return utils.error(500, 'internal_server_error', 'Não foi possível consultar o lembrete de revisão.')
        if (!reminder) return utils.error(404, 'reminder_not_found', 'Lembrete de revisão não encontrado.')

        return reminder
    }

    /**
     * @param {object} data
     * @param {object} options
     */
    async create(data, options = {}) {
        const reminder = await ServiceReminder.create(data, options).then((created) => created.reload(options)).catch(utils.logError)
        if (!reminder) return utils.error(500, 'internal_server_error', 'Não foi possível salvar o lembrete de revisão.')

        return reminder
    }

    /**
     * @param {number} id
     * @param {object} data
     * @param {object} options
     */
    async update(id, data, options = {}) {
        const result = await ServiceReminder.update(data, { where: { id }, ...options }).catch(utils.logError)
        if (result === undefined) return utils.error(500, 'internal_server_error', 'Não foi possível atualizar o lembrete de revisão.')

        return true
    }

    /**
     * @param {number} id
     * @param {object} options
     */
    async destroy(id, options = {}) {
        const result = await ServiceReminder.destroy({ where: { id }, ...options }).catch(utils.logError)
        if (result === undefined) return utils.error(500, 'internal_server_error', 'Não foi possível excluir o lembrete de revisão.')

        return true
    }
}

module.exports = new ServiceReminderRepository()
