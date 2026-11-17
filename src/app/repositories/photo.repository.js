const { Photo, OdometerReading, Expense, Refueling, Maintenance, Vehicle, Fleet } = require('../database/models')
const utils = require('../utils')

const LINKS = [
    [OdometerReading, 'photoId'],
    [Expense, 'receiptPhotoId'],
    [Refueling, 'invoicePhotoId'],
    [Maintenance, 'invoicePhotoId']
]

class PhotoRepository {
    /**
     * @param {{ kind: string, storageKey: string, mimeType: string, sizeBytes: number, uploadedBy: number }} data
     * @param {object} options
     */
    async create(data, options = {}) {
        const photo = await Photo.create(data, options).catch(utils.logError)
        if (!photo) return utils.error(500, 'internal_server_error', 'Não foi possível salvar a foto.')

        return photo
    }

    /**
     * @param {number} id
     * @param {object} options
     */
    async findById(id, options = {}) {
        const photo = await Photo.findByPk(id, options).catch(utils.logError)
        if (photo === undefined) return utils.error(500, 'internal_server_error', 'Não foi possível consultar a foto.')
        if (!photo) return utils.error(404, 'photo_not_found', 'Foto não encontrada.')

        return photo
    }

    /**
     * @param {number} id
     * @param {number} uploadedBy
     * @param {object} options
     */
    async findByIdAndUploader(id, uploadedBy, options = {}) {
        const photo = await Photo.findOne({ where: { id, uploadedBy }, ...options }).catch(utils.logError)
        if (photo === undefined) return utils.error(500, 'internal_server_error', 'Não foi possível consultar a foto.')
        if (!photo) return utils.error(404, 'photo_not_found', 'Foto não encontrada.')

        return photo
    }

    /**
     * @param {number} id
     * @param {object} options
     */
    async isLinked(id, options = {}) {
        const counts = await Promise.all(LINKS.map(([model, field]) => model.count({ where: { [field]: id }, ...options })))
            .catch(utils.logError)
        if (counts === undefined) return utils.error(500, 'internal_server_error', 'Não foi possível consultar a foto.')

        return counts.some((count) => count > 0)
    }

    /**
     * @param {number} id
     * @param {number} managerId
     */
    async isVisibleToManager(id, managerId) {
        const include = [{
            model: Vehicle,
            as: 'vehicle',
            attributes: [],
            paranoid: false,
            required: true,
            include: [{ model: Fleet, as: 'fleet', attributes: [], where: { managerId }, required: true }]
        }]
        const counts = await Promise.all(LINKS.map(([model, field]) => model.count({ where: { [field]: id }, include })))
            .catch(utils.logError)
        if (counts === undefined) return utils.error(500, 'internal_server_error', 'Não foi possível consultar a foto.')

        return counts.some((count) => count > 0)
    }

    /**
     * @param {number} id
     * @param {object} options
     */
    async destroy(id, options = {}) {
        const result = await Photo.destroy({ where: { id }, ...options }).catch(utils.logError)
        if (result === undefined) return utils.error(500, 'internal_server_error', 'Não foi possível excluir a foto.')

        return true
    }
}

module.exports = new PhotoRepository()
