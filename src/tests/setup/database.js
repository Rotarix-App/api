const fs = require('fs')
const path = require('path')
const mysql = require('mysql2/promise')

const DATABASE_STATEMENTS = /(DROP DATABASE IF EXISTS|CREATE DATABASE IF NOT EXISTS|USE) rotarix;/g

module.exports = async () => {
    require('dotenv').config({ path: '.env.test', quiet: true })

    const database = process.env.MYSQL_DATABASE
    if (database !== 'rotarix_test') {
        throw new Error('Refusing to reset a database other than "rotarix_test".')
    }

    const schema = fs.readFileSync(path.join(__dirname, '../../../data/db.sql'), 'utf8')
    const statements = schema.match(DATABASE_STATEMENTS) || []
    if (statements.length !== 3) {
        throw new Error('data/db.sql must start with DROP DATABASE, CREATE DATABASE and USE statements for "rotarix".')
    }

    const connection = await mysql.createConnection({
        host: process.env.MYSQL_HOST,
        port: Number(process.env.MYSQL_PORT),
        user: process.env.MYSQL_USERNAME,
        password: process.env.MYSQL_PASSWORD,
        multipleStatements: true
    })

    await connection.query(schema.replace(DATABASE_STATEMENTS, `$1 \`${database}\`;`))
    await connection.end()
}
