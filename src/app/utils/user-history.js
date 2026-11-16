class UserHistory {
    /**
     * @param {import('sequelize').ModelStatic} model
     * @param {string} as
     */
    include(model, as = 'driver') {
        return { model, as, attributes: ['id', 'name', 'deletedAt'], paranoid: false }
    }

    /** @param {object | null} user */
    present(user) {
        if (!user || user.deletedAt) return { name: 'Motorista removido' }
        return { id: user.id, name: user.name }
    }
}

module.exports = new UserHistory()
