export const config = {
  node_env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3013,
  mongodb: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/synapsecode_plans',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your_jwt_secret_key',
    issuer: process.env.JWT_ISSUER || 'SynapseCode',
    audience: process.env.JWT_AUDIENCE || 'SynapseCode-Users',
  },
  auth_service: {
    url: process.env.AUTH_SERVICE_URL || 'http://localhost:3006',
  },
  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    username: process.env.SMTP_USERNAME,
    password: process.env.SMTP_PASSWORD,
    from_email: process.env.SMTP_FROM_EMAIL || 'noreply@synapsecode.com',
    frontend_url: process.env.FRONTEND_URL || 'http://localhost:3000',
  },
  service_url: process.env.SERVICE_PLANS_URL || 'http://localhost:3013',
  stripe: {
    secret_key: process.env.STRIPE_SECRET_KEY,
    public_key: process.env.STRIPE_PUBLIC_KEY,
    webhook_secret: process.env.STRIPE_WEBHOOK_SECRET,
  },
  plans: {
    free: {
      price: parseInt(process.env.PLAN_FREE_PRICE || '0'),
      name: 'FREE',
      active_rooms_limit: 3,
      users_per_room: 5,
      code_executions_limit: 50,
      chat_history_limit: 100,
      ai_explanations_limit: 10,
    },
    pro: {
      price: parseInt(process.env.PLAN_PRO_PRICE || '2000'),
      name: 'PRO',
      active_rooms_limit: null,
      users_per_room: 20,
      code_executions_limit: null,
      chat_history_limit: null,
      ai_explanations_limit: 20,
    },
    org: {
      price: parseInt(process.env.PLAN_ORG_PRICE || '5000'),
      name: 'ORG',
      active_rooms_limit: null,
      users_per_room: null,
      code_executions_limit: null,
      chat_history_limit: null,
      ai_explanations_limit: null,
    },
  },
  rate_limit: {
    window_ms: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    max_requests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  },
};

export default config;
