const { DataTypes } = require('sequelize')
const connection = require('..')

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

module.exports = Trip
