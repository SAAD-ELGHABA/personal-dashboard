import express from 'express';
import {
  createService,
  getProjectServices,
  getServiceById,
  updateService,
  deleteService,
  getServiceHealthHistory,
  getServicePerformanceHistory,
  testServiceHealth,
} from '../controllers/service';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Service CRUD operations
router.post('/', createService);
router.get('/project/:projectId', getProjectServices);
router.get('/:serviceId', getServiceById);
router.put('/:serviceId', updateService);
router.delete('/:serviceId', deleteService);

// Service monitoring data
router.get('/:serviceId/health-history', getServiceHealthHistory);
router.get('/:serviceId/performance-history', getServicePerformanceHistory);

// Test service health
router.post('/:serviceId/test-health', testServiceHealth);

export default router;
