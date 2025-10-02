import { Response, NextFunction } from 'express';
import crypto from 'crypto';
import { ApiToken } from '../models/ApiToken';
import { ApiError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { n8nService } from '../services/n8n';
import { portfolioService } from '../services/portfolio';

// Get all API tokens for the current user
export const getApiTokens = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const tokens = await ApiToken.find({
      userId: req.user.userId,
      isActive: true,
      expiresAt: { $gt: new Date() },
    }).select('-token');

    res.json({
      success: true,
      data: { tokens },
    });
  } catch (error) {
    next(error);
  }
};

// Get a single API token
export const getApiToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = await ApiToken.findOne({
      _id: req.params.id,
      userId: req.user.userId,
    }).select('-token');

    if (!token) {
      throw new ApiError(404, 'Token not found');
    }

    res.json({
      success: true,
      data: { token },
    });
  } catch (error) {
    next(error);
  }
};

// Create a new API token
export const createApiToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, scopes, expiresIn } = req.body;

    // Validate scopes
    const validScopes = ['read', 'write', 'admin'];
    if (!scopes || !Array.isArray(scopes) || scopes.length === 0) {
      throw new ApiError(400, 'Scopes are required');
    }

    const invalidScopes = scopes.filter((s: string) => !validScopes.includes(s));
    if (invalidScopes.length > 0) {
      throw new ApiError(400, `Invalid scopes: ${invalidScopes.join(', ')}`);
    }

    // Generate a secure random token
    const tokenValue = crypto.randomBytes(32).toString('hex');

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (expiresIn || 30)); // Default 30 days

    // Create token
    const apiToken = await ApiToken.create({
      name,
      token: tokenValue,
      scopes,
      expiresAt,
      userId: req.user.userId,
    });

    res.status(201).json({
      success: true,
      data: {
        token: {
          id: apiToken._id,
          name: apiToken.name,
          token: tokenValue, // Only returned once
          scopes: apiToken.scopes,
          expiresAt: apiToken.expiresAt,
        },
      },
      message: 'Token created successfully. Save it securely, it will not be shown again.',
    });
  } catch (error) {
    next(error);
  }
};

// Revoke an API token
export const revokeApiToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = await ApiToken.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user.userId,
      },
      { isActive: false },
      { new: true }
    );

    if (!token) {
      throw new ApiError(404, 'Token not found');
    }

    res.json({
      success: true,
      message: 'Token revoked successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Get n8n statistics
export const getN8nStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const stats = await n8nService.getStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

// Get portfolio statistics
export const getPortfolioStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const stats = await portfolioService.getStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

// Get admin statistics
export const getAdminStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const totalTokens = await ApiToken.countDocuments({ isActive: true });
    const expiredTokens = await ApiToken.countDocuments({
      isActive: true,
      expiresAt: { $lt: new Date() },
    });

    res.json({
      success: true,
      data: {
        totalTokens,
        expiredTokens,
        activeTokens: totalTokens - expiredTokens,
      },
    });
  } catch (error) {
    next(error);
  }
};
