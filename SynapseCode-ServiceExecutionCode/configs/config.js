export const config = {
  node_env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3008,
  mongodb: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/synapsecode_execution',
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
  judge0: {
    api_url: process.env.JUDGE0_API_URL || 'https://judge0-ce.p.rapidapi.com',
    api_key: process.env.JUDGE0_API_KEY,
    api_host: process.env.JUDGE0_API_HOST || 'judge0-ce.p.rapidapi.com',
  },
  rate_limit: {
    window_ms: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    max_requests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  },
};

export default config;
