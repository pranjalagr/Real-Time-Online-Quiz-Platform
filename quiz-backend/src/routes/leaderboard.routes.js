import express from 'express';
import leaderboardController from '../controllers/leaderboard.controllers.js';
import { authMiddleware } from '../middlewares/auth.middlewares.js';

const router = express.Router();

/**
 * GET /api/leaderboards/room/:roomId
 * Get leaderboard for a room
 * @requires authentication
 * @param { roomId: number }
 */
router.get('/room/:roomId', authMiddleware, leaderboardController.getRoomLeaderboard);

/**
 * GET /api/leaderboards/quiz/:quizId
 * Get leaderboard for a quiz
 * @requires authentication
 * @param { quizId: number }
 */
router.get('/quiz/:quizId', authMiddleware, leaderboardController.getQuizLeaderboard);

/**
 * GET /api/leaderboards/user/:userId
 * Get user's leaderboard stats
 * @requires authentication
 * @param { userId: number }
 */
router.get('/user/:userId', authMiddleware, leaderboardController.getUserLeaderboard);

/**
 * GET /api/leaderboards/global
 * Get global leaderboard (top users)
 * @requires authentication
 * @query { limit?: number, offset?: number }
 */
router.get('/global/top', authMiddleware, leaderboardController.getGlobalLeaderboard);

/**
 * GET /api/leaderboards/room/:roomId/team
 * Get team leaderboard for a room (for TEAM mode)
 * @requires authentication
 * @param { roomId: number }
 */
router.get('/room/:roomId/team', authMiddleware, leaderboardController.getRoomTeamLeaderboard);

export default router;