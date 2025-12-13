import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as apiController from '../controllers/api';
import { projectRouter } from './project';
import { modelRouter } from './model';
import { modelTypeRouter } from './modelType';

export const apiRouter = Router();

// Apply authentication middleware to all API routes
apiRouter.use(authenticate);

// API Token Management
apiRouter
  .route('/tokens')
  .get(apiController.getApiTokens)
  .post(apiController.createApiToken);

apiRouter
  .route('/tokens/:id')
  .get(apiController.getApiToken)
  .delete(apiController.revokeApiToken);

// n8n Stats
apiRouter.get('/stats/n8n', apiController.getN8nStats);

// Portfolio Stats
apiRouter.get('/stats/portfolio', apiController.getPortfolioStats);

// Project Management Routes
apiRouter.use('/projects', projectRouter);

// Model Registry Routes
apiRouter.use('/models', modelRouter);
apiRouter.use('/model-types', modelTypeRouter);

// Admin routes
apiRouter.use(authorize('admin'));

// Admin dashboard stats
apiRouter.get('/admin/stats', apiController.getAdminStats);
