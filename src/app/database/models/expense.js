const { DataTypes } = require('sequelize')
const connection = require('..')

const Expense = connection.define('Expense', {
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
    category: {
        type: DataTypes.ENUM('fuel', 'toll', 'food', 'tire_repair', 'urgent_maintenance'),
        allowNull: false
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    description: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    receiptPhotoId: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    tableName: 'expenses',
    underscored: true
})

module.exports = Expense
