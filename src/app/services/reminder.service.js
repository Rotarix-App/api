const VehicleRepository = require('../repositories/vehicle.repository')
const ServiceReminderRepository = require('../repositories/service-reminder.repository')
const utils = require('../utils')

class ReminderService {
    /**
     * @param {number} vehicleId
     * @param {number} managerId
     */
    async list(vehicleId, managerId) {
        const vehicle = await VehicleRepository.findByIdAndManagerId(vehicleId, managerId)
        if (vehicle.error) return vehicle

        const reminders = await ServiceReminderRepository.findAllByVehicleId(vehicleId)
        if (reminders.error) return reminders

        return reminders.map((reminder) => this.present(reminder, vehicle.currentOdometer))
    }

    /**
     * @param {number} vehicleId
     * @param {number} managerId
     * @param {{ title: string, dueOdometer: number, intervalKm: number | null }} data
     */
    async create(vehicleId, managerId, { title, dueOdometer, intervalKm }) {
        const vehicle = await VehicleRepository.findByIdAndManagerId(vehicleId, managerId)
        if (vehicle.error) return vehicle

        const reminder = await ServiceReminderRepository.create({ vehicleId, title, dueOdometer, intervalKm })
        if (reminder.error) return reminder

        return this.present(reminder, vehicle.currentOdometer)
    }

    /**
     * @param {number} vehicleId
     * @param {number} id
     * @param {number} managerId
     * @param {{ title: string, dueOdometer: number, intervalKm: number | null }} data
     */
    async update(vehicleId, id, managerId, { title, dueOdometer, intervalKm }) {
        const found = await this.#find(vehicleId, id, managerId)
        if (found.error) return found

        if (found.reminder.completedAt) return utils.error(409, 'reminder_completed', 'Este lembrete já foi concluído por uma manutenção.')

        const updated = await ServiceReminderRepository.update(id, { title, dueOdometer, intervalKm })
        if (updated.error) return updated

        const reminder = await ServiceReminderRepository.findByIdAndVehicleId(id, vehicleId)
        if (reminder.error) return reminder

        return this.present(reminder, found.vehicle.currentOdometer)
    }

    /**
     * @param {number} vehicleId
     * @param {number} id
     * @param {number} managerId
     */
    async destroy(vehicleId, id, managerId) {
        const found = await this.#find(vehicleId, id, managerId)
        if (found.error) return found

        return ServiceReminderRepository.destroy(id)
    }

    /**
     * @param {{ id: number, currentOdometer: number }[]} vehicles
     */
    async nextAlerts(vehicles) {
        const reminders = await ServiceReminderRepository.findPendingByVehicleIds(vehicles.map((vehicle) => vehicle.id))
        if (reminders.error) return reminders

        const alerts = new Map()
        for (const vehicle of vehicles) {
            const pending = reminders.filter((reminder) => reminder.vehicleId === vehicle.id)
            alerts.set(vehicle.id, pending.map((reminder) => this.present(reminder, vehicle.currentOdometer)))
        }

        return alerts
    }

    /**
     * @param {object} reminder
     * @param {number} currentOdometer
     */
    present(reminder, currentOdometer) {
        return {
            id: reminder.id,
            title: reminder.title,
            dueOdometer: reminder.dueOdometer,
            intervalKm: reminder.intervalKm,
            remainingKm: reminder.completedAt ? null : reminder.dueOdometer - currentOdometer,
            overdue: !reminder.completedAt && reminder.dueOdometer <= currentOdometer,
            completedAt: reminder.completedAt,
            completedMaintenanceId: reminder.completedMaintenanceId
        }
    }

    /**
     * @param {number} vehicleId
     * @param {number} id
     * @param {number} managerId
     */
    async #find(vehicleId, id, managerId) {
        const vehicle = await VehicleRepository.findByIdAndManagerId(vehicleId, managerId)
        if (vehicle.error) return vehicle

        const reminder = await ServiceReminderRepository.findByIdAndVehicleId(id, vehicleId)
        if (reminder.error) return reminder

        return { vehicle, reminder }
    }
}

module.exports = new ReminderService()
