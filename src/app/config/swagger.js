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
                DriverDeleteInput: {
                    type: 'object',
                    required: [
                        'confirmation'
                    ],
                    properties: {
                        confirmation: {
                            type: 'string',
                            enum: [
                                'EXCLUIR'
                            ]
                        }
                    }
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
