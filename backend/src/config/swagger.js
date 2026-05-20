const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'RASA-CHAIN API',
      version: '1.0.0',
      description: 'Blockchain-based Herbal Supply Chain Traceability Platform API',
      contact: {
        name: 'RASA-CHAIN Team',
        email: 'api@rasa-chain.io',
      },
      license: {
        name: 'MIT',
      },
    },
    servers: [
      {
        url: 'https://rasa-chain-backend.onrender.com',
        description: 'Production Server',
      },
      {
        url: 'http://localhost:5000',
        description: 'Development Server',
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
            _id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            role: {
              type: 'string',
              enum: ['admin', 'farmer', 'manufacturer', 'lab', 'regulator', 'consumer'],
            },
            isVerified: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Batch: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            batchId: { type: 'string' },
            herbName: { type: 'string' },
            status: { type: 'string' },
            blockchainTxHash: { type: 'string' },
            qrCode: { type: 'string' },
          },
        },
        BlockchainLog: {
          type: 'object',
          properties: {
            txHash: { type: 'string' },
            eventType: { type: 'string' },
            batchId: { type: 'string' },
            timestamp: { type: 'string' },
            blockNumber: { type: 'number' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Batches', description: 'Product batch management' },
      { name: 'Blockchain', description: 'Blockchain records and explorer' },
      { name: 'QR', description: 'QR code generation' },
      { name: 'Verify', description: 'Public verification endpoints' },
      { name: 'Sensor', description: 'Future AI sensor integration' },
      { name: 'Reports', description: 'Compliance report generation' },
      { name: 'Dashboard', description: 'Dashboard statistics' },
      { name: 'Audit', description: 'Audit logs' },
    ],
  },
  apis: ['./src/routes/*.js'],
};

module.exports = swaggerJsdoc(options);
