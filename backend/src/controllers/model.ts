import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { modelService } from '../services/model';
import { ApiError } from '../middleware/errorHandler';

/**
 * Get all models with optional filters
 */
export const getModels = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { typeId, provider, status, isPublic, projectId, tags } = req.query;

    const filters: any = {};
    if (typeId) filters.typeId = typeId as string;
    if (provider) filters.provider = provider as string;
    if (status) filters.status = status as string;
    if (isPublic !== undefined) filters.isPublic = isPublic === 'true';
    if (projectId) filters.projectId = projectId as string;
    if (tags) filters.tags = (tags as string).split(',');

    const models = await modelService.getModels(filters);

    res.json({
      success: true,
      data: { models, count: models.length },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single model by ID
 */
export const getModel = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const model = await modelService.getModelById(req.params.id);

    res.json({
      success: true,
      data: { model },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new model
 */
export const createModel = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      name,
      typeId,
      version,
      provider,
      endpoint,
      apiKey,
      priority,
      weight,
      maxRequestsPerMinute,
      maxConcurrentRequests,
      timeoutSeconds,
      retryAttempts,
      retryDelayMs,
      costPerRequest,
      expirationDate,
      tags,
      metadata,
      projectsAssigned,
      isPublic,
      requiresApproval,
    } = req.body;

    // Validation
    if (!name || !typeId || !version || !provider || !endpoint || !apiKey) {
      throw new ApiError(400, 'Missing required fields');
    }

    const model = await modelService.createModel({
      name,
      typeId,
      version,
      provider,
      endpoint,
      apiKey,
      priority,
      weight,
      maxRequestsPerMinute,
      maxConcurrentRequests,
      timeoutSeconds,
      retryAttempts,
      retryDelayMs,
      costPerRequest,
      expirationDate,
      tags,
      metadata,
      projectsAssigned,
      isPublic,
      requiresApproval,
    });

    res.status(201).json({
      success: true,
      data: { model },
      message: 'Model created successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a model
 */
export const updateModel = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const model = await modelService.updateModel(req.params.id, req.body);

    res.json({
      success: true,
      data: { model },
      message: 'Model updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a model
 */
export const deleteModel = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    await modelService.deleteModel(req.params.id);

    res.json({
      success: true,
      message: 'Model deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get model health and statistics
 */
export const getModelHealth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const healthData = await modelService.getModelHealth(req.params.id);

    res.json({
      success: true,
      data: healthData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Test model connection
 */
export const testModelConnection = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await modelService.testModelConnection(req.params.id);

    res.json({
      success: result.success,
      data: result,
      message: result.success ? 'Connection test passed' : 'Connection test failed',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get available models for a model type
 */
export const getAvailableModels = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { typeId } = req.params;
    const { projectId } = req.query;

    const models = await modelService.getAvailableModelsForType(
      typeId,
      projectId as string | undefined
    );

    res.json({
      success: true,
      data: { models, count: models.length },
    });
  } catch (error) {
    next(error);
  }
};
