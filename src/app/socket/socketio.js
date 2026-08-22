const { Server } = require("socket.io")

class Socket {
    constructor(server) {
        this.io = new Server(server, {
            cors: {
                origin: "*"
            }
        })

        this.io.on("connection", (client) => {
            const clientIP = client.handshake.address.replace("::ffff:", "")
            console.log(`[WSS]`.green + ` Cliente ` + `${clientIP}`.yellow + ` (${client.id})`.gray + ` conectado com sucesso.`)

            client.on("join", (accountId) => {
                client.join(`account:${accountId}`)
                console.log(`[WSS]`.green + ` Cliente ` + `${client.id}`.gray + ` entrou na room ` + `account:${accountId}`.yellow)
            })

            client.on("disconnect", () => {
                console.log(`[WSS]`.red + ` Cliente ` + `${clientIP}`.yellow + ` (${client.id})`.gray + ` desconectado.`)
            })
        })
    }

    getIO() {
        return this.io
    }
}

module.exports = Socket
