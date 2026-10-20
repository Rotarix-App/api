const { DataTypes } = require('sequelize')
const connection = require('..')

const Refueling = connection.define('Refueling', {
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
    liters: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: false
    },
    pricePerLiter: {
        type: DataTypes.DECIMAL(8, 3),
        allowNull: false
    },
    totalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    gasStation: {
        type: DataTypes.STRING(120),
        allowNull: false
    },
    invoicePhotoId: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    tableName: 'refuelings',
    underscored: true
})

module.exports = Refueling
