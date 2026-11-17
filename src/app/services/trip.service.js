const connection = require('../database')
const DriverRepository = require('../repositories/driver.repository')
const FleetRepository = require('../repositories/fleet.repository')
const VehicleRepository = require('../repositories/vehicle.repository')
const OdometerReadingRepository = require('../repositories/odometer-reading.repository')
const TripRepository = require('../repositories/trip.repository')
const ExpenseRepository = require('../repositories/expense.repository')
const RefuelingRepository = require('../repositories/refueling.repository')
const AuthService = require('./auth.service')
const PhotoService = require('./photo.service')
const utils = require('../utils')
const UserHistory = require('../utils/user-history')

const KM_FORMAT = new Intl.NumberFormat('pt-BR')

class TripService {
    /**
     * @param {number} driverId
     * @param {{ vehicleId: number, origin: string, destination: string, startOdometer: number, odometerPhotoId: number }} data
     */
    async start(driverId, { vehicleId, origin, destination, startOdometer, odometerPhotoId }) {
        const assigned = await VehicleRepository.findAssignedToDriver(vehicleId, driverId)
        if (assigned.error) return assigned

        return this.#transaction(async (transaction) => {
            const driver = await DriverRepository.find({ id: driverId }, { transaction, lock: true })
            if (driver.error) return driver

            const inactive = AuthService.checkActive(driver)
            if (inactive) return inactive

            const fleet = await FleetRepository.findById(assigned.fleetId, { transaction, lock: true })
            if (fleet.error) return fleet.httpStatus === 404 ? utils.error(404, 'vehicle_not_found', 'Veículo não encontrado.') : fleet

            const vehicle = await VehicleRepository.findByIdAndFleetId(vehicleId, fleet.id, { transaction, lock: true })
            if (vehicle.error) return vehicle

            const photo = await PhotoService.checkUnusedOdometerPhoto(odometerPhotoId, driverId, { transaction, lock: true })
            if (photo.error) return photo

            const stillAssigned = await VehicleRepository.findAssignedToDriver(vehicleId, driverId, { transaction })
            if (stillAssigned.error) return stillAssigned

            const driverTrip = await TripRepository.findInProgressByDriverId(driverId, { transaction })
            if (driverTrip?.error) return driverTrip
            if (driverTrip) return utils.error(409, 'driver_has_trip_in_progress', 'Você já tem uma viagem em andamento. Finalize-a antes de iniciar outra.')

            const vehicleTrip = await TripRepository.findInProgressByVehicleId(vehicleId, { transaction })
            if (vehicleTrip?.error) return vehicleTrip
            if (vehicleTrip) return utils.error(409, 'vehicle_on_trip', `Este veículo está em viagem com ${UserHistory.present(vehicleTrip.driver).name}.`)

            if (vehicle.status !== 'active' || fleet.status !== 'active') {
                return utils.error(409, 'vehicle_unavailable', 'Este veículo está indisponível no momento. Fale com o gestor da frota.')
            }

            if (startOdometer < vehicle.currentOdometer) return this.#odometerError(vehicle.currentOdometer)

            const reading = await OdometerReadingRepository.create({
                vehicleId,
                recordedBy: driverId,
                valueKm: startOdometer,
                source: 'trip_start',
                photoId: photo.id
            }, { transaction })
            if (reading.error) return reading

            const odometer = await VehicleRepository.update(vehicleId, { currentOdometer: startOdometer }, { transaction })
            if (odometer.error) return odometer

            const trip = await TripRepository.create({
                driverId,
                vehicleId,
                origin,
                destination,
                startReadingId: reading.id,
                startedAt: new Date()
            }, { transaction })
            if (trip.error) return trip

            return this.#detail({ id: trip.id, driverId }, { transaction })
        })
    }

    /**
     * @param {number} id
     * @param {number} driverId
     * @param {{ endOdometer: number, odometerPhotoId: number, notes: string | null }} data
     */
    async finish(id, driverId, { endOdometer, odometerPhotoId, notes }) {
        return this.#write(id, driverId, async ({ trip, vehicle }, transaction) => {
            const photo = await PhotoService.checkUnusedOdometerPhoto(odometerPhotoId, driverId, { transaction, lock: true })
            if (photo.error) return photo

            if (endOdometer < vehicle.currentOdometer) return this.#odometerError(vehicle.currentOdometer)

            const reading = await OdometerReadingRepository.create({
                vehicleId: vehicle.id,
                recordedBy: driverId,
                valueKm: endOdometer,
                source: 'trip_end',
                photoId: photo.id
            }, { transaction })
            if (reading.error) return reading

            const odometer = await VehicleRepository.update(vehicle.id, { currentOdometer: endOdometer }, { transaction })
            if (odometer.error) return odometer

            const updated = await TripRepository.update(trip.id, {
                status: 'finished',
                endReadingId: reading.id,
                notes,
                endedAt: new Date()
            }, { transaction })
            if (updated.error) return updated

            return this.#detail({ id: trip.id, driverId }, { transaction })
        })
    }

    /**
     * @param {number} id
     * @param {number} driverId
     */
    async cancel(id, driverId) {
        return this.#write(id, driverId, async ({ trip }, transaction) => {
            const updated = await TripRepository.update(trip.id, { status: 'cancelled', endedAt: new Date() }, { transaction })
            if (updated.error) return updated

            return this.#detail({ id: trip.id, driverId }, { transaction })
        })
    }

    /**
     * @param {number} driverId
     * @param {'all' | 'in_progress' | 'finished'} status
     */
    async list(driverId, status) {
        const trips = await TripRepository.findAllByDriverId(driverId, status)
        if (trips.error) return trips

        return trips.map((trip) => this.#present(trip))
    }

    /**
     * @param {number} driverId
     */
    async findCurrent(driverId) {
        const trip = await TripRepository.findInProgressByDriverId(driverId)
        if (trip?.error) return trip
        if (!trip) return null

        return this.#detail({ id: trip.id, driverId })
    }

    /**
     * @param {number} id
     * @param {number} driverId
     */
    async findById(id, driverId) {
        return this.#detail({ id, driverId })
    }

    /**
     * @param {number} id
     * @param {number} driverId
     * @param {function} action
     */
    async #write(id, driverId, action) {
        const current = await TripRepository.findByIdAndDriverId(id, driverId)
        if (current.error) return current

        return this.#transaction(async (transaction) => {
            const vehicle = await VehicleRepository.findById(current.vehicleId, { transaction, lock: true, paranoid: false })
            if (vehicle.error) return vehicle

            const trip = await TripRepository.findByIdAndDriverId(id, driverId, { transaction, lock: true })
            if (trip.error) return trip
            if (trip.status !== 'in_progress') return utils.error(409, 'trip_not_in_progress', 'Esta viagem já foi encerrada.')

            return action({ trip, vehicle }, transaction)
        })
    }

    /**
     * @param {function} action
     */
    async #transaction(action) {
        const transaction = await connection.transaction().catch(utils.logError)
        if (!transaction) return utils.error(500, 'internal_server_error', 'Não foi possível salvar a viagem.')

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
            return utils.error(500, 'internal_server_error', 'Não foi possível salvar a viagem.')
        }
    }

    /**
     * @param {{ id: number, driverId: number }} conditions
     * @param {object} options
     */
    async #detail(conditions, options = {}) {
        const trip = await TripRepository.findDetailed(conditions, options)
        if (trip.error) return trip

        const expenses = await ExpenseRepository.findByTripId(trip.id, options)
        if (expenses.error) return expenses
        const refuelings = await RefuelingRepository.findByTripId(trip.id, options)
        if (refuelings.error) return refuelings

        const records = [
            ...expenses.map((expense) => ({
                type: 'expense',
                id: expense.id,
                category: expense.category,
                amount: this.#money(expense.amount),
                description: expense.description,
                liters: null,
                hasReceipt: expense.receiptPhotoId !== null,
                createdAt: expense.createdAt
            })),
            ...refuelings.map((refueling) => ({
                type: 'refueling',
                id: refueling.id,
                category: 'fuel',
                amount: this.#money(refueling.totalAmount),
                description: refueling.gasStation,
                liters: Number(refueling.liters),
                hasReceipt: refueling.invoicePhotoId !== null,
                createdAt: refueling.createdAt
            }))
        ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

        const presented = this.#present(trip)
        const totalCents = records.reduce((sum, record) => sum + Math.round(record.amount * 100), 0)

        return {
            ...presented,
            records,
            summary: {
                totalExpenses: totalCents / 100,
                costPerKm: presented.distanceKm ? Math.round(totalCents / presented.distanceKm) / 100 : null,
                receiptCount: records.filter((record) => record.hasReceipt).length,
                odometerPhotoCount: [trip.startReading?.photoId, trip.endReading?.photoId].filter(Boolean).length
            }
        }
    }

    /**
     * @param {object} trip
     */
    #present(trip) {
        const startOdometer = trip.startReading?.valueKm ?? null
        const endOdometer = trip.endReading?.valueKm ?? null
        const endedAt = trip.endedAt ? new Date(trip.endedAt) : new Date()

        return {
            id: trip.id,
            status: trip.status,
            origin: trip.origin,
            destination: trip.destination,
            vehicle: { id: trip.vehicle.id, plate: trip.vehicle.plate, brand: trip.vehicle.brand, model: trip.vehicle.model },
            startOdometer,
            endOdometer,
            distanceKm: endOdometer === null ? null : endOdometer - startOdometer,
            durationMinutes: Math.max(0, Math.floor((endedAt - new Date(trip.startedAt)) / 60000)),
            notes: trip.notes,
            startPhotoId: trip.startReading?.photoId ?? null,
            endPhotoId: trip.endReading?.photoId ?? null,
            startedAt: trip.startedAt,
            endedAt: trip.endedAt
        }
    }

    /**
     * @param {string | number} value
     */
    #money(value) {
        return Math.round(Number(value) * 100) / 100
    }

    /**
     * @param {number} lastReading
     */
    #odometerError(lastReading) {
        return utils.error(400, 'odometer_below_last_reading', `Não pode ser menor que a última leitura: ${KM_FORMAT.format(lastReading)} km.`)
    }
}

module.exports = new TripService()
