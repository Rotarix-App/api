const { EventEmitter } = require('events')
const logger = require('../../app/middlewares/logger.middleware')

test('Should log only route templates, never request bodies, query values or raw URLs', () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => {})
    try {
        const req = {
            method: 'POST', originalUrl: '/drivers?email=private@example.test&phone=34999999999',
            body: { email: 'private@example.test', nested: { phone: '34999999999' }, password: 'Private123' },
            query: { search: 'private@example.test' }, route: { path: '/drivers/:id' }
        }
        const res = new EventEmitter()
        res.statusCode = 200
        const next = jest.fn()
        logger(req, res, next)
        expect(next).toHaveBeenCalledTimes(1)
        res.emit('finish')
        expect(log).toHaveBeenCalledWith('POST /drivers/:id 200')
    } finally {
        log.mockRestore()
    }
})
