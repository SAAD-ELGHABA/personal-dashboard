import { Router } from 'express';
import { 
  authenticateBrainRequest, 
  runBrainModel,
  getCacheStats,
  clearCache,
  evaluateModels
} from '../controllers/brain';

const brainRouter = Router();

/**
 * Brain API endpoints
 * These are public-facing endpoints that use project API tokens for authentication
 */

// Run AI model with service prompt (uses intelligent load balancing)
brainRouter.post('/v1/run', authenticateBrainRequest, runBrainModel);

// Evaluate models for a specific type (debugging/monitoring)
brainRouter.post('/v1/models/evaluate', authenticateBrainRequest, evaluateModels);

// Get load balancer cache statistics (admin)
brainRouter.get('/v1/cache/stats', getCacheStats);

// Clear load balancer cache (admin)
brainRouter.post('/v1/cache/clear', clearCache);

export { brainRouter };
