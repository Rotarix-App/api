const UserHistory = require('./user-history')

const CATEGORIES = ['fuel', 'toll', 'food', 'tire_repair', 'urgent_maintenance']

class Records {
    get categories() {
        return CATEGORIES
    }

    /**
     * @param {string | number} value
     */
    cents(value) {
        return Math.round(Number(value) * 100)
    }

    /**
     * @param {string | number} value
     */
    money(value) {
        return this.cents(value) / 100
    }

    /**
     * @param {object | null} vehicle
     */
    vehicle(vehicle) {
        return vehicle ? { id: vehicle.id, plate: vehicle.plate, brand: vehicle.brand, model: vehicle.model } : null
    }

    /**
     * @param {object | null} trip
     */
    trip(trip) {
        return trip ? { id: trip.id, origin: trip.origin, destination: trip.destination, status: trip.status } : null
    }

    /**
     * @param {object} expense
     */
    expense(expense) {
        return this.#withDriver(expense, {
            type: 'expense',
            id: expense.id,
            category: expense.category,
            amount: this.money(expense.amount),
            description: expense.description,
            receiptPhotoId: expense.receiptPhotoId,
            hasReceipt: expense.receiptPhotoId !== null,
            vehicle: this.vehicle(expense.vehicle),
            trip: this.trip(expense.trip),
            createdAt: expense.createdAt,
            updatedAt: expense.updatedAt
        })
    }

    /**
     * @param {object} refueling
     */
    refueling(refueling) {
        return this.#withDriver(refueling, {
            type: 'refueling',
            id: refueling.id,
            category: 'fuel',
            amount: this.money(refueling.totalAmount),
            liters: Number(refueling.liters),
            pricePerLiter: Number(refueling.pricePerLiter),
            gasStation: refueling.gasStation,
            odometer: refueling.odometerReading?.valueKm ?? null,
            odometerPhotoId: refueling.odometerReading?.photoId ?? null,
            invoicePhotoId: refueling.invoicePhotoId,
            hasReceipt: refueling.invoicePhotoId !== null,
            vehicle: this.vehicle(refueling.vehicle),
            trip: this.trip(refueling.trip),
            createdAt: refueling.createdAt
        })
    }

    /**
     * @param {object} maintenance
     */
    maintenance(maintenance) {
        return this.#withDriver(maintenance, {
            type: 'maintenance',
            id: maintenance.id,
            category: 'urgent_maintenance',
            maintenanceType: maintenance.type,
            service: maintenance.service,
            amount: this.money(maintenance.amount),
            workshop: maintenance.workshop,
            odometer: maintenance.odometerReading?.valueKm ?? null,
            odometerPhotoId: maintenance.odometerReading?.photoId ?? null,
            invoicePhotoId: maintenance.invoicePhotoId,
            hasReceipt: maintenance.invoicePhotoId !== null,
            vehicle: this.vehicle(maintenance.vehicle),
            trip: this.trip(maintenance.trip),
            createdAt: maintenance.createdAt
        })
    }

    /**
     * @param {{ amount: number, category: string }[]} records
     */
    totals(records) {
        const byCategory = Object.fromEntries(CATEGORIES.map((category) => [category, 0]))
        let total = 0
        for (const record of records) {
            const cents = this.cents(record.amount)
            byCategory[record.category] += cents
            total += cents
        }

        return {
            total: total / 100,
            byCategory: Object.fromEntries(Object.entries(byCategory).map(([category, cents]) => [category, cents / 100]))
        }
    }

    /**
     * @param {object[]} records
     */
    sort(records) {
        return records.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt) || b.id - a.id)
    }

    /**
     * @param {object} record
     * @param {object} presented
     */
    #withDriver(record, presented) {
        if (!Object.hasOwn(record.dataValues || record, 'driver')) return presented
        return { ...presented, driver: UserHistory.present(record.driver) }
    }
}

module.exports = new Records()
