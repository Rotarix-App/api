const crypto = require('crypto')
const { User } = require('../database/models')
const utils = require('../utils')

class UserRepository {
    /**
     * @param {number} id
     * @param {{ withPassword?: boolean, transaction?: import('sequelize').Transaction }} options
     */
    async findById(id, { withPassword = false, transaction } = {}) {
        const model = withPassword ? User.scope('withPassword') : User

        const user = await model.findByPk(id, { transaction }).catch(utils.logError)
        if (user === undefined) return utils.error(500, 'internal_server_error', 'Não foi possível consultar o usuário.')
        if (!user) return utils.error(404, 'user_not_found', 'Usuário não encontrado.')

        return user
    }

    /**
     * @param {string} email
     * @param {{ withPassword?: boolean, transaction?: import('sequelize').Transaction }} options
     */
    async findByEmail(email, { withPassword = false, transaction } = {}) {
        const model = withPassword ? User.scope('withPassword') : User

        const user = await model.findOne({ where: { email }, transaction }).catch(utils.logError)
        if (user === undefined) return utils.error(500, 'internal_server_error', 'Não foi possível consultar o usuário.')
        if (!user) return utils.error(404, 'user_not_found', 'Usuário não encontrado.')

        return user
    }

    /**
     * @param {object} data
     * @param {{ transaction?: import('sequelize').Transaction }} options
     */
    async create(data, options = {}) {
        return User.create(data, options)
            .then((user) => user.reload(options))
            .catch((error) => this.#writeError(error, 'Não foi possível criar a conta.'))
    }

    /**
     * @param {number} id
     * @param {object} data
     * @param {{ transaction?: import('sequelize').Transaction }} options
     */
    async update(id, data, options = {}) {
        const result = await User.update(data, { where: { id }, ...options }).catch((error) => this.#writeError(error, 'Não foi possível atualizar a conta.'))
        if (result.error) return result

        return true
    }

    /**
     * @param {number} id
     * @param {{ transaction?: import('sequelize').Transaction }} options
     */
    async anonymize(id, options = {}) {
        const result = await User.update({
            name: 'Usuário removido',
            email: `removed-${id}@rotarix.invalid`,
            passwordHash: crypto.randomBytes(32).toString('hex'),
            phone: null,
            cnhNumber: null,
            cnhCategory: null,
            fleetId: null
        }, { where: { id }, ...options })
            .then(() => User.destroy({ where: { id }, ...options }))
            .catch(utils.logError)

        if (result === undefined) return utils.error(500, 'internal_server_error', 'Não foi possível excluir a conta.')

        return true
    }

    /**
     * @param {Error} error
     * @param {string} message
     */
    #writeError(error, message) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return utils.error(409, 'email_already_exists', 'Já existe uma conta cadastrada com este e-mail.')
        }

        utils.logError(error)

        return utils.error(500, 'internal_server_error', message)
    }
}

module.exports = new UserRepository()
