const PhotoRepository = require('../repositories/photo.repository')
const storage = require('../utils/storage')
const utils = require('../utils')

const KIND_ERRORS = {
    odometer: 'Envie uma foto do odômetro.',
    receipt: 'Envie uma foto do comprovante.',
    invoice: 'Envie uma foto da nota fiscal.'
}

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
     * @param {{ id: number, role: string }} user
     */
    async findFile(id, user) {
        const photo = await PhotoRepository.findById(id)
        if (photo.error) return photo

        if (photo.uploadedBy !== user.id) {
            const visible = user.role === 'manager' ? await PhotoRepository.isVisibleToManager(id, user.id) : false
            if (visible.error) return visible
            if (!visible) return utils.error(404, 'photo_not_found', 'Foto não encontrada.')
        }

        return { path: storage.path(photo.storageKey), mimeType: photo.mimeType }
    }

    /**
     * @param {number} id
     * @param {number} userId
     * @param {'odometer' | 'receipt' | 'invoice'} kind
     * @param {object} options
     */
    async checkUnused(id, userId, kind, options = {}) {
        const photo = await PhotoRepository.findByIdAndUploader(id, userId, { ...options, lock: true })
        if (photo.error) return photo

        if (photo.kind !== kind) return utils.error(400, 'invalid_photo_kind', KIND_ERRORS[kind])

        const linked = await PhotoRepository.isLinked(id, options)
        if (linked.error) return linked
        if (linked) return utils.error(409, 'photo_already_used', 'Esta foto já foi usada em outro registro. Tire uma nova foto.')

        return photo
    }

    /**
     * @param {number} id
     * @param {object} options
     */
    async findStorageKey(id, options = {}) {
        const photo = await PhotoRepository.findById(id, options)
        if (photo.error) return photo

        return photo.storageKey
    }

    /**
     * @param {number} id
     * @param {object} options
     */
    async destroy(id, options = {}) {
        return PhotoRepository.destroy(id, options)
    }

    /**
     * @param {string} storageKey
     */
    async removeFile(storageKey) {
        await storage.remove(storageKey).catch(utils.logError)
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
