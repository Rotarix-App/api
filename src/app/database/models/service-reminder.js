const { DataTypes } = require('sequelize')
const connection = require('..')

const ServiceReminder = connection.define('ServiceReminder', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    vehicleId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    title: {
        type: DataTypes.STRING(60),
        allowNull: false
    },
    dueOdometer: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
    },
    intervalKm: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true
    },
    completedMaintenanceId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    completedAt: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'service_reminders',
    underscored: true
})

module.exports = ServiceReminder
