import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as modelController from '../controllers/model';

export const modelRouter = Router();

// Apply authentication middleware to all routes
modelRouter.use(authenticate);

// Public routes (authenticated users can view)
modelRouter.get('/', modelController.getModels);
modelRouter.get('/:id', modelController.getModel);
modelRouter.get('/:id/health', modelController.getModelHealth);
modelRouter.get('/type/:typeId/available', modelController.getAvailableModels);

// Admin routes (create, update, delete, test)
modelRouter.use(authorize('admin', 'super_admin'));

modelRouter.post('/', modelController.createModel);
modelRouter.put('/:id', modelController.updateModel);
modelRouter.delete('/:id', modelController.deleteModel);
modelRouter.post('/:id/test', modelController.testModelConnection);
