import { Request, Response, NextFunction } from 'express';
import { projectService } from '../services/project';
import { ApiError } from './errorHandler';

export interface ProjectRequest extends Request {
  project?: any;
  projectSettings?: any;
}

/**
 * Middleware to validate project API token and access
 * This should be used on endpoints that external apps call using the API token
 */
export const validateProjectToken = async (
  req: ProjectRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Extract API token from header
    const apiToken = req.headers['x-api-token'] as string;
    
    if (!apiToken) {
      throw new ApiError(401, 'API token is required');
    }

    // Extract model type from request body (if present)
    const modelTypeKey = req.body?.modelType;

    // Validate project access
    const { project, settings } = await projectService.validateProjectAccess(
      apiToken,
      modelTypeKey
    );

    // Attach to request for use in controllers
    req.project = project;
    req.projectSettings = settings;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to validate request payload size against project settings
 */
export const validateRequestSize = (
  req: ProjectRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.projectSettings) {
      throw new ApiError(500, 'Project settings not found in request');
    }

    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    const maxSize = req.projectSettings.maxRequestSize;

    if (contentLength > maxSize) {
      throw new ApiError(
        413,
        `Request payload too large. Maximum allowed size is ${maxSize} bytes (${(maxSize / 1024 / 1024).toFixed(2)} MB)`
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if project is active
 */
export const checkProjectActive = (
  req: ProjectRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.projectSettings) {
      throw new ApiError(500, 'Project settings not found in request');
    }

    if (!req.projectSettings.isActive) {
      throw new ApiError(403, 'This project is currently inactive. Please contact the project owner.');
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Combined middleware for complete project validation
 * Use this on /run or similar endpoints
 */
export const validateProjectRequest = [
  validateProjectToken,
  checkProjectActive,
  validateRequestSize,
];
