import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as projectController from '../controllers/project';

export const projectRouter = Router();

// Apply authentication middleware to all project routes
projectRouter.use(authenticate);

// Get available model types (all authenticated users)
projectRouter.get('/model-types', projectController.getModelTypes);

// Project CRUD operations (admin and super_admin only)
projectRouter.use(authorize('admin', 'super_admin'));

projectRouter
  .route('/')
  .get(projectController.getProjects)
  .post(projectController.createProject);

projectRouter
  .route('/:id')
  .get(projectController.getProject)
  .put(projectController.updateProject)
  .delete(projectController.deleteProject);

// Project settings management
projectRouter.put('/:id/settings', projectController.updateProjectSettings);

// API token regeneration
projectRouter.post('/:id/regenerate-token', projectController.regenerateApiToken);
