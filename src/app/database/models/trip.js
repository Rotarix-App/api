const { DataTypes } = require('sequelize')
const connection = require('..')
const UserHistory = require('../../utils/user-history')

const Trip = connection.define('Trip', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    driverId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    vehicleId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    origin: {
        type: DataTypes.STRING(120),
        allowNull: false
    },
    destination: {
        type: DataTypes.STRING(120),
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('in_progress', 'finished', 'cancelled'),
        allowNull: false,
        defaultValue: 'in_progress'
    },
    startReadingId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    endReadingId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    notes: {
        type: DataTypes.STRING(500),
        allowNull: true
    },
    startedAt: {
        type: DataTypes.DATE,
        allowNull: false
    },
    endedAt: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'trips',
    underscored: true
})

/** @returns {object} */
Trip.prototype.toJSON = function () {
    const values = this.get({ plain: true })
    if (Object.hasOwn(values, 'driver')) values.driver = UserHistory.present(values.driver)
    return values
}

module.exports = Trip
