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
  // Ensure initialization before handling requests
  await initialize();
  
  // Handle the request
  return app(req, res);
};
