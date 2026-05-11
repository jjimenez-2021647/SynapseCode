export const config = {
  node_env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3002,
  postgresql: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'synapsecode_rooms',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your_jwt_secret_key',
    issuer: process.env.JWT_ISSUER || 'SynapseCode',
    audience: process.env.JWT_AUDIENCE || 'SynapseCode-Users',
  },
  auth_service: {
    url: process.env.AUTH_SERVICE_URL || 'http://localhost:3006',
  },
  plans_service: {
    url: process.env.PLANS_SERVICE_URL || 'http://localhost:3013',
  },
  rate_limit: {
    window_ms: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    max_requests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  },
};

export default config;
