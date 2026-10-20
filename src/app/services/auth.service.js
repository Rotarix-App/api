const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const UserRepository = require('../repositories/user.repository')
const utils = require('../utils')

const TOKEN_EXPIRATION = '7d'
const DUMMY_PASSWORD_HASH = bcrypt.hashSync('rotarix-dummy-password', 10)

class AuthService {
    /**
     * @param {{ role: 'manager' | 'driver', name: string, email: string, phone: string, password: string, cnhNumber?: string, cnhCategory?: string }} data
     */
    async register(data) {
        const passwordHash = await this.hashPassword(data.password)

        const user = await UserRepository.create({
            role: data.role,
            name: data.name,
            email: data.email,
            phone: data.phone,
            cnhNumber: data.cnhNumber,
            cnhCategory: data.cnhCategory,
            passwordHash
        })
        if (user.error) return user

        return {
            token: this.#generateToken(user),
            user
        }
    }

    /**
     * @param {string} email
     * @param {string} password
     */
    async login(email, password) {
        const user = await UserRepository.findByEmail(email, { withPassword: true })
        if (user.error && user.httpStatus !== 404) return user

        const isPasswordValid = await bcrypt.compare(password, user.error ? DUMMY_PASSWORD_HASH : user.passwordHash)
        if (user.error || !isPasswordValid) return utils.error(401, 'invalid_credentials', 'E-mail ou senha incorretos.')

        const inactive = this.checkActive(user)
        if (inactive) return inactive

        return {
            token: this.#generateToken(user),
            user
        }
    }

    /**
     * @param {{ status: string }} user
     */
    checkActive(user) {
        if (user.status === 'inactive') {
            return utils.error(403, 'account_inactive', 'Sua conta está desativada. Fale com o gestor da frota.')
        }

        return undefined
    }

    /**
     * @param {string} password
     */
    async hashPassword(password) {
        return bcrypt.hash(password, 10)
    }

    /**
     * @param {string} password
     * @param {string} passwordHash
     */
    async comparePassword(password, passwordHash) {
        return bcrypt.compare(password, passwordHash)
    }

    /**
     * @param {string} token
     */
    verifyToken(token) {
        try {
            return jwt.verify(token, process.env.JWT_SECRET)
        } catch {
            return undefined
        }
    }

    /**
     * @param {{ id: number, role: string }} user
     */
    #generateToken(user) {
        return jwt.sign({ sub: String(user.id), role: user.role }, process.env.JWT_SECRET, { expiresIn: TOKEN_EXPIRATION })
    }
}

module.exports = new AuthService()
