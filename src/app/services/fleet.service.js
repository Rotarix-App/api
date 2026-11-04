const connection = require('../database')
const FleetRepository = require('../repositories/fleet.repository')
const VehicleRepository = require('../repositories/vehicle.repository')
const VehicleAssignmentRepository = require('../repositories/vehicle-assignment.repository')
const TripRepository = require('../repositories/trip.repository')
const UserRepository = require('../repositories/user.repository')
const utils = require('../utils')

class FleetService {
    /**
     * @param {object} filters
     */
    async list(filters) {
        const fleets = await FleetRepository.findAll(filters)
        if (fleets.error || !fleets.length) return fleets

        return this.#withCounts(fleets)
    }

    /**
     * @param {number} id
     */
    async findById(id) {
        const fleet = await FleetRepository.findById(id)
        if (fleet.error) return fleet

        const fleets = await this.#withCounts([fleet])
        return fleets.error ? fleets : fleets[0]
    }

    /**
     * @param {object[]} fleets
     */
    async #withCounts(fleets) {
        const ids = fleets.map(fleet => fleet.id)
        const vehicles = await VehicleRepository.countByFleetIds(ids)
        if (vehicles.error) return vehicles
        const drivers = await VehicleAssignmentRepository.countDriversByFleetIds(ids)
        if (drivers.error) return drivers
        const trips = await TripRepository.countInProgressByFleetIds(ids)
        if (trips.error) return trips

        const vehicleCounts = new Map(vehicles.map(row => [row.fleetId, Number(row.count)]))
        const driverCounts = new Map(drivers.map(row => [row.fleetId, Number(row.count)]))
        const tripCounts = new Map(trips.map(row => [row.fleetId, Number(row.count)]))

        return fleets.map(fleet => ({
            ...fleet.toJSON(),
            vehicleCount: vehicleCounts.get(fleet.id) || 0,
            driverCount: driverCounts.get(fleet.id) || 0,
            onTripCount: tripCounts.get(fleet.id) || 0
        }))
    }

    /**
     * @param {{ name: string, baseRegion: string, description?: string }} data
     */
    async create({ name, baseRegion, description = null }) {
        return FleetRepository.create({ name, baseRegion, description, status: 'active' })
    }

    /**
     * @param {number} id
     * @param {{ name: string, baseRegion: string, description?: string }} data
     */
    async update(id, { name, baseRegion, description = null }) {
        return this.#write(id, async (fleet, transaction) => {
            const updated = await FleetRepository.update(id, { name, baseRegion, description }, { transaction })
            if (updated.error) return updated

            return FleetRepository.findById(id, { transaction })
        })
    }

    /**
     * @param {number} id
     * @param {'active' | 'inactive'} status
     */
    async changeStatus(id, status) {
        return this.#write(id, async (fleet, transaction) => {
            const updated = await FleetRepository.update(id, { status }, { transaction })
            if (updated.error) return updated

            return FleetRepository.findById(id, { transaction })
        })
    }

    /**
     * @param {number} id
     * @param {string} confirmationName
     */
    async destroy(id, confirmationName) {
        return this.#write(id, async (fleet, transaction) => {
            if (confirmationName !== fleet.name) {
                return utils.error(400, 'fleet_name_confirmation_mismatch', 'O nome informado não confere com o nome da frota.')
            }

            const vehicleIds = await VehicleRepository.findIdsByFleetId(id, { transaction, lock: true })
            if (vehicleIds.error) return vehicleIds
            const assignments = await VehicleAssignmentRepository.deleteByVehicleIds(vehicleIds, { transaction })
            if (assignments.error) return assignments

            return FleetRepository.destroy(id, { transaction })
        })
    }

    /**
     * @param {number} id
     * @param {function} action
     */
    async #write(id, action) {
        const transaction = await connection.transaction().catch(utils.logError)
        if (!transaction) return utils.error(500, 'internal_server_error', 'Não foi possível alterar a frota.')

        try {
            const fleet = await FleetRepository.findById(id, { transaction, lock: true })
            const result = fleet.error ? fleet : await action(fleet, transaction)
            if (result.error) {
                await transaction.rollback()
                return result
            }

            await transaction.commit()
            return result
        } catch (err) {
            utils.logError(err)
            if (!transaction.finished) await transaction.rollback().catch(utils.logError)
            return utils.error(500, 'internal_server_error', 'Não foi possível alterar a frota.')
        }
    }

    /**
     * @param {number} id
     */
    async listVehicles(id) {
        const fleet = await FleetRepository.findById(id)
        if (fleet.error) return fleet
        const vehicles = await VehicleRepository.findByFleetId(id)
        if (vehicles.error) return vehicles

        return vehicles.map(vehicle => ({
            id: vehicle.id,
            plate: vehicle.plate,
            brand: vehicle.brand,
            model: vehicle.model,
            year: vehicle.year,
            currentOdometer: vehicle.currentOdometer,
            status: vehicle.status,
            tripStatus: vehicle.trips.length ? 'in_progress' : 'free',
            assignedDrivers: vehicle.assignedDrivers.map(driver => ({ id: driver.id, name: driver.name }))
        }))
    }

    /**
     * @param {number} id
     */
    async listDrivers(id) {
        const fleet = await FleetRepository.findById(id)
        if (fleet.error) return fleet
        const drivers = await UserRepository.findDriversByFleetId(id)
        if (drivers.error) return drivers

        return drivers.map(driver => ({
            id: driver.id,
            name: driver.name,
            cnhCategory: driver.cnhCategory,
            status: driver.status,
            tripStatus: driver.trips.length ? 'in_progress' : 'free'
        }))
    }
}

module.exports = new FleetService()
