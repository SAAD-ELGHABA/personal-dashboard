import { app } from '../src/app';
import { connectDB } from '../src/config/database';
import { initializeData } from '../src/config/dataInitializer';
import { initializeModelTypes } from '../src/config/modelTypesInitializer';

let isInitialized = false;

const initialize = async () => {
  if (!isInitialized) {
    try {
      await connectDB();
      await initializeData();
      await initializeModelTypes();
      isInitialized = true;
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      // Don't throw - let requests continue even if init fails
    }
  }
};

// Initialize on cold start
initialize().catch(console.error);

// Export the Express app as a serverless function
export default async (req: any, res: any) => {
  // Set CORS headers explicitly for Vercel
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Ensure initialization before handling requests
  await initialize();
  
  // Handle the request
  return app(req, res);
};
