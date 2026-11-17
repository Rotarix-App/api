const DAY = 24 * 60 * 60 * 1000
const OFFSET = '-03:00'
const DATE_FORMAT = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' })

class Period {
    /**
     * @param {Date} date
     */
    localDate(date = new Date()) {
        return DATE_FORMAT.format(date)
    }

    /**
     * @param {string} date
     */
    startOf(date) {
        return new Date(`${date}T00:00:00${OFFSET}`)
    }

    /**
     * @param {string | undefined} month
     */
    month(month) {
        const value = month || this.localDate().slice(0, 7)
        const [year, number] = value.split('-').map(Number)
        const next = number === 12 ? `${year + 1}-01` : `${year}-${String(number + 1).padStart(2, '0')}`

        return { month: value, from: this.startOf(`${value}-01`), to: this.startOf(`${next}-01`) }
    }

    /**
     * @param {{ days?: number, from?: string, to?: string }} filters
     */
    range({ days = 30, from, to } = {}) {
        const end = to ? new Date(this.startOf(to).getTime() + DAY) : new Date(this.startOf(this.localDate()).getTime() + DAY)
        const start = from ? this.startOf(from) : new Date(end.getTime() - days * DAY)
        const length = end.getTime() - start.getTime()

        return { from: start, to: end, previousFrom: new Date(start.getTime() - length) }
    }

    /**
     * @param {Date} from
     * @param {Date} to
     * @param {number} size
     */
    buckets(from, to, size = 5) {
        const buckets = []
        for (let start = from.getTime(); start < to.getTime(); start += size * DAY) {
            buckets.push({ from: new Date(start), to: new Date(Math.min(start + size * DAY, to.getTime())) })
        }

        return buckets
    }
}

module.exports = new Period()
