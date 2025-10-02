import { app } from './app';
import { connectDB } from './config/database';
import { config } from './config';

const PORT = config.port || 5000;

const startServer = async () => {
  try {
    await connectDB();
    
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${config.nodeEnv}`);
    });

    const shutdown = () => {
      console.log('Shutting down server...');
      server.close(() => {
        console.log('Server has been shut down');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
