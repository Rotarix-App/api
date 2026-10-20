const { DataTypes } = require('sequelize')
const connection = require('..')

const Photo = connection.define('Photo', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    kind: {
        type: DataTypes.ENUM('odometer', 'receipt', 'invoice'),
        allowNull: false
    },
    storageKey: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    mimeType: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    sizeBytes: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
    },
    uploadedBy: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    tableName: 'photos',
    underscored: true
})

module.exports = Photo
