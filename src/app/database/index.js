const Sequelize = require("sequelize")

const connection = new Sequelize(process.env.MYSQL_DATABASE, process.env.MYSQL_USERNAME, process.env.MYSQL_PASSWORD, {
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT,
    dialect: 'mysql',
    logging: false
})

connection.authenticate().catch(async err => {
    console.log(`[i]`.red + ` ${err}`)
    return process.exit()
})

module.exports = connection

require("./models/associations")
