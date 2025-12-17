import { Router } from 'express';
import { authenticateBrainRequest, runBrainModel } from '../controllers/brain';

const brainRouter = Router();

/**
 * Brain API endpoints
 * These are public-facing endpoints that use project API tokens for authentication
 */

// Run AI model with service prompt
brainRouter.post('/v1/run', authenticateBrainRequest, runBrainModel);

export { brainRouter };
