import swaggerJSDoc from 'swagger-jsdoc'
import { env } from './env'

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AODAI Ecommerce API Documentation',
      version: '1.0.0',
      description: 'API specifications for AODAI ecommerce monolith backend application.',
      contact: {
        name: 'AODAI Tech Team',
        email: 'tech@aodai.vn',
      },
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token in the format Bearer <token>',
        },
      },
      schemas: {
        ApiSuccess: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'success' },
            statusCode: { type: 'integer', example: 200 },
            message: { type: 'string', example: 'OK' },
          },
        },
        ApiError: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'error' },
            statusCode: { type: 'integer', example: 400 },
            message: { type: 'string', example: 'Validation error' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string', example: 'receiverPhone' },
                  message: { type: 'string', example: 'RECEIVER_PHONE_INVALID' },
                },
              },
            },
          },
        },
        UserAddress: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            receiverName: { type: 'string' },
            receiverPhone: { type: 'string' },
            addressLine: { type: 'string' },
            provinceCode: { type: 'string', nullable: true },
            provinceName: { type: 'string' },
            districtCode: { type: 'string', nullable: true },
            districtName: { type: 'string' },
            wardCode: { type: 'string', nullable: true },
            wardName: { type: 'string' },
            postalCode: { type: 'string', nullable: true },
            label: { type: 'string', nullable: true },
            isDefault: { type: 'boolean' },
            userId: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateUserAddressRequest: {
          type: 'object',
          required: ['receiverName', 'receiverPhone', 'addressLine', 'provinceName', 'districtName', 'wardName'],
          properties: {
            receiverName: { type: 'string', minLength: 1 },
            receiverPhone: { type: 'string', pattern: '^(0|\\+84)[35789][0-9]{8}$' },
            addressLine: { type: 'string', minLength: 1 },
            provinceCode: { type: 'string', nullable: true },
            provinceName: { type: 'string', minLength: 1 },
            districtCode: { type: 'string', nullable: true },
            districtName: { type: 'string', minLength: 1 },
            wardCode: { type: 'string', nullable: true },
            wardName: { type: 'string', minLength: 1 },
            postalCode: { type: 'string', nullable: true },
            label: { type: 'string', nullable: true },
            isDefault: { type: 'boolean' },
          },
        },
        UpdateUserAddressRequest: {
          type: 'object',
          properties: {
            receiverName: { type: 'string', minLength: 1 },
            receiverPhone: { type: 'string', pattern: '^(0|\\+84)[35789][0-9]{8}$' },
            addressLine: { type: 'string', minLength: 1 },
            provinceCode: { type: 'string', nullable: true },
            provinceName: { type: 'string', minLength: 1 },
            districtCode: { type: 'string', nullable: true },
            districtName: { type: 'string', minLength: 1 },
            wardCode: { type: 'string', nullable: true },
            wardName: { type: 'string', minLength: 1 },
            postalCode: { type: 'string', nullable: true },
            label: { type: 'string', nullable: true },
            isDefault: { type: 'boolean' },
          },
        },
      },
    },
  },
  // Paths to files containing OpenAPI definitions (both js/ts extensions)
  apis: [
    './src/index.ts',
    './src/routes.ts',
    './src/modules/**/*.routes.ts',
    './src/modules/**/*.schema.ts',
    // Dist versions (for production build compatibility)
    './dist/index.js',
    './dist/routes.js',
    './dist/modules/**/*.routes.js',
    './dist/modules/**/*.schema.js',
  ],
}

export const swaggerSpec = swaggerJSDoc(options)
