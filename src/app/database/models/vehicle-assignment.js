const { DataTypes } = require('sequelize')
const connection = require('..')

const VehicleAssignment = connection.define('VehicleAssignment', {
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
    }
}, {
    tableName: 'vehicle_assignments',
    underscored: true
})

module.exports = VehicleAssignment
