const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Classroom Analytics API',
            version: '1.0.0',
            description: 'API documentation for Classroom Analytics System'
        },
        servers: [
            {
                url: 'http://localhost:3000/api',
                description: 'Development server'
            }
        ]
    },
    apis: ['./src/routes/*.js'], // Path to the API routes
};

const specs = swaggerJsdoc(options);

// Curriculum API Documentation
/**
 * @swagger
 * /curriculum:
 *   get:
 *     summary: Get all curricula for an institution
 *     tags: [Curriculum]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of curricula
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     curricula:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Curriculum'
 * 
 *   post:
 *     summary: Create a new curriculum
 *     tags: [Curriculum]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CurriculumInput'
 */ 