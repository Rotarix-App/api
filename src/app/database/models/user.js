const { DataTypes } = require('sequelize')
const connection = require('..')

const User = connection.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    role: {
        type: DataTypes.ENUM('manager', 'driver'),
        allowNull: false
    },
    name: {
        type: DataTypes.STRING(120),
        allowNull: false
    },
    email: {
        type: DataTypes.STRING(160),
        allowNull: false
    },
    passwordHash: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    phone: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    cnhNumber: {
        type: DataTypes.STRING(11),
        allowNull: true
    },
    cnhCategory: {
        type: DataTypes.ENUM('B', 'C', 'D', 'E'),
        allowNull: true
    },
    fleetId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: 'active'
    }
}, {
    tableName: 'users',
    underscored: true,
    paranoid: true,
    defaultScope: {
        attributes: {
            exclude: ['passwordHash']
        }
    },
    scopes: {
        withPassword: {}
    }
})

module.exports = User
