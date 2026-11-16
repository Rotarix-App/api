const path = require('path')
const dotenv = require('dotenv')

/** @param {NodeJS.ProcessEnv} env */
module.exports = (env = process.env) => {
    const root = path.resolve(__dirname, '../..')
    const test = env.NODE_ENV === 'test'
    dotenv.config({
        path: test ? [path.join(root, '.env.test.local'), path.join(root, '.env.test')] : path.join(root, '.env'),
        processEnv: env,
        quiet: true
    })
    if (test && env.MYSQL_DATABASE !== 'rotarix_test') {
        throw new Error('Refusing to use a test database other than "rotarix_test".')
    }
    return env
}
