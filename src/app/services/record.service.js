const connection = require('../database')
const DriverRepository = require('../repositories/driver.repository')
const VehicleRepository = require('../repositories/vehicle.repository')
const OdometerReadingRepository = require('../repositories/odometer-reading.repository')
const TripRepository = require('../repositories/trip.repository')
const ExpenseRepository = require('../repositories/expense.repository')
const RefuelingRepository = require('../repositories/refueling.repository')
const MaintenanceRepository = require('../repositories/maintenance.repository')
const ServiceReminderRepository = require('../repositories/service-reminder.repository')
const AuthService = require('./auth.service')
const PhotoService = require('./photo.service')
const utils = require('../utils')
const records = require('../utils/records')
const period = require('../utils/period')
const UserHistory = require('../utils/user-history')

const KM_FORMAT = new Intl.NumberFormat('pt-BR')

class RecordService {
    /**
     * @param {number} driverId
     * @param {{ vehicleId?: number, category: string, amount: number, description: string | null, receiptPhotoId?: number | null }} data
     */
    async createExpense(driverId, { vehicleId, category, amount, description, receiptPhotoId }) {
        const photos = receiptPhotoId ? [[receiptPhotoId, 'receipt']] : []

        return this.#write(driverId, vehicleId, photos, async ({ vehicle, tripId }, transaction) => {
            const expense = await ExpenseRepository.create({
                driverId,
                vehicleId: vehicle.id,
                tripId,
                category,
                amount,
                description,
                receiptPhotoId: receiptPhotoId ?? null
            }, { transaction })
            if (expense.error) return expense

            return this.findExpense(expense.id, driverId, { transaction })
        })
    }

    /**
     * @param {number} id
     * @param {number} driverId
     * @param {{ category: string, amount: number, description: string | null, receiptPhotoId?: number | null }} data
     */
    async updateExpense(id, driverId, { category, amount, description, receiptPhotoId }) {
        let removedKey = null

        const result = await this.#transaction(async (transaction) => {
            const expense = await ExpenseRepository.findByIdAndDriverId(id, driverId, { transaction, lock: true, include: [] })
            if (expense.error) return expense

            const changes = { category, amount, description }
            const replacing = receiptPhotoId !== undefined && receiptPhotoId !== expense.receiptPhotoId
            if (replacing && receiptPhotoId !== null) {
                const photo = await PhotoService.checkUnused(receiptPhotoId, driverId, 'receipt', { transaction })
                if (photo.error) return photo
            }
            if (replacing) changes.receiptPhotoId = receiptPhotoId

            const updated = await ExpenseRepository.update(id, changes, { transaction })
            if (updated.error) return updated

            if (replacing && expense.receiptPhotoId) {
                const removed = await this.#removePhoto(expense.receiptPhotoId, transaction)
                if (removed.error) return removed
                removedKey = removed
            }

            return this.findExpense(id, driverId, { transaction })
        })

        if (!result.error && removedKey) await PhotoService.removeFile(removedKey)
        return result
    }

    /**
     * @param {number} id
     * @param {number} driverId
     */
    async deleteExpense(id, driverId) {
        let removedKey = null

        const result = await this.#transaction(async (transaction) => {
            const expense = await ExpenseRepository.findByIdAndDriverId(id, driverId, { transaction, lock: true, include: [] })
            if (expense.error) return expense

            const destroyed = await ExpenseRepository.destroy(id, { transaction })
            if (destroyed.error) return destroyed

            if (expense.receiptPhotoId) {
                const removed = await this.#removePhoto(expense.receiptPhotoId, transaction)
                if (removed.error) return removed
                removedKey = removed
            }

            return true
        })

        if (!result.error && removedKey) await PhotoService.removeFile(removedKey)
        return result
    }

    /**
     * @param {number} id
     * @param {number} driverId
     * @param {object} options
     */
    async findExpense(id, driverId, options = {}) {
        const expense = await ExpenseRepository.findByIdAndDriverId(id, driverId, options)
        if (expense.error) return expense

        return records.expense(expense)
    }

    /**
     * @param {number} driverId
     * @param {{ vehicleId?: number, liters: number, pricePerLiter: number, odometer: number, gasStation: string, odometerPhotoId: number, invoicePhotoId?: number | null }} data
     */
    async createRefueling(driverId, { vehicleId, liters, pricePerLiter, odometer, gasStation, odometerPhotoId, invoicePhotoId }) {
        const photos = [[odometerPhotoId, 'odometer'], ...(invoicePhotoId ? [[invoicePhotoId, 'invoice']] : [])]

        return this.#write(driverId, vehicleId, photos, async ({ vehicle, tripId }, transaction) => {
            const reading = await this.#recordOdometer(vehicle, driverId, odometer, 'refueling', odometerPhotoId, transaction)
            if (reading.error) return reading

            const totalCents = Math.round(Math.round(liters * 100) * Math.round(pricePerLiter * 1000) / 1000)
            const refueling = await RefuelingRepository.create({
                driverId,
                vehicleId: vehicle.id,
                tripId,
                odometerReadingId: reading.id,
                liters,
                pricePerLiter,
                totalAmount: (totalCents / 100).toFixed(2),
                gasStation,
                invoicePhotoId: invoicePhotoId ?? null
            }, { transaction })
            if (refueling.error) return refueling

            return this.findRefueling(refueling.id, driverId, { transaction })
        })
    }

    /**
     * @param {number} id
     * @param {number} driverId
     * @param {object} options
     */
    async findRefueling(id, driverId, options = {}) {
        const refueling = await RefuelingRepository.findByIdAndDriverId(id, driverId, options)
        if (refueling.error) return refueling

        return records.refueling(refueling)
    }

    /**
     * @param {number} driverId
     * @param {{ vehicleId?: number, type: string, service: string, amount: number, workshop: string, odometer: number, odometerPhotoId: number, invoicePhotoId?: number | null }} data
     */
    async createMaintenance(driverId, { vehicleId, type, service, amount, workshop, odometer, odometerPhotoId, invoicePhotoId }) {
        const photos = [[odometerPhotoId, 'odometer'], ...(invoicePhotoId ? [[invoicePhotoId, 'invoice']] : [])]

        return this.#write(driverId, vehicleId, photos, async ({ vehicle, tripId }, transaction) => {
            const reading = await this.#recordOdometer(vehicle, driverId, odometer, 'maintenance', odometerPhotoId, transaction)
            if (reading.error) return reading

            const maintenance = await MaintenanceRepository.create({
                driverId,
                vehicleId: vehicle.id,
                tripId,
                odometerReadingId: reading.id,
                type,
                service,
                amount,
                workshop,
                invoicePhotoId: invoicePhotoId ?? null
            }, { transaction })
            if (maintenance.error) return maintenance

            if (type === 'preventive') {
                const completed = await this.#completeReminder(vehicle.id, maintenance.id, odometer, transaction)
                if (completed.error) return completed
            }

            return this.findMaintenance(maintenance.id, driverId, { transaction })
        })
    }

    /**
     * @param {number} id
     * @param {number} driverId
     * @param {object} options
     */
    async findMaintenance(id, driverId, options = {}) {
        const maintenance = await MaintenanceRepository.findByIdAndDriverId(id, driverId, options)
        if (maintenance.error) return maintenance

        return records.maintenance(maintenance)
    }

    /**
     * @param {number} driverId
     * @param {string | undefined} month
     */
    async monthlySpending(driverId, month) {
        const range = period.month(month)
        const filters = { driverId, from: range.from, to: range.to }

        const expenses = await ExpenseRepository.findAll(filters)
        if (expenses.error) return expenses
        const refuelings = await RefuelingRepository.findAll(filters)
        if (refuelings.error) return refuelings
        const maintenances = await MaintenanceRepository.findAll(filters)
        if (maintenances.error) return maintenances

        const presented = {
            expenses: expenses.map((expense) => records.expense(expense)),
            refuelings: refuelings.map((refueling) => records.refueling(refueling)),
            maintenances: maintenances.map((maintenance) => records.maintenance(maintenance))
        }

        return {
            month: range.month,
            ...records.totals([...presented.expenses, ...presented.refuelings, ...presented.maintenances]),
            ...presented
        }
    }

    /**
     * @param {number} driverId
     * @param {number | undefined} vehicleId
     * @param {[number, string][]} photos
     * @param {function} action
     */
    async #write(driverId, vehicleId, photos, action) {
        const context = await this.#context(driverId, vehicleId)
        if (context.error) return context

        return this.#transaction(async (transaction) => {
            const driver = await DriverRepository.find({ id: driverId }, { transaction, lock: true })
            if (driver.error) return driver

            const inactive = AuthService.checkActive(driver)
            if (inactive) return inactive

            const vehicle = await VehicleRepository.findById(context.vehicleId, { transaction, lock: true })
            if (vehicle.error) return vehicle

            for (const [photoId, kind] of photos) {
                const photo = await PhotoService.checkUnused(photoId, driverId, kind, { transaction })
                if (photo.error) return photo
            }

            const trip = await TripRepository.findInProgressByDriverId(driverId, { transaction })
            if (trip?.error) return trip
            if ((trip?.id ?? null) !== context.tripId) {
                return utils.error(409, 'trip_state_changed', 'Sua viagem mudou enquanto o registro era salvo. Tente novamente.')
            }

            if (!trip) {
                const assigned = await VehicleRepository.findAssignedToDriver(vehicle.id, driverId, { transaction })
                if (assigned.error) return assigned

                const vehicleTrip = await TripRepository.findInProgressByVehicleId(vehicle.id, { transaction })
                if (vehicleTrip?.error) return vehicleTrip
                if (vehicleTrip) return utils.error(409, 'vehicle_on_trip', `Este veículo está em viagem com ${UserHistory.present(vehicleTrip.driver).name}.`)
            }

            return action({ vehicle, tripId: context.tripId }, transaction)
        })
    }

    /**
     * @param {number} driverId
     * @param {number | undefined} vehicleId
     */
    async #context(driverId, vehicleId) {
        const trip = await TripRepository.findInProgressByDriverId(driverId)
        if (trip?.error) return trip
        if (trip) return { vehicleId: trip.vehicleId, tripId: trip.id }

        if (!vehicleId) return utils.error(400, 'vehicle_required', 'Escolha o veículo do registro.')

        const vehicle = await VehicleRepository.findAssignedToDriver(vehicleId, driverId)
        if (vehicle.error) return vehicle

        return { vehicleId: vehicle.id, tripId: null }
    }

    /**
     * @param {object} vehicle
     * @param {number} driverId
     * @param {number} odometer
     * @param {'refueling' | 'maintenance'} source
     * @param {number} photoId
     * @param {import('sequelize').Transaction} transaction
     */
    async #recordOdometer(vehicle, driverId, odometer, source, photoId, transaction) {
        if (odometer < vehicle.currentOdometer) {
            return utils.error(400, 'odometer_below_last_reading', `Não pode ser menor que a última leitura: ${KM_FORMAT.format(vehicle.currentOdometer)} km.`)
        }

        const reading = await OdometerReadingRepository.create({ vehicleId: vehicle.id, recordedBy: driverId, valueKm: odometer, source, photoId }, { transaction })
        if (reading.error) return reading

        const updated = await VehicleRepository.update(vehicle.id, { currentOdometer: odometer }, { transaction })
        if (updated.error) return updated

        return reading
    }

    /**
     * @param {number} vehicleId
     * @param {number} maintenanceId
     * @param {number} odometer
     * @param {import('sequelize').Transaction} transaction
     */
    async #completeReminder(vehicleId, maintenanceId, odometer, transaction) {
        const pending = await ServiceReminderRepository.findPendingByVehicleIds([vehicleId], { transaction })
        if (pending.error) return pending

        const due = pending.find((reminder) => reminder.dueOdometer <= odometer)
        if (!due) return true

        const updated = await ServiceReminderRepository.update(due.id, { completedMaintenanceId: maintenanceId, completedAt: new Date() }, { transaction })
        if (updated.error) return updated

        if (due.intervalKm) {
            const next = await ServiceReminderRepository.create({ vehicleId, title: due.title, dueOdometer: odometer + due.intervalKm, intervalKm: due.intervalKm }, { transaction })
            if (next.error) return next
        }

        return true
    }

    /**
     * @param {number} photoId
     * @param {import('sequelize').Transaction} transaction
     */
    async #removePhoto(photoId, transaction) {
        const storageKey = await PhotoService.findStorageKey(photoId, { transaction })
        if (storageKey.error) return storageKey

        const destroyed = await PhotoService.destroy(photoId, { transaction })
        if (destroyed.error) return destroyed

        return storageKey
    }

    /**
     * @param {function} action
     */
    async #transaction(action) {
        const transaction = await connection.transaction().catch(utils.logError)
        if (!transaction) return utils.error(500, 'internal_server_error', 'Não foi possível salvar o registro.')

        try {
            const result = await action(transaction)
            if (result.error) {
                await transaction.rollback()
                return result
            }

            await transaction.commit()
            return result
        } catch (err) {
            utils.logError(err)
            if (!transaction.finished) await transaction.rollback().catch(utils.logError)
            return utils.error(500, 'internal_server_error', 'Não foi possível salvar o registro.')
        }
    }
}

module.exports = new RecordService()
