const cors = require("cors")
const express = require('express')
const app = express()
const loggerMiddleware = require('./middlewares/logger.middleware.js')
const setupSwagger = require('./config/swagger.js')

app.use(cors())
app.use(express.urlencoded({ extended: false }))
app.use(express.json())
app.use(express.static('./src/app/public', { index: false, extensions: ['html'] }))

if (process.env.NODE_ENV != "test") {
    app.use(loggerMiddleware)
}

setupSwagger(app)

require('./handlers/routes.handler.js')(app)

if (process.env.NODE_ENV !== 'test') {
    const http = require('http')
    const Socket = require('../app/socket/socketio.js')

    const server = http.createServer(app)
    const socket = new Socket(server)
    const io = socket.getIO()

    function StartWebService() {
        return new Promise((resolve, reject) => {
            try {
                server.listen(process.env.SERVER_PORT, () => {
                    console.log(`[!]`.green + ` Webserver iniciado com sucesso em ` + `http://localhost:${process.env.SERVER_PORT}`.blue)
                    resolve()
                })
            } catch (e) {
                reject(e)
            }
        })
    }

    StartWebService()
}

module.exports = app
