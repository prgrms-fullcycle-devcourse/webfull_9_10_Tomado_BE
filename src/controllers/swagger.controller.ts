import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import type { Router } from 'express';

const spec = swaggerJSDoc({
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Tomado API',
      version: '1.0.0',
    },
  },
  apis: ['src/**/*.ts'],
});

export function mountSwagger(router: Router) {
  router.use(swaggerUi.serve);
  router.get('/docs', swaggerUi.setup(spec));
}
