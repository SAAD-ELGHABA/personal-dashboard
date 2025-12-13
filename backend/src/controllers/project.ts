import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { projectService } from '../services/project';
import { ApiError } from '../middleware/errorHandler';

/**
 * Get all projects for the authenticated user
 */
export const getProjects = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const projects = await projectService.getProjectsByOwner(
      req.user.userId,
      includeInactive
    );

    res.json({
      success: true,
      data: { projects },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single project by ID
 */
export const getProject = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { project, settings } = await projectService.getProjectById(
      req.params.id,
      req.user.userId
    );

    res.json({
      success: true,
      data: { project, settings },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new project
 */
export const createProject = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, url, description, modelTypesAllowed, maxRequestSize } = req.body;

    // Validation
    if (!name || name.trim().length === 0) {
      throw new ApiError(400, 'Project name is required');
    }

    if (!url || url.trim().length === 0) {
      throw new ApiError(400, 'Project URL is required');
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      throw new ApiError(400, 'Invalid URL format');
    }

    if (!modelTypesAllowed || !Array.isArray(modelTypesAllowed) || modelTypesAllowed.length === 0) {
      throw new ApiError(400, 'At least one model type must be selected');
    }

    const result = await projectService.createProject({
      name: name.trim(),
      url: url.trim().toLowerCase(),
      description: description?.trim(),
      modelTypesAllowed,
      ownerId: req.user.userId,
      maxRequestSize,
    });

    res.status(201).json({
      success: true,
      data: {
        project: result.project,
        apiToken: result.apiToken,
        settings: result.settings,
      },
      message: 'Project created successfully. Save the API token securely, it will not be shown again.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update project details
 */
export const updateProject = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, url, description, modelTypesAllowed } = req.body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (url !== undefined) {
      // Validate URL if provided
      try {
        new URL(url);
        updateData.url = url.trim().toLowerCase();
      } catch {
        throw new ApiError(400, 'Invalid URL format');
      }
    }
    if (description !== undefined) updateData.description = description.trim();
    if (modelTypesAllowed !== undefined) updateData.modelTypesAllowed = modelTypesAllowed;

    if (Object.keys(updateData).length === 0) {
      throw new ApiError(400, 'No update data provided');
    }

    const project = await projectService.updateProject(
      req.params.id,
      req.user.userId,
      updateData
    );

    res.json({
      success: true,
      data: { project },
      message: 'Project updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update project settings
 */
export const updateProjectSettings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { allowedModelTypes, maxRequestSize, isActive } = req.body;

    const updateData: any = {};
    if (allowedModelTypes !== undefined) updateData.allowedModelTypes = allowedModelTypes;
    if (maxRequestSize !== undefined) {
      if (typeof maxRequestSize !== 'number' || maxRequestSize < 1024) {
        throw new ApiError(400, 'maxRequestSize must be at least 1024 bytes (1KB)');
      }
      updateData.maxRequestSize = maxRequestSize;
    }
    if (isActive !== undefined) updateData.isActive = isActive;

    if (Object.keys(updateData).length === 0) {
      throw new ApiError(400, 'No update data provided');
    }

    const settings = await projectService.updateProjectSettings(
      req.params.id,
      req.user.userId,
      updateData
    );

    res.json({
      success: true,
      data: { settings },
      message: 'Project settings updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a project
 */
export const deleteProject = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    await projectService.deleteProject(req.params.id, req.user.userId);

    res.json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Regenerate API token for a project
 */
export const regenerateApiToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const apiToken = await projectService.regenerateApiToken(
      req.params.id,
      req.user.userId
    );

    res.json({
      success: true,
      data: { apiToken },
      message: 'API token regenerated successfully. Save it securely, it will not be shown again.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get available model types
 */
export const getModelTypes = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const modelTypes = await projectService.getAvailableModelTypes();

    res.json({
      success: true,
      data: { modelTypes },
    });
  } catch (error) {
    next(error);
  }
};
