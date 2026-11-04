const connection = require('../database')
const FleetRepository = require('../repositories/fleet.repository')
const VehicleRepository = require('../repositories/vehicle.repository')
const VehicleAssignmentRepository = require('../repositories/vehicle-assignment.repository')
const OdometerReadingRepository = require('../repositories/odometer-reading.repository')
const TripRepository = require('../repositories/trip.repository')
const UserRepository = require('../repositories/user.repository')
const utils = require('../utils')

const TIME_FORMAT = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' })
const KM_FORMAT = new Intl.NumberFormat('pt-BR')

class VehicleService {
    /**
     * @param {number} managerId
     * @param {{ plate: string, brand: string, model: string, year: number, currentOdometer: number, fleetId: number }} data
     */
    async create(managerId, { plate, brand, model, year, currentOdometer, fleetId }) {
        return this.#transaction(async (transaction) => {
            const fleet = await FleetRepository.findByIdAndManagerId(fleetId, managerId, { transaction, lock: true })
            if (fleet.error) return fleet

            const vehicle = await VehicleRepository.create({ fleetId, plate, brand, model, year, currentOdometer, status: 'active' }, { transaction })
            if (vehicle.error) return vehicle

            const reading = await OdometerReadingRepository.create({
                vehicleId: vehicle.id,
                recordedBy: managerId,
                valueKm: currentOdometer,
                source: 'manual'
            }, { transaction })
            if (reading.error) return reading

            return this.#present(vehicle, fleet, null)
        })
    }

    /**
     * @param {number} id
     * @param {number} managerId
     */
    async findById(id, managerId) {
        const vehicle = await VehicleRepository.findByIdAndManagerId(id, managerId)
        if (vehicle.error) return vehicle

        const lastReading = await OdometerReadingRepository.findLastByVehicleId(id)
        if (lastReading?.error) return lastReading
        const trip = await TripRepository.findInProgressByVehicleId(id)
        if (trip?.error) return trip
        const drivers = await UserRepository.findDriversByVehicleId(id)
        if (drivers.error) return drivers

        return {
            ...this.#present(vehicle, vehicle.fleet, trip),
            lastReading: lastReading
                ? {
                    valueKm: lastReading.valueKm,
                    source: lastReading.source,
                    recordedAt: lastReading.createdAt,
                    hasPhoto: lastReading.photoId !== null
                }
                : null,
            trip: trip
                ? {
                    id: trip.id,
                    startedAt: trip.startedAt,
                    driver: { id: trip.driver.id, name: trip.driver.name }
                }
                : null,
            assignedDrivers: drivers.map((driver) => ({
                id: driver.id,
                name: driver.name,
                cnhCategory: driver.cnhCategory,
                tripStatus: driver.trips.length ? 'in_progress' : 'free'
            }))
        }
    }

    /**
     * @param {number} id
     * @param {number} managerId
     * @param {{ plate: string, brand: string, model: string, year: number, currentOdometer: number, fleetId: number }} data
     */
    async update(id, managerId, { plate, brand, model, year, currentOdometer, fleetId }) {
        return this.#write(id, managerId, [fleetId], async ({ vehicle, trip }, transaction) => {
            const fleetChanged = fleetId !== vehicle.fleetId
            if (fleetChanged && trip) return this.#onTripError(trip, 'trocá-lo de frota')

            if (currentOdometer < vehicle.currentOdometer) {
                return utils.error(400, 'odometer_below_last_reading', `Não pode ser menor que a última leitura: ${KM_FORMAT.format(vehicle.currentOdometer)} km.`)
            }

            const odometerChanged = currentOdometer > vehicle.currentOdometer
            if (odometerChanged && trip) return this.#onTripError(trip, 'alterar o odômetro')

            const updated = await VehicleRepository.update(id, { plate, brand, model, year, currentOdometer, fleetId }, { transaction })
            if (updated.error) return updated

            if (odometerChanged) {
                const reading = await OdometerReadingRepository.create({
                    vehicleId: id,
                    recordedBy: managerId,
                    valueKm: currentOdometer,
                    source: 'manual'
                }, { transaction })
                if (reading.error) return reading
            }

            if (fleetChanged) {
                const assignments = await VehicleAssignmentRepository.deleteByVehicleIds([id], { transaction })
                if (assignments.error) return assignments
            }

            return this.#reload(id, managerId, trip, transaction)
        })
    }

    /**
     * @param {number} id
     * @param {number} managerId
     * @param {'active' | 'inactive'} status
     */
    async changeStatus(id, managerId, status) {
        return this.#write(id, managerId, [], async ({ trip }, transaction) => {
            if (status === 'inactive' && trip) return this.#onTripError(trip, 'desativá-lo')

            const updated = await VehicleRepository.update(id, { status }, { transaction })
            if (updated.error) return updated

            return this.#reload(id, managerId, trip, transaction)
        })
    }

    /**
     * @param {number} id
     * @param {number} managerId
     * @param {string} confirmationPlate
     */
    async destroy(id, managerId, confirmationPlate) {
        return this.#write(id, managerId, [], async ({ vehicle, trip }, transaction) => {
            if (confirmationPlate !== vehicle.plate) {
                return utils.error(400, 'plate_confirmation_mismatch', 'A placa informada não confere com a placa do veículo.')
            }

            if (trip) return this.#onTripError(trip, 'excluí-lo')

            const assignments = await VehicleAssignmentRepository.deleteByVehicleIds([id], { transaction })
            if (assignments.error) return assignments

            return VehicleRepository.destroy([id], { transaction })
        })
    }

    /**
     * @param {number} id
     * @param {number} managerId
     * @param {number[]} otherFleetIds
     * @param {function} action
     */
    async #write(id, managerId, otherFleetIds, action) {
        const current = await VehicleRepository.findByIdAndManagerId(id, managerId)
        if (current.error) return current

        return this.#transaction(async (transaction) => {
            const fleetIds = [...new Set([current.fleetId, ...otherFleetIds])].sort((a, b) => a - b)
            for (const fleetId of fleetIds) {
                const fleet = await FleetRepository.findByIdAndManagerId(fleetId, managerId, { transaction, lock: true })
                if (fleet.error && fleet.httpStatus === 404 && fleetId === current.fleetId) {
                    return utils.error(404, 'vehicle_not_found', 'Veículo não encontrado.')
                }
                if (fleet.error) return fleet
            }

            const vehicle = await VehicleRepository.findByIdAndFleetId(id, current.fleetId, { transaction, lock: true })
            if (vehicle.error) return vehicle

            const trip = await TripRepository.findInProgressByVehicleId(id, { transaction })
            if (trip?.error) return trip

            return action({ vehicle, trip }, transaction)
        })
    }

    /**
     * @param {function} action
     */
    async #transaction(action) {
        const transaction = await connection.transaction().catch(utils.logError)
        if (!transaction) return utils.error(500, 'internal_server_error', 'Não foi possível alterar o veículo.')

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
            return utils.error(500, 'internal_server_error', 'Não foi possível alterar o veículo.')
        }
    }

    /**
     * @param {number} id
     * @param {number} managerId
     * @param {object | null} trip
     * @param {import('sequelize').Transaction} transaction
     */
    async #reload(id, managerId, trip, transaction) {
        const vehicle = await VehicleRepository.findByIdAndManagerId(id, managerId, { transaction })
        if (vehicle.error) return vehicle

        return this.#present(vehicle, vehicle.fleet, trip)
    }

    /**
     * @param {object} vehicle
     * @param {{ id: number, name: string, status: string }} fleet
     * @param {object | null} trip
     */
    #present(vehicle, fleet, trip) {
        return {
            id: vehicle.id,
            plate: vehicle.plate,
            brand: vehicle.brand,
            model: vehicle.model,
            year: vehicle.year,
            currentOdometer: vehicle.currentOdometer,
            status: vehicle.status,
            fleet: { id: fleet.id, name: fleet.name, status: fleet.status },
            available: vehicle.status === 'active' && fleet.status === 'active' && !trip,
            createdAt: vehicle.createdAt,
            updatedAt: vehicle.updatedAt
        }
    }

    /**
     * @param {{ startedAt: Date, driver: { name: string } }} trip
     * @param {string} action
     */
    #onTripError(trip, action) {
        const since = TIME_FORMAT.format(new Date(trip.startedAt))

        return utils.error(409, 'vehicle_on_trip', `O veículo está em viagem com ${trip.driver.name} desde as ${since}. Aguarde a viagem terminar para ${action}.`)
    }
}

module.exports = new VehicleService()
