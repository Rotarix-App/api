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
                        fleetId: { type: 'integer', nullable: true, example: null },
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
