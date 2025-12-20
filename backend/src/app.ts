import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './middleware/errorHandler';
import { authRouter } from './routes/auth';
import { apiRouter } from './routes/api';
import { brainRouter } from './routes/brain';
import { config } from './config';

const app = express();

// Middleware
app.use(helmet());

// CORS Configuration - Open for all origins (external projects + mobile apps)
app.use(cors({
  origin: '*', // Allow all origins for external project access
  credentials: false, // Set to false when using wildcard origin
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRouter);
app.use('/api', apiRouter);
app.use('/brain', brainRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Not Found' });
});

export { app };
