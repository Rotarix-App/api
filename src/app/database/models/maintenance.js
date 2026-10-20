const { DataTypes } = require('sequelize')
const connection = require('..')

const Maintenance = connection.define('Maintenance', {
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
    tripId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    odometerReadingId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('preventive', 'corrective', 'urgent'),
        allowNull: false
    },
    service: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    workshop: {
        type: DataTypes.STRING(120),
        allowNull: false
    },
    invoicePhotoId: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    tableName: 'maintenances',
    underscored: true
})

module.exports = Maintenance
