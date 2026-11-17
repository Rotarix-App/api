const PhotoRepository = require('../repositories/photo.repository')
const storage = require('../utils/storage')
const utils = require('../utils')

class PhotoService {
    /**
     * @param {number} userId
     * @param {'odometer' | 'receipt' | 'invoice'} kind
     * @param {{ buffer: Buffer, size: number } | undefined} file
     */
    async upload(userId, kind, file) {
        if (!file) return utils.error(400, 'photo_required', 'Envie a foto.')

        const image = storage.detectImage(file.buffer)
        if (!image) return utils.error(400, 'invalid_photo_format', 'Envie uma foto em JPEG, PNG ou WebP.')

        const storageKey = await storage.save(file.buffer, image.extension).catch(utils.logError)
        if (!storageKey) return utils.error(500, 'internal_server_error', 'Não foi possível salvar a foto.')

        const photo = await PhotoRepository.create({ kind, storageKey, mimeType: image.mimeType, sizeBytes: file.size, uploadedBy: userId })
        if (photo.error) {
            await storage.remove(storageKey).catch(utils.logError)
            return photo
        }

        return this.#present(photo)
    }

    /**
     * @param {number} id
     * @param {number} userId
     */
    async findFile(id, userId) {
        const photo = await PhotoRepository.findByIdAndUploader(id, userId)
        if (photo.error) return photo

        return { path: storage.path(photo.storageKey), mimeType: photo.mimeType }
    }

    /**
     * @param {number} id
     * @param {number} userId
     * @param {object} options
     */
    async checkUnusedOdometerPhoto(id, userId, options = {}) {
        const photo = await PhotoRepository.findByIdAndUploader(id, userId, options)
        if (photo.error) return photo

        if (photo.kind !== 'odometer') return utils.error(400, 'invalid_photo_kind', 'Envie uma foto do odômetro.')

        const linked = await PhotoRepository.isLinkedToReading(id, options)
        if (linked.error) return linked
        if (linked) return utils.error(409, 'photo_already_used', 'Esta foto já foi usada em outro registro. Tire uma nova foto do odômetro.')

        return photo
    }

    /**
     * @param {object} photo
     */
    #present(photo) {
        return {
            id: photo.id,
            kind: photo.kind,
            mimeType: photo.mimeType,
            sizeBytes: photo.sizeBytes,
            createdAt: photo.createdAt
        }
    }
}

module.exports = new PhotoService()
