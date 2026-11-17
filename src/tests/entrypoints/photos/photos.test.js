const fs = require('fs')
const request = require('supertest')
const { Photo } = require('../../../app/database/models')
const storage = require('../../../app/utils/storage')
const { createTestUser } = require('../../utils/user.util')
const { JPEG, PNG, uploadPhoto } = require('../../utils/trip.util')

let manager
let driver
let otherDriver

beforeAll(async () => {
    manager = await createTestUser()
    driver = await createTestUser('driver')
    otherDriver = await createTestUser('driver')
})

/**
 * @param {string} token
 */
function upload(token = driver.token) {
    return request(global.app).post('/photos').set('Authorization', `Bearer ${token}`)
}

describe('POST /photos', () => {
    describe('errors', () => {
        test('Should reject missing authentication', async () => {
            const response = await request(global.app).post('/photos').field('kind', 'odometer').attach('photo', JPEG, 'a.jpg')
            expect(response.status).toBe(401)
            expect(response.body.id).toBe('unauthorized')
        })

        test('Should reject managers', async () => {
            const response = await upload(manager.token).field('kind', 'odometer').attach('photo', JPEG, 'a.jpg')
            expect(response.status).toBe(403)
            expect(response.body.id).toBe('forbidden')
        })

        test('Should require a multipart body', async () => {
            const response = await upload().send({ kind: 'odometer' })
            expect(response.status).toBe(400)
            expect(response.body.id).toBe('photo_required')
        })

        test('Should require the file', async () => {
            const response = await upload().field('kind', 'odometer')
            expect(response.status).toBe(400)
            expect(response.body.id).toBe('photo_required')
        })

        test('Should reject an invalid kind', async () => {
            const response = await upload().field('kind', 'selfie').attach('photo', JPEG, 'a.jpg')
            expect(response.status).toBe(400)
            expect(response.body.id).toBe('invalid_schema')
        })

        test('Should reject a file in another field', async () => {
            const response = await upload().field('kind', 'odometer').attach('image', JPEG, 'a.jpg')
            expect(response.status).toBe(400)
            expect(response.body.id).toBe('invalid_upload')
        })

        test('Should reject content that is not an image, whatever the file name', async () => {
            const response = await upload().field('kind', 'odometer').attach('photo', Buffer.from('<script>alert(1)</script>'), { filename: 'a.jpg', contentType: 'image/jpeg' })
            expect(response.status).toBe(400)
            expect(response.body.id).toBe('invalid_photo_format')
        })

        test('Should reject files over 10 MB', async () => {
            const big = Buffer.concat([JPEG, Buffer.alloc(10 * 1024 * 1024)])
            const response = await upload().field('kind', 'odometer').attach('photo', big, 'a.jpg')
            expect(response.status).toBe(413)
            expect(response.body.id).toBe('photo_too_large')
        })
    })

    describe('success', () => {
        test('Should store the photo under an opaque key and detect its type from the content', async () => {
            const response = await upload().field('kind', 'receipt').attach('photo', PNG, { filename: 'Anderson Lima.jpg', contentType: 'image/jpeg' })

            expect(response.status).toBe(201)
            expect(response.body.data).toMatchObject({ kind: 'receipt', mimeType: 'image/png', sizeBytes: PNG.length })
            expect(response.body.data.storageKey).toBeUndefined()

            const photo = await Photo.findByPk(response.body.data.id)
            expect(photo.uploadedBy).toBe(driver.user.id)
            expect(photo.storageKey).toMatch(/^[0-9a-f-]{36}\.png$/)
            expect(fs.readFileSync(storage.path(photo.storageKey))).toEqual(PNG)
        })
    })
})

describe('GET /photos/:id', () => {
    describe('errors', () => {
        test('Should reject an invalid id', async () => {
            const response = await request(global.app).get('/photos/abc').set('Authorization', `Bearer ${driver.token}`)
            expect(response.status).toBe(400)
            expect(response.body.id).toBe('invalid_schema')
        })

        test("Should return 404 for another driver's photo", async () => {
            const photo = await uploadPhoto(driver.token)
            const response = await request(global.app).get(`/photos/${photo.id}`).set('Authorization', `Bearer ${otherDriver.token}`)
            expect(response.status).toBe(404)
            expect(response.body.id).toBe('photo_not_found')
        })
    })

    describe('success', () => {
        test('Should return the image bytes to the uploader', async () => {
            const photo = await uploadPhoto(driver.token)
            const response = await request(global.app).get(`/photos/${photo.id}`).set('Authorization', `Bearer ${driver.token}`)

            expect(response.status).toBe(200)
            expect(response.headers['content-type']).toBe('image/jpeg')
            expect(Buffer.from(response.body)).toEqual(JPEG)
        })
    })
})
