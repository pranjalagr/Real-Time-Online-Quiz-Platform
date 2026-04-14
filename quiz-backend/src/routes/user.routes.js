import express from 'express';
import userController from '../controllers/user.controllers.js';
import { authMiddleware } from '../middlewares/auth.middlewares.js';

const router = express.Router();

/**
 * GET /api/users/me
 * Get current user profile
 * @requires authentication
 */
router.get('/me', authMiddleware, userController.getCurrentUser);

/**
 * GET /api/users/:userId
 * Get user profile
 * @requires authentication
 * @param { userId: number }
 */
router.get('/:userId', authMiddleware, userController.getUserProfile);

/**
 * PUT /api/users/me
 * Update current user profile
 * @requires authentication
 * @body { email?: string, displayName?: string, avatar?: string }
 */
router.put('/me', authMiddleware, userController.updateProfile);

/**
 * DELETE /api/users/me
 * Delete user account
 * @requires authentication
 */
router.delete('/me', authMiddleware, userController.deleteAccount);

export default router;