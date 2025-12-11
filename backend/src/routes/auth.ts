import { Router } from 'express';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest';
import * as authController from '../controllers/auth';

export const authRouter = Router();

// Login user
authRouter.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  validateRequest,
  authController.login
);

// Get current user
authRouter.get('/me', authController.authenticate, authController.getCurrentUser);

// Refresh token
authRouter.post('/refresh-token', authController.refreshToken);

// Logout
authRouter.post('/logout', authController.authenticate, authController.logout);
