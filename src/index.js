require('colors')
require('./prototypes/console')
require('dotenv').config({
    path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env'
})

console.clear()

console.log(`[i]`.cyan + ` Iniciando importação dos módulos.`)

const app = require(`./app/`)

module.exports = app
