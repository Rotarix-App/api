const loadEnvironment = require('../../config/environment')

describe('Test environment configuration', () => {
    test('Should preserve explicit environment overrides and enforce the test database', () => {
        const env = { NODE_ENV: 'test', MYSQL_DATABASE: 'rotarix_test', MYSQL_HOST: 'explicit-host', MYSQL_PASSWORD: 'test-placeholder' }
        loadEnvironment(env)
        expect(env.MYSQL_HOST).toBe('explicit-host')
        expect(env.MYSQL_PASSWORD).toBe('test-placeholder')
        expect(env.MYSQL_DATABASE).toBe('rotarix_test')
    })

    test.each(['rotarix', 'other_test', 'rotarix_test_other'])('Should reject database %s before connecting', (database) => {
        expect(() => loadEnvironment({ NODE_ENV: 'test', MYSQL_DATABASE: database })).toThrow('Refusing to use a test database')
    })
})
