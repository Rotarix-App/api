const connection = require('../database')
const DriverRepository = require('../repositories/driver.repository')
const UserRepository = require('../repositories/user.repository')
const FleetRepository = require('../repositories/fleet.repository')
const VehicleRepository = require('../repositories/vehicle.repository')
const VehicleAssignmentRepository = require('../repositories/vehicle-assignment.repository')
const TripRepository = require('../repositories/trip.repository')
const AuthService = require('./auth.service')
const utils = require('../utils')

class DriverService {
    /**
     * @param {object} data
     */
    async create({ password, name, email, phone, cnhNumber, cnhCategory }) {
        const passwordHash = await AuthService.hashPassword(password)
        const driver = await UserRepository.create({ name, email, phone, cnhNumber, cnhCategory, role: 'driver', passwordHash, status: 'active' })
        if (driver.error) return driver
        return this.#present(driver)
    }

    /**
     * @param {object} filters
     */
    async list(filters) {
        const drivers = await DriverRepository.list(filters)
        if (drivers.error) return drivers
        return drivers.map((driver) => this.#serialize(driver, driver.assignedVehicles, driver.trips[0]))
    }

    /**
     * @param {number} id
     */
    async findById(id) {
        const driver = await DriverRepository.find({ id })
        if (driver.error) return driver
        return this.#present(driver)
    }

    /**
     * @param {number} id
     * @param {object} data
     */
    async update(id, data) {
        return this.#write({ id }, async (driver, transaction) => {
            const updated = await UserRepository.update(id, data, { transaction })
            if (updated.error) return updated
            const reloaded = await DriverRepository.find({ id }, { transaction })
            if (reloaded.error) return reloaded
            return this.#present(reloaded, { transaction })
        })
    }

    /**
     * @param {number} id
     * @param {string} status
     */
    async changeStatus(id, status) {
        return this.#write({ id }, async (driver, transaction) => {
            if (status === 'inactive') {
                const removed = await VehicleAssignmentRepository.deleteByDriverId(id, { transaction })
                if (removed.error) return removed
            }
            const updated = await UserRepository.update(id, { status }, { transaction })
            if (updated.error) return updated
            driver.status = status
            return this.#present(driver, { transaction })
        })
    }

    /**
     * @param {number} id
     * @param {string} confirmation
     */
    async destroy(id, confirmation) {
        return this.#write({ id }, async (driver, transaction) => {
            if (confirmation !== 'EXCLUIR') return utils.error(400, 'confirmation_mismatch', 'Digite EXCLUIR para confirmar a exclusão.')
            const trip = await TripRepository.findInProgressByDriverId(id, { transaction })
            if (trip?.error) return trip
            if (trip) return this.#tripError()
            const removed = await VehicleAssignmentRepository.deleteByDriverId(id, { transaction })
            if (removed.error) return removed
            const result = await UserRepository.anonymize(id, { transaction })
            return result.error ? result : {}
        })
    }

    /**
     * @param {number} id
     * @param {number} managerId
     */
    async release(id, managerId) {
        return this.#write({ id }, async (driver, transaction) => {
            const ownership = await this.#checkAssignments(id, managerId, transaction)
            if (ownership.error) return ownership
            const trip = await TripRepository.findInProgressByDriverId(id, { transaction })
            if (trip?.error) return trip
            if (trip) return this.#tripError()
            const removed = await VehicleAssignmentRepository.deleteByDriverId(id, { transaction })
            if (removed.error) return removed
            return {}
        })
    }

    /**
     * @param {number} id
     * @param {number} managerId
     * @param {{ fleetId: number, vehicleIds: number[] }} data
     */
    async assign(id, managerId, { fleetId, vehicleIds }) {
        return this.#write({ id }, async (driver, transaction) => {
            const fleet = await FleetRepository.findByIdAndManagerId(fleetId, managerId, { transaction, lock: true })
            if (fleet.error) return fleet
            if (fleet.status !== 'active') return utils.error(409, 'fleet_inactive', 'Escolha uma frota ativa.')
            const ownership = await this.#checkAssignments(id, managerId, transaction)
            if (ownership.error) return ownership
            const trip = await TripRepository.findInProgressByDriverId(id, { transaction })
            if (trip?.error) return trip
            if (trip && !vehicleIds.includes(trip.vehicleId)) return this.#tripError()
            for (const vehicleId of [...vehicleIds].sort((a, b) => a - b)) {
                const vehicle = await VehicleRepository.findByIdAndFleetId(vehicleId, fleetId, { transaction, lock: true })
                if (vehicle.error) return vehicle
            }
            const removed = await VehicleAssignmentRepository.deleteByDriverId(id, { transaction })
            if (removed.error) return removed
            const saved = await VehicleAssignmentRepository.createMany(id, vehicleIds, { transaction })
            if (saved.error) return saved
            return this.#present(driver, { transaction })
        })
    }

    /**
     * @param {object} conditions
     * @param {function} action
     */
    async #write(conditions, action) {
        const transaction = await connection.transaction().catch(utils.logError)
        if (!transaction) return utils.error(500, 'internal_server_error', 'Não foi possível alterar o motorista.')
        try {
            const driver = await DriverRepository.find(conditions, { transaction, lock: true })
            const result = driver.error ? driver : await action(driver, transaction)
            if (result.error) {
                await transaction.rollback()
                return result
            }
            await transaction.commit()
            return result
        } catch (err) {
            utils.logError(err)
            if (!transaction.finished) await transaction.rollback().catch(utils.logError)
            return utils.error(500, 'internal_server_error', 'Não foi possível alterar o motorista.')
        }
    }

    /**
     * @param {object} driver
     * @param {object} options
     */
    async #present(driver, options = {}) {
        const vehicles = await DriverRepository.assignedVehicles(driver.id, options)
        if (vehicles.error) return vehicles
        const trip = await TripRepository.findInProgressByDriverId(driver.id, options)
        if (trip?.error) return trip
        return this.#serialize(driver, vehicles, trip)
    }

    /**
     * @param {object} driver
     * @param {object[]} vehicles
     * @param {object | null} trip
     */
    #serialize(driver, vehicles, trip) {
        return {
            id: driver.id, name: driver.name, email: driver.email,
            phone: driver.phone, cnhNumber: driver.cnhNumber, cnhCategory: driver.cnhCategory,
            status: driver.status,
            tripStatus: driver.status === 'inactive' ? 'inactive' : trip ? 'in_progress' : 'free',
            fleet: vehicles[0] ? { id: vehicles[0].fleet.id, name: vehicles[0].fleet.name, status: vehicles[0].fleet.status } : null,
            assignedVehicles: vehicles.map((vehicle) => ({ id: vehicle.id, plate: vehicle.plate, brand: vehicle.brand, model: vehicle.model, status: vehicle.status, tripStatus: vehicle.trips.length ? 'in_progress' : 'free' })),
            createdAt: driver.createdAt, updatedAt: driver.updatedAt
        }
    }

    /**
     * @param {number} id
     * @param {number} managerId
     * @param {import('sequelize').Transaction} transaction
     */
    async #checkAssignments(id, managerId, transaction) {
        const assignments = await VehicleAssignmentRepository.findByDriverId(id, { transaction, lock: true })
        if (assignments.error) return assignments
        if (assignments.some((assignment) => assignment.vehicle?.fleet?.managerId !== managerId)) {
            return utils.error(409, 'driver_assigned_to_another_manager', 'O gestor da frota atual deve liberar as atribuições antes da transferência.')
        }
        return true
    }

    /** @returns {object} */
    #tripError() {
        return utils.error(409, 'driver_has_trip_in_progress', 'O motorista possui viagem em andamento. Aguarde a viagem terminar.')
    }
}

module.exports = new DriverService()
