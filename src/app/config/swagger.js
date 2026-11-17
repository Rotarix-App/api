const swaggerJsdoc = require('swagger-jsdoc')
const swaggerUi = require('swagger-ui-express')

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Rotarix API',
            version: '1.0.0',
            description: 'Documentação da API do Rotarix',
        },
        servers: [
            {
                url: `https://rotarix.xlucazzz.dev`,
                description: 'Servidor de produção',
            },
            {
                url: `http://localhost:3000`,
                description: 'Servidor de desenvolvimento',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
            schemas: {
                DriverInput: {
                    type: 'object',
                    required: [
                        'name',
                        'email',
                        'phone',
                        'cnhNumber',
                        'cnhCategory'
                    ],
                    properties: {
                        name: {
                            type: 'string',
                            minLength: 3,
                            maxLength: 120
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            maxLength: 160
                        },
                        phone: {
                            type: 'string',
                            pattern: '^[0-9]{10,11}$'
                        },
                        cnhNumber: {
                            type: 'string',
                            pattern: '^[0-9]{11}$'
                        },
                        cnhCategory: {
                            type: 'string',
                            enum: [
                                'B',
                                'C',
                                'D',
                                'E'
                            ]
                        }
                    }
                },
                DriverCreateInput: {
                    allOf: [
                        {
                            '$ref': '#/components/schemas/DriverInput'
                        },
                        {
                            type: 'object',
                            required: [
                                'password'
                            ],
                            properties: {
                                password: {
                                    type: 'string',
                                    format: 'password',
                                    minLength: 8,
                                    maxLength: 72,
                                    description: 'Temporary password, upper/lower case and a digit.'
                                }
                            }
                        }
                    ]
                },
                DriverStatusInput: {
                    type: 'object',
                    required: [
                        'status'
                    ],
                    properties: {
                        status: {
                            type: 'string',
                            enum: [
                                'active',
                                'inactive'
                            ]
                        }
                    }
                },
                DriverAssignmentInput: {
                    type: 'object',
                    required: [
                        'fleetId',
                        'vehicleIds'
                    ],
                    properties: {
                        fleetId: {
                            type: 'integer',
                            minimum: 1,
                            maximum: 2147483647
                        },
                        vehicleIds: {
                            type: 'array',
                            minItems: 1,
                            uniqueItems: true,
                            items: {
                                type: 'integer',
                                minimum: 1,
                                maximum: 2147483647
                            }
                        }
                    }
                },
                Driver: {
                    allOf: [
                        {
                            '$ref': '#/components/schemas/DriverInput'
                        },
                        {
                            type: 'object',
                            properties: {
                                id: {
                                    type: 'integer'
                                },
                                status: {
                                    type: 'string',
                                    enum: [
                                        'active',
                                        'inactive'
                                    ]
                                },
                                tripStatus: {
                                    type: 'string',
                                    description: 'in_progress while a trip is ongoing, even after deactivation; otherwise inactive or free.',
                                    enum: [
                                        'free',
                                        'in_progress',
                                        'inactive'
                                    ]
                                },
                                fleet: {
                                    type: 'object',
                                    nullable: true,
                                    properties: {
                                        id: {
                                            type: 'integer'
                                        },
                                        name: {
                                            type: 'string'
                                        },
                                        status: {
                                            type: 'string',
                                            enum: [
                                                'active',
                                                'inactive'
                                            ]
                                        }
                                    }
                                },
                                assignedVehicles: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            id: {
                                                type: 'integer'
                                            },
                                            plate: {
                                                type: 'string'
                                            },
                                            brand: {
                                                type: 'string'
                                            },
                                            model: {
                                                type: 'string'
                                            },
                                            status: {
                                                type: 'string',
                                                enum: [
                                                    'active',
                                                    'inactive'
                                                ]
                                            },
                                            tripStatus: {
                                                type: 'string',
                                                enum: [
                                                    'free',
                                                    'in_progress'
                                                ]
                                            }
                                        }
                                    }
                                },
                                createdAt: {
                                    type: 'string',
                                    format: 'date-time'
                                },
                                updatedAt: {
                                    type: 'string',
                                    format: 'date-time'
                                }
                            }
                        }
                    ]
                },
                FleetInput: {
                    type: 'object',
                    required: ['name', 'baseRegion'],
                    properties: {
                        name: { type: 'string', minLength: 1, maxLength: 100 },
                        baseRegion: { type: 'string', minLength: 1, maxLength: 120 },
                        description: { type: 'string', nullable: true, maxLength: 255 },
                    },
                },
                Fleet: {
                    allOf: [
                        { $ref: '#/components/schemas/FleetInput' },
                        {
                            type: 'object',
                            properties: {
                                id: { type: 'integer' },
                                managerId: { type: 'integer', description: 'Manager who created the fleet; only they can access it.' },
                                status: { type: 'string', enum: ['active', 'inactive'] },
                                createdAt: { type: 'string', format: 'date-time' },
                                updatedAt: { type: 'string', format: 'date-time' },
                            },
                        },
                    ],
                },
                FleetCard: {
                    allOf: [
                        { $ref: '#/components/schemas/Fleet' },
                        {
                            type: 'object',
                            properties: {
                                vehicleCount: { type: 'integer', minimum: 0 },
                                driverCount: { type: 'integer', minimum: 0 },
                                onTripCount: { type: 'integer', minimum: 0 },
                            },
                        },
                    ],
                },
                FleetDriverSummary: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        name: { type: 'string' },
                    },
                },
                FleetDriver: {
                    allOf: [
                        { $ref: '#/components/schemas/FleetDriverSummary' },
                        {
                            type: 'object',
                            properties: {
                                cnhCategory: { type: 'string', enum: ['B', 'C', 'D', 'E'], nullable: true },
                                status: { type: 'string', enum: ['active', 'inactive'] },
                                tripStatus: { type: 'string', enum: ['free', 'in_progress'] },
                            },
                        },
                    ],
                },
                FleetVehicle: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        plate: { type: 'string' },
                        brand: { type: 'string' },
                        model: { type: 'string' },
                        year: { type: 'integer' },
                        currentOdometer: { type: 'integer' },
                        status: { type: 'string', enum: ['active', 'inactive'] },
                        available: { type: 'boolean', description: 'Active vehicle, active fleet and no trip in progress.' },
                        tripStatus: { type: 'string', enum: ['free', 'in_progress'] },
                        tripDriver: {
                            allOf: [{ $ref: '#/components/schemas/FleetDriverSummary' }],
                            nullable: true,
                            description: 'Driver of the trip in progress, or null when the vehicle is free.',
                        },
                        assignedDrivers: { type: 'array', items: { $ref: '#/components/schemas/FleetDriverSummary' } },
                    },
                },
                VehicleInput: {
                    type: 'object',
                    required: ['plate', 'brand', 'model', 'year', 'currentOdometer', 'fleetId'],
                    properties: {
                        plate: { type: 'string', example: 'RTX4F21', description: 'Old or Mercosul format. Case, spaces and the hyphen are ignored.' },
                        brand: { type: 'string', minLength: 1, maxLength: 60 },
                        model: { type: 'string', minLength: 1, maxLength: 60 },
                        year: { type: 'integer', minimum: 1950 },
                        currentOdometer: { type: 'integer', minimum: 0, maximum: 9999999, description: 'Kilometers.' },
                        fleetId: { type: 'integer', description: 'A fleet of the signed-in manager.' },
                    },
                },
                Vehicle: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        plate: { type: 'string' },
                        brand: { type: 'string' },
                        model: { type: 'string' },
                        year: { type: 'integer' },
                        currentOdometer: { type: 'integer' },
                        status: { type: 'string', enum: ['active', 'inactive'] },
                        fleet: {
                            type: 'object',
                            properties: {
                                id: { type: 'integer' },
                                name: { type: 'string' },
                                status: { type: 'string', enum: ['active', 'inactive'] },
                            },
                        },
                        available: { type: 'boolean', description: 'Active vehicle, active fleet and no trip in progress.' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
                VehicleDetail: {
                    allOf: [
                        { $ref: '#/components/schemas/Vehicle' },
                        {
                            type: 'object',
                            properties: {
                                lastReading: {
                                    type: 'object',
                                    nullable: true,
                                    properties: {
                                        valueKm: { type: 'integer' },
                                        source: { type: 'string', enum: ['manual', 'trip_start', 'trip_end', 'refueling', 'maintenance'] },
                                        recordedAt: { type: 'string', format: 'date-time' },
                                        hasPhoto: { type: 'boolean' },
                                    },
                                },
                                serviceAlerts: { type: 'array', items: { $ref: '#/components/schemas/ServiceReminder' }, description: 'Pending reminders, nearest first.' },
                                trip: {
                                    type: 'object',
                                    nullable: true,
                                    properties: {
                                        id: { type: 'integer' },
                                        startedAt: { type: 'string', format: 'date-time' },
                                        driver: { $ref: '#/components/schemas/FleetDriverSummary' },
                                    },
                                },
                                assignedDrivers: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            id: { type: 'integer' },
                                            name: { type: 'string' },
                                            cnhCategory: { type: 'string', enum: ['B', 'C', 'D', 'E'], nullable: true },
                                            tripStatus: { type: 'string', enum: ['free', 'in_progress'] },
                                        },
                                    },
                                },
                            },
                        },
                    ],
                },
                Photo: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        kind: { type: 'string', enum: ['odometer', 'receipt', 'invoice'] },
                        mimeType: { type: 'string', enum: ['image/jpeg', 'image/png', 'image/webp'] },
                        sizeBytes: { type: 'integer' },
                        createdAt: { type: 'string', format: 'date-time' },
                    },
                },
                TripStartInput: {
                    type: 'object',
                    required: ['vehicleId', 'origin', 'destination', 'startOdometer', 'odometerPhotoId'],
                    properties: {
                        vehicleId: { type: 'integer', description: 'A vehicle assigned to the driver.' },
                        origin: { type: 'string', minLength: 2, maxLength: 120, example: 'Uberlândia, MG' },
                        destination: { type: 'string', minLength: 2, maxLength: 120, example: 'Santos, SP' },
                        startOdometer: { type: 'integer', minimum: 0, maximum: 9999999, example: 184302 },
                        odometerPhotoId: { type: 'integer', description: 'An unused odometer photo uploaded by the driver.' },
                    },
                },
                TripFinishInput: {
                    type: 'object',
                    required: ['endOdometer', 'odometerPhotoId'],
                    properties: {
                        endOdometer: { type: 'integer', minimum: 0, maximum: 9999999, example: 184941 },
                        odometerPhotoId: { type: 'integer', description: 'An unused odometer photo uploaded by the driver.' },
                        notes: { type: 'string', maxLength: 500, nullable: true, example: 'Trânsito intenso na Anchieta' },
                    },
                },
                Trip: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        status: { type: 'string', enum: ['in_progress', 'finished', 'cancelled'] },
                        origin: { type: 'string' },
                        destination: { type: 'string' },
                        vehicle: {
                            type: 'object',
                            properties: {
                                id: { type: 'integer' },
                                plate: { type: 'string' },
                                brand: { type: 'string' },
                                model: { type: 'string' },
                            },
                        },
                        startOdometer: { type: 'integer' },
                        endOdometer: { type: 'integer', nullable: true },
                        distanceKm: { type: 'integer', nullable: true, description: 'Null until the trip is finished.' },
                        durationMinutes: { type: 'integer', description: 'Elapsed time so far while the trip is in progress.' },
                        notes: { type: 'string', nullable: true },
                        startPhotoId: { type: 'integer', nullable: true },
                        endPhotoId: { type: 'integer', nullable: true },
                        startedAt: { type: 'string', format: 'date-time' },
                        endedAt: { type: 'string', format: 'date-time', nullable: true },
                    },
                },
                TripDetail: {
                    allOf: [
                        { $ref: '#/components/schemas/Trip' },
                        {
                            type: 'object',
                            properties: {
                                records: {
                                    type: 'array',
                                    description: 'Expenses, refuelings and maintenances linked to the trip, newest first.',
                                    items: { $ref: '#/components/schemas/Record' },
                                },
                                summary: {
                                    type: 'object',
                                    properties: {
                                        totalExpenses: { type: 'number', example: 1502.7, description: 'Expenses, refuelings and maintenances.' },
                                        costPerKm: { type: 'number', nullable: true, example: 2.35, description: 'Null until the trip has a distance.' },
                                        receiptCount: { type: 'integer' },
                                        odometerPhotoCount: { type: 'integer', description: 'Start and end odometer photos.' },
                                    },
                                },
                            },
                        },
                    ],
                },
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        role: { type: 'string', enum: ['manager', 'driver'] },
                        name: { type: 'string', example: 'Marcos Carvalho' },
                        email: { type: 'string', format: 'email', example: 'marcos@transcarvalho.com.br' },
                        phone: { type: 'string', nullable: true, example: '34998124471' },
                        cnhNumber: { type: 'string', nullable: true, example: null },
                        cnhCategory: { type: 'string', enum: ['B', 'C', 'D', 'E'], nullable: true, example: null },
                        status: { type: 'string', enum: ['active', 'inactive'] },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
                RecordVehicle: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        plate: { type: 'string' },
                        brand: { type: 'string' },
                        model: { type: 'string' },
                    },
                },
                RecordTrip: {
                    type: 'object',
                    nullable: true,
                    properties: {
                        id: { type: 'integer' },
                        origin: { type: 'string' },
                        destination: { type: 'string' },
                        status: { type: 'string', enum: ['in_progress', 'finished', 'cancelled'] },
                    },
                },
                ExpenseInput: {
                    type: 'object',
                    required: ['category', 'amount'],
                    properties: {
                        vehicleId: { type: 'integer', description: 'Required outside a trip; ignored during one.' },
                        category: { type: 'string', enum: ['toll', 'food', 'tire_repair', 'urgent_maintenance'] },
                        amount: { type: 'number', minimum: 0.01, example: 48.3 },
                        description: { type: 'string', maxLength: 255, nullable: true },
                        receiptPhotoId: { type: 'integer', nullable: true, description: 'An unused receipt photo uploaded by the driver.' },
                    },
                },
                ExpenseUpdateInput: {
                    type: 'object',
                    required: ['category', 'amount'],
                    properties: {
                        category: { type: 'string', enum: ['toll', 'food', 'tire_repair', 'urgent_maintenance'] },
                        amount: { type: 'number', minimum: 0.01 },
                        description: { type: 'string', maxLength: 255, nullable: true },
                        receiptPhotoId: { type: 'integer', nullable: true, description: 'Omit to keep the receipt, null to remove it.' },
                    },
                },
                RefuelingInput: {
                    type: 'object',
                    required: ['liters', 'pricePerLiter', 'odometer', 'gasStation', 'odometerPhotoId'],
                    properties: {
                        vehicleId: { type: 'integer', description: 'Required outside a trip; ignored during one.' },
                        liters: { type: 'number', minimum: 0.01, maximum: 9999.99, example: 220 },
                        pricePerLiter: { type: 'number', minimum: 0.001, maximum: 99.999, example: 6.42 },
                        odometer: { type: 'integer', minimum: 0, maximum: 9999999 },
                        gasStation: { type: 'string', maxLength: 120 },
                        odometerPhotoId: { type: 'integer' },
                        invoicePhotoId: { type: 'integer', nullable: true },
                    },
                },
                MaintenanceInput: {
                    type: 'object',
                    required: ['type', 'service', 'amount', 'workshop', 'odometer', 'odometerPhotoId'],
                    properties: {
                        vehicleId: { type: 'integer', description: 'Required outside a trip; ignored during one.' },
                        type: { type: 'string', enum: ['preventive', 'corrective', 'urgent'] },
                        service: { type: 'string', maxLength: 255 },
                        amount: { type: 'number', minimum: 0.01 },
                        workshop: { type: 'string', maxLength: 120 },
                        odometer: { type: 'integer', minimum: 0, maximum: 9999999 },
                        odometerPhotoId: { type: 'integer' },
                        invoicePhotoId: { type: 'integer', nullable: true },
                    },
                },
                Record: {
                    type: 'object',
                    description: 'An expense, refueling or maintenance. Refuelings use category fuel and maintenances urgent_maintenance. driver is present only in manager views.',
                    properties: {
                        type: { type: 'string', enum: ['expense', 'refueling', 'maintenance'] },
                        id: { type: 'integer' },
                        category: { type: 'string', enum: ['fuel', 'toll', 'food', 'tire_repair', 'urgent_maintenance'] },
                        amount: { type: 'number' },
                        hasReceipt: { type: 'boolean' },
                        vehicle: { allOf: [{ $ref: '#/components/schemas/RecordVehicle' }], nullable: true },
                        trip: { $ref: '#/components/schemas/RecordTrip' },
                        driver: { $ref: '#/components/schemas/FleetDriverSummary' },
                        createdAt: { type: 'string', format: 'date-time' },
                    },
                },
                Expense: {
                    allOf: [
                        { $ref: '#/components/schemas/Record' },
                        {
                            type: 'object',
                            properties: {
                                description: { type: 'string', nullable: true },
                                receiptPhotoId: { type: 'integer', nullable: true },
                                updatedAt: { type: 'string', format: 'date-time' },
                            },
                        },
                    ],
                },
                Refueling: {
                    allOf: [
                        { $ref: '#/components/schemas/Record' },
                        {
                            type: 'object',
                            properties: {
                                liters: { type: 'number' },
                                pricePerLiter: { type: 'number' },
                                gasStation: { type: 'string' },
                                odometer: { type: 'integer' },
                                odometerPhotoId: { type: 'integer' },
                                invoicePhotoId: { type: 'integer', nullable: true },
                            },
                        },
                    ],
                },
                Maintenance: {
                    allOf: [
                        { $ref: '#/components/schemas/Record' },
                        {
                            type: 'object',
                            properties: {
                                maintenanceType: { type: 'string', enum: ['preventive', 'corrective', 'urgent'] },
                                service: { type: 'string' },
                                workshop: { type: 'string' },
                                odometer: { type: 'integer' },
                                odometerPhotoId: { type: 'integer' },
                                invoicePhotoId: { type: 'integer', nullable: true },
                            },
                        },
                    ],
                },
                CategoryTotals: {
                    type: 'object',
                    properties: {
                        fuel: { type: 'number' },
                        toll: { type: 'number' },
                        food: { type: 'number' },
                        tire_repair: { type: 'number' },
                        urgent_maintenance: { type: 'number' },
                    },
                },
                Spending: {
                    type: 'object',
                    properties: {
                        month: { type: 'string', example: '2026-11' },
                        total: { type: 'number' },
                        byCategory: { $ref: '#/components/schemas/CategoryTotals' },
                        expenses: { type: 'array', items: { $ref: '#/components/schemas/Expense' } },
                        refuelings: { type: 'array', items: { $ref: '#/components/schemas/Refueling' } },
                        maintenances: { type: 'array', items: { $ref: '#/components/schemas/Maintenance' } },
                    },
                },
                ServiceReminderInput: {
                    type: 'object',
                    required: ['title', 'dueOdometer'],
                    properties: {
                        title: { type: 'string', maxLength: 60, example: 'Revisão' },
                        dueOdometer: { type: 'integer', minimum: 0, maximum: 9999999, example: 190000 },
                        intervalKm: { type: 'integer', minimum: 1, maximum: 1000000, nullable: true, example: 10000 },
                    },
                },
                ServiceReminder: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        title: { type: 'string' },
                        dueOdometer: { type: 'integer' },
                        intervalKm: { type: 'integer', nullable: true },
                        remainingKm: { type: 'integer', nullable: true, description: 'Negative when overdue; null once completed.' },
                        overdue: { type: 'boolean' },
                        completedAt: { type: 'string', format: 'date-time', nullable: true },
                        completedMaintenanceId: { type: 'integer', nullable: true },
                        vehicle: { $ref: '#/components/schemas/RecordVehicle' },
                    },
                },
                DriverVehicle: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        plate: { type: 'string' },
                        brand: { type: 'string' },
                        model: { type: 'string' },
                        year: { type: 'integer' },
                        currentOdometer: { type: 'integer' },
                        fleet: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' } } },
                        tripStatus: { type: 'string', enum: ['free', 'on_trip', 'unavailable', 'inactive'] },
                        trip: {
                            type: 'object',
                            nullable: true,
                            properties: {
                                id: { type: 'integer', nullable: true, description: 'Only for the driver own trip.' },
                                startedAt: { type: 'string', format: 'date-time' },
                                driver: { $ref: '#/components/schemas/FleetDriverSummary' },
                            },
                        },
                        serviceAlert: { allOf: [{ $ref: '#/components/schemas/ServiceReminder' }], nullable: true },
                    },
                },
                DriverVehicleDetail: {
                    allOf: [
                        { $ref: '#/components/schemas/DriverVehicle' },
                        {
                            type: 'object',
                            properties: {
                                lastReading: {
                                    type: 'object',
                                    nullable: true,
                                    properties: {
                                        valueKm: { type: 'integer' },
                                        source: { type: 'string', enum: ['manual', 'trip_start', 'trip_end', 'refueling', 'maintenance'] },
                                        recordedAt: { type: 'string', format: 'date-time' },
                                        hasPhoto: { type: 'boolean' },
                                        photoId: { type: 'integer', nullable: true },
                                    },
                                },
                                serviceAlerts: { type: 'array', items: { $ref: '#/components/schemas/ServiceReminder' } },
                                recentTrips: { type: 'array', items: { $ref: '#/components/schemas/Trip' } },
                                recentRefuelings: { type: 'array', items: { $ref: '#/components/schemas/Refueling' } },
                            },
                        },
                    ],
                },
                ActivityTrip: {
                    allOf: [
                        { $ref: '#/components/schemas/Trip' },
                        { type: 'object', properties: { driver: { $ref: '#/components/schemas/FleetDriverSummary' } } },
                    ],
                },
                ActivityExpenses: {
                    type: 'object',
                    properties: {
                        total: { type: 'number' },
                        byCategory: { $ref: '#/components/schemas/CategoryTotals' },
                        items: { type: 'array', items: { $ref: '#/components/schemas/Record' } },
                    },
                },
                ActivityMaintenances: {
                    type: 'object',
                    properties: {
                        total: { type: 'number' },
                        items: { type: 'array', items: { $ref: '#/components/schemas/Maintenance' } },
                    },
                },
                Metrics: {
                    type: 'object',
                    properties: {
                        period: { type: 'object', properties: { from: { type: 'string', format: 'date-time' }, to: { type: 'string', format: 'date-time' } } },
                        spend: {
                            type: 'object',
                            properties: {
                                total: { type: 'number' },
                                byCategory: { $ref: '#/components/schemas/CategoryTotals' },
                                previousTotal: { type: 'number' },
                                changePercent: { type: 'number', nullable: true, description: 'Null when the previous period had no spend.' },
                            },
                        },
                        trips: { type: 'integer' },
                        km: { type: 'integer' },
                        costPerKm: { type: 'number', nullable: true },
                        spendSeries: {
                            type: 'array',
                            description: '5-day buckets.',
                            items: { type: 'object', properties: { from: { type: 'string', format: 'date-time' }, to: { type: 'string', format: 'date-time' }, total: { type: 'number' } } },
                        },
                        vehicles: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    vehicle: { $ref: '#/components/schemas/RecordVehicle' },
                                    total: { type: 'number' },
                                    km: { type: 'integer' },
                                    costPerKm: { type: 'number', nullable: true },
                                },
                            },
                        },
                        alerts: { type: 'array', items: { $ref: '#/components/schemas/ServiceReminder' } },
                    },
                },
                UserResponse: {
                    type: 'object',
                    properties: {
                        error: { type: 'boolean', example: false },
                        message: { type: 'string' },
                        data: { $ref: '#/components/schemas/User' },
                    },
                },
                AuthResponse: {
                    type: 'object',
                    properties: {
                        error: { type: 'boolean', example: false },
                        message: { type: 'string' },
                        data: {
                            type: 'object',
                            properties: {
                                token: { type: 'string', description: 'JWT, valid for 7 days' },
                                user: { $ref: '#/components/schemas/User' },
                            },
                        },
                    },
                },
                Error: {
                    type: 'object',
                    properties: {
                        error: { type: 'boolean', example: true },
                        message: { type: 'string' },
                        id: { type: 'string' },
                    },
                },
            },
        },
    },
    apis: ['./src/app/routes/*.js'],
}

const swaggerSpec = swaggerJsdoc(options)

function setupSwagger(app) {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
}

module.exports = setupSwagger
