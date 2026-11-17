const fs = require('fs/promises')
const path = require('path')
const { randomUUID } = require('crypto')

const SIGNATURES = [
    { mimeType: 'image/jpeg', extension: 'jpg', matches: (buffer) => buffer.length >= 3 && buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF },
    { mimeType: 'image/png', extension: 'png', matches: (buffer) => buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])) },
    { mimeType: 'image/webp', extension: 'webp', matches: (buffer) => buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP' }
]

class Storage {
    /**
     * @param {Buffer} buffer
     */
    detectImage(buffer) {
        return SIGNATURES.find((signature) => signature.matches(buffer)) || null
    }

    /**
     * @param {Buffer} buffer
     * @param {string} extension
     */
    async save(buffer, extension) {
        const key = `${randomUUID()}.${extension}`
        await fs.mkdir(this.#directory(), { recursive: true })
        await fs.writeFile(this.path(key), buffer, { flag: 'wx' })

        return key
    }

    /**
     * @param {string} key
     */
    async remove(key) {
        await fs.rm(this.path(key), { force: true })
    }

    /**
     * @param {string} key
     */
    path(key) {
        return path.join(this.#directory(), path.basename(key))
    }

    #directory() {
        return path.resolve(process.env.UPLOAD_DIR || 'uploads')
    }
}

module.exports = new Storage()
