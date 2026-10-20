require('..')

module.exports = {
    User: require('./user'),
    Fleet: require('./fleet'),
    Vehicle: require('./vehicle'),
    VehicleAssignment: require('./vehicle-assignment'),
    Photo: require('./photo'),
    OdometerReading: require('./odometer-reading'),
    Trip: require('./trip'),
    Expense: require('./expense'),
    Refueling: require('./refueling'),
    Maintenance: require('./maintenance'),
    ServiceReminder: require('./service-reminder')
}
