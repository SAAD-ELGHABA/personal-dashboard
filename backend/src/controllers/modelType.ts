import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { modelTypeService } from '../services/modelType';
import { ApiError } from '../middleware/errorHandler';

/**
 * Get all model types
 */
export const getModelTypes = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const modelTypes = await modelTypeService.getModelTypes(includeInactive);

    res.json({
      success: true,
      data: { modelTypes, count: modelTypes.length },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get model types by category
 */
export const getModelTypesByCategory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { category } = req.params;
    const includeInactive = req.query.includeInactive === 'true';

    const modelTypes = await modelTypeService.getModelTypesByCategory(
      category,
      includeInactive
    );

    res.json({
      success: true,
      data: { modelTypes, count: modelTypes.length },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single model type
 */
export const getModelType = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const modelType = await modelTypeService.getModelType(req.params.id);

    res.json({
      success: true,
      data: { modelType },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get model type with statistics
 */
export const getModelTypeWithStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await modelTypeService.getModelTypeWithStats(req.params.id);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new model type (Admin only)
 */
export const createModelType = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      key,
      name,
      description,
      category,
      icon,
      capabilities,
      requiresAuth,
      defaultMaxTokens,
      defaultTemperature,
      order,
    } = req.body;

    // Validation
    if (!key || !name || !description || !category) {
      throw new ApiError(400, 'Missing required fields: key, name, description, category');
    }

    const modelType = await modelTypeService.createModelType({
      key,
      name,
      description,
      category,
      icon,
      capabilities,
      requiresAuth,
      defaultMaxTokens,
      defaultTemperature,
      order,
    });

    res.status(201).json({
      success: true,
      data: { modelType },
      message: 'Model type created successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a model type (Admin only)
 */
export const updateModelType = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const modelType = await modelTypeService.updateModelType(
      req.params.id,
      req.body
    );

    res.json({
      success: true,
      data: { modelType },
      message: 'Model type updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a model type (Admin only)
 */
export const deleteModelType = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    await modelTypeService.deleteModelType(req.params.id);

    res.json({
      success: true,
      message: 'Model type deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update model type ordering (Admin only)
 */
export const updateModelTypeOrder = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { orders } = req.body;

    if (!Array.isArray(orders)) {
      throw new ApiError(400, 'Orders must be an array');
    }

    await modelTypeService.updateModelTypeOrder(orders);

    res.json({
      success: true,
      message: 'Model type order updated successfully',
    });
  } catch (error) {
    next(error);
  }
};
