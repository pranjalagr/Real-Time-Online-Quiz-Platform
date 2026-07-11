// routes -- to make teams 
// as we know host must have login and other can guest

// create more team -- host 
// team link share



import express from 'express';
import roomController from '../controllers/room.controllers.js';
import { authMiddleware } from '../middlewares/auth.middlewares.js';

const router = express.Router();

/**
 * POST /api/rooms/create
 * Create a new room
 * @requires authentication
 * @body { roomMode: 'SOLO' | 'TEAM' }
 */
router.post('/create', authMiddleware, roomController.createRoom);

/**
 * POST /api/rooms/join
 * Join an existing room
 * @requires authentication
 * @body { roomCode: string, role?: string, teamId?: number }
 */
router.post('/join', authMiddleware, roomController.joinRoom);

/**
 * POST /api/rooms/:roomId/lobby
 * Shows all participants
 * @param { roomId: number }
 */
// router.post('/:roomId/lobby', roomController.);

/**
 * POST /api/rooms/:roomId/leave
 * Leave room (only during LOBBY state)
 * @requires authentication
 * @param { roomId: number }
 */
router.post('/:roomId/leave', authMiddleware, roomController.leaveRoom);

/**
 * POST /api/rooms/:roomId/restart
 * Restart room for new quiz (host only, only after quiz ends)
 * @requires authentication
 * @param { roomId: number }
 */
router.post('/:roomId/restart', authMiddleware, roomController.restartRoom);

/**
 * GET /api/rooms/:roomId
 * Get room information
 * @requires authentication
 * @param { roomId: number }
 */
router.get('/:roomId', authMiddleware, roomController.getRoomInfo);

/**
 * GET /api/rooms/:roomId/leaderboard
 * Get leaderboard for room
 * @requires authentication
 * @param { roomId: number }
 */
router.get('/:roomId/leaderboard', authMiddleware, roomController.getLeaderboard);

export default router;
