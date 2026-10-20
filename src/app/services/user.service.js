const connection = require('../database')
const UserRepository = require('../repositories/user.repository')
const VehicleAssignmentRepository = require('../repositories/vehicle-assignment.repository')
const TripRepository = require('../repositories/trip.repository')
const AuthService = require('./auth.service')
const utils = require('../utils')

class UserService {
    /**
     * @param {number} id
     */
    async findById(id) {
        return UserRepository.findById(id)
    }

    /**
     * @param {{ id: number, role: string }} user
     * @param {{ name: string, email: string, phone: string, cnhNumber?: string, cnhCategory?: string }} data
     */
    async updateProfile(user, data) {
        const changes = {
            name: data.name,
            email: data.email,
            phone: data.phone
        }

        if (user.role === 'driver') {
            if (!data.cnhNumber || !data.cnhCategory) {
                return utils.error(400, 'cnh_required', 'Informe o número e a categoria da CNH.')
            }

            changes.cnhNumber = data.cnhNumber
            changes.cnhCategory = data.cnhCategory
        }

        const updated = await UserRepository.update(user.id, changes)
        if (updated.error) return updated

        return UserRepository.findById(user.id)
    }

    /**
     * @param {number} userId
     * @param {string} currentPassword
     * @param {string} newPassword
     */
    async changePassword(userId, currentPassword, newPassword) {
        const user = await UserRepository.findById(userId, { withPassword: true })
        if (user.error) return user

        const isCurrentPasswordValid = await AuthService.comparePassword(currentPassword, user.passwordHash)
        if (!isCurrentPasswordValid) return utils.error(400, 'invalid_current_password', 'A senha atual está incorreta.')

        const passwordHash = await AuthService.hashPassword(newPassword)

        return UserRepository.update(userId, { passwordHash })
    }

    /**
     * @param {number} userId
     */
    async deleteAccount(userId) {
        const tripInProgress = await TripRepository.findInProgressByDriverId(userId)
        if (tripInProgress?.error) return tripInProgress
        if (tripInProgress) {
            return utils.error(409, 'trip_in_progress', 'Finalize ou cancele a viagem em andamento antes de excluir a conta.')
        }

        const transaction = await connection.transaction().catch(utils.logError)
        if (!transaction) return utils.error(500, 'internal_server_error', 'Não foi possível excluir a conta.')

        const assignments = await VehicleAssignmentRepository.deleteByDriverId(userId, { transaction })
        if (assignments.error) {
            await transaction.rollback()
            return assignments
        }

        const anonymized = await UserRepository.anonymize(userId, { transaction })
        if (anonymized.error) {
            await transaction.rollback()
            return anonymized
        }

        const committed = await transaction.commit().then(() => true).catch(utils.logError)
        if (!committed) return utils.error(500, 'internal_server_error', 'Não foi possível excluir a conta.')

        return true
    }
}

module.exports = new UserService()
