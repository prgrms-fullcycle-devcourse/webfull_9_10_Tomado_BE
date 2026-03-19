import { Router } from 'express';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const spec = swaggerJSDoc({
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Tomado API',
      version: '0.1.0',
    },
  },
  apis: ['src/**/*.ts'],
});

export const swaggerRouter = Router().use(swaggerUi.serve).get('/', swaggerUi.setup(spec));
