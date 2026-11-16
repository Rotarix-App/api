require('colors')
require('./prototypes/console')
require('./config/environment')()

console.clear()

console.log(`[i]`.cyan + ` Iniciando importação dos módulos.`)

const app = require(`./app/`)

module.exports = app
