import express from 'express';
import adminController from '../controllers/admin.controllers.js';
import { authMiddleware, requireRole } from '../middlewares/auth.middlewares.js';

const router = express.Router();

/**
 * GET /api/admin/stats
 * Get overall platform statistics
 * @requires authentication (admin only)
 */
router.get('/stats', authMiddleware, requireRole('admin'), adminController.getPlatformStats);

/**
 * GET /api/admin/users
 * Get all users
 * @requires authentication (admin only)
 * @query { limit?: number, offset?: number, search?: string }
 */
router.get('/users', authMiddleware, requireRole('admin'), adminController.getAllUsers);

/**
 * GET /api/admin/quizzes
 * Get all quizzes
 * @requires authentication (admin only)
 * @query { limit?: number, offset?: number }
 */
router.get('/quizzes', authMiddleware, requireRole('admin'), adminController.getAllQuizzes);

/**
 * DELETE /api/admin/users/:userId
 * Delete user account (admin)
 * @requires authentication (admin only)
 * @param { userId: number }
 */
router.delete('/users/:userId', authMiddleware, requireRole('admin'), adminController.deleteUser);

/**
 * DELETE /api/admin/quizzes/:quizId
 * Delete quiz (admin)
 * @requires authentication (admin only)
 * @param { quizId: number }
 */
router.delete('/quizzes/:quizId', authMiddleware, requireRole('admin'), adminController.deleteQuiz);

/**
 * GET /api/admin/reports
 * Get reports and issues
 * @requires authentication (admin only)
 */
router.get('/reports', authMiddleware, requireRole('admin'), adminController.getReports);

export default router;