const TripRepository = require('../repositories/trip.repository')
const ServiceReminderRepository = require('../repositories/service-reminder.repository')
const ActivityService = require('./activity.service')
const ReminderService = require('./reminder.service')
const TripService = require('./trip.service')
const records = require('../utils/records')
const period = require('../utils/period')

class MetricsService {
    /**
     * @param {number} managerId
     * @param {{ days?: number, from?: string, to?: string, fleetId?: number }} filters
     */
    async dashboard(managerId, filters) {
        const scope = await ActivityService.scope(managerId, filters)
        if (scope.error) return scope

        const { owner, range } = scope
        const all = await ActivityService.records(owner, range.previousFrom, range.to)
        if (all.error) return all

        const current = all.filter((record) => new Date(record.createdAt) >= range.from)
        const previous = all.filter((record) => new Date(record.createdAt) < range.from)

        const started = await TripRepository.findAllForManager({ ...owner, field: 'startedAt', from: range.from, to: range.to })
        if (started.error) return started
        const finished = await TripRepository.findAllForManager({ ...owner, field: 'endedAt', status: 'finished', from: range.from, to: range.to })
        if (finished.error) return finished

        const reminders = await ServiceReminderRepository.findPendingByManager(owner)
        if (reminders.error) return reminders

        const spend = records.totals(current)
        const previousTotal = records.totals(previous).total
        const finishedTrips = finished.map((trip) => TripService.present(trip))
        const km = finishedTrips.reduce((sum, trip) => sum + trip.distanceKm, 0)

        return {
            period: { from: range.from, to: range.to },
            spend: {
                ...spend,
                previousTotal,
                changePercent: previousTotal > 0 ? Math.round((spend.total - previousTotal) / previousTotal * 1000) / 10 : null
            },
            trips: started.length,
            km,
            costPerKm: this.#costPerKm(spend.total, km),
            spendSeries: period.buckets(range.from, range.to).map((bucket) => ({
                from: bucket.from,
                to: bucket.to,
                total: records.totals(current.filter((record) => new Date(record.createdAt) >= bucket.from && new Date(record.createdAt) < bucket.to)).total
            })),
            vehicles: this.#byVehicle(current, finishedTrips),
            alerts: reminders
                .map((reminder) => ({ ...ReminderService.present(reminder, reminder.vehicle.currentOdometer), vehicle: records.vehicle(reminder.vehicle) }))
                .sort((a, b) => a.remainingKm - b.remainingKm)
        }
    }

    /**
     * @param {object[]} list
     * @param {object[]} trips
     */
    #byVehicle(list, trips) {
        const vehicles = new Map()
        const entry = (vehicle) => {
            if (!vehicles.has(vehicle.id)) vehicles.set(vehicle.id, { vehicle, cents: 0, km: 0 })
            return vehicles.get(vehicle.id)
        }

        for (const record of list) entry(record.vehicle).cents += records.cents(record.amount)
        for (const trip of trips) entry(trip.vehicle).km += trip.distanceKm

        return [...vehicles.values()]
            .map(({ vehicle, cents, km }) => ({ vehicle, total: cents / 100, km, costPerKm: this.#costPerKm(cents / 100, km) }))
            .sort((a, b) => (b.costPerKm ?? -1) - (a.costPerKm ?? -1))
    }

    /**
     * @param {number} total
     * @param {number} km
     */
    #costPerKm(total, km) {
        return km > 0 ? Math.round(records.cents(total) / km) / 100 : null
    }
}

module.exports = new MetricsService()
