const request = require('supertest')

let sequence = 0

/**
 * @param {'manager' | 'driver'} role
 * @param {object} overrides
 */
function buildUser(role = 'manager', overrides = {}) {
    sequence++

    const user = {
        role,
        name: role === 'driver' ? 'Anderson Lima' : 'Marcos Carvalho',
        email: `user.${Date.now()}.${sequence}@rotarix.test`,
        phone: '34998124471',
        password: 'Senha123'
    }

    if (role === 'driver') {
        user.cnhNumber = '04728391650'
        user.cnhCategory = 'E'
    }

    return { ...user, ...overrides }
}

/**
 * @param {'manager' | 'driver'} role
 * @param {object} overrides
 */
async function createTestUser(role = 'manager', overrides = {}) {
    const payload = buildUser(role, overrides)

    const response = await request(global.app)
        .post('/register')
        .send(payload)

    return {
        payload,
        token: response.body.data.token,
        user: response.body.data.user
    }
}

module.exports = {
    buildUser,
    createTestUser
}
