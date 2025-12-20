import { app } from '../src/app';
import { connectDB } from '../src/config/database';
import { initializeData } from '../src/config/dataInitializer';
import { initializeModelTypes } from '../src/config/modelTypesInitializer';
import type { VercelRequest, VercelResponse } from '@vercel/node';

let isInitialized = false;
let initializationPromise: Promise<void> | null = null;

const initialize = async () => {
  if (isInitialized) return;
  
  if (initializationPromise) {
    return initializationPromise;
  }
  
  initializationPromise = (async () => {
    try {
      console.log('Initializing database connection...');
      await connectDB();
      console.log('Database connected successfully');
      
      console.log('Initializing data...');
      await initializeData();
      
      console.log('Initializing model types...');
      await initializeModelTypes();
      
      isInitialized = true;
      console.log('Initialization complete');
    } catch (error) {
      console.error('Initialization error:', error);
      initializationPromise = null; // Allow retry on next request
      throw error;
    }
  })();
  
  return initializationPromise;
};

// Export the Express app as a serverless function
export default async (req: VercelRequest, res: VercelResponse) => {
  try {
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
    try {
      await initialize();
    } catch (initError) {
      console.error('Failed to initialize:', initError);
      return res.status(503).json({ 
        success: false,
        message: 'Service temporarily unavailable - initialization failed',
        error: process.env.NODE_ENV === 'development' ? String(initError) : undefined
      });
    }
    
    // Handle the request with Express app
    return app(req as any, res as any);
  } catch (error) {
    console.error('Function error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? String(error) : undefined
    });
  }
};
