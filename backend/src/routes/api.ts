import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as apiController from '../controllers/api';

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

// Admin routes
apiRouter.use(authorize('admin'));

// Admin dashboard stats
apiRouter.get('/admin/stats', apiController.getAdminStats);
