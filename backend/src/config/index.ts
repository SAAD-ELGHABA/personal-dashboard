import dotenv from 'dotenv';
import path from 'path';

// Load .env from backend root directory
dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  mongo: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/dashboard',
  },
  n8n: {
    apiKey: process.env.N8N_API_KEY || '',
    baseUrl: process.env.N8N_BASE_URL || 'http://localhost:5678/api/v1',
  },
  portfolio: {
    baseUrl: process.env.PORTFOLIO_BASE_URL || 'http://localhost:3001/api',
  },
};
