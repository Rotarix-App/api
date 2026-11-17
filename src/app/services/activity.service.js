const FleetRepository = require('../repositories/fleet.repository')
const TripRepository = require('../repositories/trip.repository')
const ExpenseRepository = require('../repositories/expense.repository')
const RefuelingRepository = require('../repositories/refueling.repository')
const MaintenanceRepository = require('../repositories/maintenance.repository')
const TripService = require('./trip.service')
const records = require('../utils/records')
const period = require('../utils/period')

class ActivityService {
    /**
     * @param {number} managerId
     * @param {{ days?: number, from?: string, to?: string, fleetId?: number }} filters
     */
    async trips(managerId, filters) {
        const scope = await this.scope(managerId, filters)
        if (scope.error) return scope

        const trips = await TripRepository.findAllForManager({ ...scope.owner, field: 'startedAt', from: scope.range.from, to: scope.range.to })
        if (trips.error) return trips

        return trips.map((trip) => TripService.present(trip))
    }

    /**
     * @param {number} id
     * @param {number} managerId
     */
    async trip(id, managerId) {
        return TripService.findForManager(id, managerId)
    }

    /**
     * @param {number} managerId
     * @param {{ days?: number, from?: string, to?: string, fleetId?: number, category?: string }} filters
     */
    async expenses(managerId, filters) {
        const scope = await this.scope(managerId, filters)
        if (scope.error) return scope

        const list = await this.records(scope.owner, scope.range.from, scope.range.to)
        if (list.error) return list

        const items = filters.category && filters.category !== 'all' ? list.filter((record) => record.category === filters.category) : list

        return { ...records.totals(items), items }
    }

    /**
     * @param {number} managerId
     * @param {{ days?: number, from?: string, to?: string, fleetId?: number }} filters
     */
    async maintenances(managerId, filters) {
        const scope = await this.scope(managerId, filters)
        if (scope.error) return scope

        const maintenances = await MaintenanceRepository.findAll({ from: scope.range.from, to: scope.range.to }, scope.owner)
        if (maintenances.error) return maintenances

        const items = maintenances.map((maintenance) => records.maintenance(maintenance))

        return { total: records.totals(items).total, items }
    }

    /**
     * @param {number} managerId
     * @param {{ days?: number, from?: string, to?: string, fleetId?: number }} filters
     */
    async scope(managerId, { days, from, to, fleetId } = {}) {
        if (fleetId) {
            const fleet = await FleetRepository.findByIdAndManagerId(fleetId, managerId)
            if (fleet.error) return fleet
        }

        return { owner: { managerId, fleetId }, range: period.range({ days, from, to }) }
    }

    /**
     * @param {{ managerId: number, fleetId?: number }} owner
     * @param {Date} from
     * @param {Date} to
     */
    async records(owner, from, to) {
        const expenses = await ExpenseRepository.findAll({ from, to }, owner)
        if (expenses.error) return expenses
        const refuelings = await RefuelingRepository.findAll({ from, to }, owner)
        if (refuelings.error) return refuelings
        const maintenances = await MaintenanceRepository.findAll({ from, to }, owner)
        if (maintenances.error) return maintenances

        return records.sort([
            ...expenses.map((expense) => records.expense(expense)),
            ...refuelings.map((refueling) => records.refueling(refueling)),
            ...maintenances.map((maintenance) => records.maintenance(maintenance))
        ])
    }
}

module.exports = new ActivityService()
