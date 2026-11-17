const { Photo, OdometerReading } = require('../database/models')
const utils = require('../utils')

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
    async isLinkedToReading(id, options = {}) {
        const count = await OdometerReading.count({ where: { photoId: id }, ...options }).catch(utils.logError)
        if (count === undefined) return utils.error(500, 'internal_server_error', 'Não foi possível consultar a foto.')

        return count > 0
    }
}

module.exports = new PhotoRepository()
