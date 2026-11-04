const { OdometerReading } = require('../database/models')
const utils = require('../utils')

class OdometerReadingRepository {
    /**
     * @param {number} vehicleId
     * @param {object} options
     */
    async findLastByVehicleId(vehicleId, options = {}) {
        const reading = await OdometerReading.findOne({
            where: { vehicleId },
            order: [['valueKm', 'DESC'], ['id', 'DESC']],
            ...options
        }).catch(utils.logError)
        if (reading === undefined) return utils.error(500, 'internal_server_error', 'Não foi possível consultar as leituras do odômetro.')

        return reading
    }

    /**
     * @param {{ vehicleId: number, recordedBy: number, valueKm: number, source: string, photoId?: number }} data
     * @param {object} options
     */
    async create(data, options = {}) {
        const reading = await OdometerReading.create(data, options).catch(utils.logError)
        if (!reading) return utils.error(500, 'internal_server_error', 'Não foi possível registrar a leitura do odômetro.')

        return reading
    }
}

module.exports = new OdometerReadingRepository()
