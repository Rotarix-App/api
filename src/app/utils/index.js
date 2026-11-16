
class Utils {
    /**
     * @param {number} httpStatus
     * @param {string} id
     * @param {string} message
     */
    error(httpStatus, id, message) {
        return {
            error: true,
            httpStatus,
            id,
            message
        }
    }

    /**
     * @param {Error} error
     */
    logError(error) {
        const dbError = error?.parent || error?.original || error

        console.error('[ERRO MYSQL]', {
            code: dbError?.code,
            errno: dbError?.errno,
            sqlMessage: dbError?.sqlMessage,
            message: error?.message
        })

        console.error(error?.stack || error)

        return undefined
    }

    /**
     * @param {import('express').Response} res
     * @param {{ httpStatus: number, id: string, message: string }} error
     */
    sendError(res, error) {
        return res.status(error.httpStatus).json({
            error: true,
            message: error.message,
            id: error.id
        })
    }
}

module.exports = new Utils()
