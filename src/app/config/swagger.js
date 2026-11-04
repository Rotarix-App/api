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
                        tripStatus: { type: 'string', enum: ['free', 'in_progress'] },
                        tripDriver: {
                            allOf: [{ $ref: '#/components/schemas/FleetDriverSummary' }],
                            nullable: true,
                            description: 'Driver of the trip in progress, or null when the vehicle is free.',
                        },
                        assignedDrivers: { type: 'array', items: { $ref: '#/components/schemas/FleetDriverSummary' } },
                    },
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
