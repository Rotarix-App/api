const { DataTypes } = require('sequelize')
const connection = require('..')

const Vehicle = connection.define('Vehicle', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    fleetId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    plate: {
        type: DataTypes.STRING(7),
        allowNull: false
    },
    brand: {
        type: DataTypes.STRING(60),
        allowNull: false
    },
    model: {
        type: DataTypes.STRING(60),
        allowNull: false
    },
    year: {
        type: DataTypes.SMALLINT.UNSIGNED,
        allowNull: false
    },
    currentOdometer: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: 'active'
    }
}, {
    tableName: 'vehicles',
    underscored: true,
    paranoid: true
})

module.exports = Vehicle
