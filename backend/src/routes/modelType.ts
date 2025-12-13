import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as modelTypeController from '../controllers/modelType';

export const modelTypeRouter = Router();

// Apply authentication middleware to all routes
modelTypeRouter.use(authenticate);

// Public routes (all authenticated users can view)
modelTypeRouter.get('/', modelTypeController.getModelTypes);
modelTypeRouter.get('/category/:category', modelTypeController.getModelTypesByCategory);
modelTypeRouter.get('/:id', modelTypeController.getModelType);
modelTypeRouter.get('/:id/stats', modelTypeController.getModelTypeWithStats);

// Admin routes (create, update, delete)
modelTypeRouter.use(authorize('admin', 'super_admin'));

modelTypeRouter.post('/', modelTypeController.createModelType);
modelTypeRouter.put('/:id', modelTypeController.updateModelType);
modelTypeRouter.delete('/:id', modelTypeController.deleteModelType);
modelTypeRouter.post('/reorder', modelTypeController.updateModelTypeOrder);
