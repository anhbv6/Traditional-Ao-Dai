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
