const { DataTypes } = require('sequelize')
const connection = require('..')

const OdometerReading = connection.define('OdometerReading', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    vehicleId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    recordedBy: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    valueKm: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
    },
    source: {
        type: DataTypes.ENUM('manual', 'trip_start', 'trip_end', 'refueling', 'maintenance'),
        allowNull: false
    },
    photoId: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    tableName: 'odometer_readings',
    underscored: true
})

module.exports = OdometerReading
