import leaderboardService from '../services/leaderboard.service.js';
import { ValidationError, NotFoundError, UserNotInRoomError } from '../models/errors.js';

class LeaderboardController {
    
    /**
     * Get Room Leaderboard Controller
     * GET /api/leaderboards/room/:roomId
     */
    async getRoomLeaderboard(req, res) {
        try {
            const { roomId } = req.params;
            const userId = req.user.id;
            
            if (!userId) {
                return res.status(401).json({ error: "User not authenticated" });
            }
            
            const result = await leaderboardService.getRoomLeaderboard(roomId, userId);
            
            return res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            console.error('Get room leaderboard error:', error);
            
            if (error instanceof ValidationError) {
                return res.status(400).json({ error: error.message });
            }
            if (error instanceof UserNotInRoomError) {
                return res.status(403).json({ error: error.message });
            }
            if (error instanceof NotFoundError) {
                return res.status(404).json({ error: "Room not found" });
            }
            
            return res.status(500).json({ error: "Internal server error" });
        }
    }

    /**
     * Get Quiz Leaderboard Controller
     * GET /api/leaderboards/quiz/:quizId
     */
    async getQuizLeaderboard(req, res) {
        try {
            const { quizId } = req.params;
            const userId = req.user.id;
            
            if (!userId) {
                return res.status(401).json({ error: "User not authenticated" });
            }
            
            const result = await leaderboardService.getQuizLeaderboard(quizId, userId);
            
            return res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            console.error('Get quiz leaderboard error:', error);
            
            if (error instanceof ValidationError) {
                return res.status(400).json({ error: error.message });
            }
            if (error instanceof NotFoundError) {
                return res.status(404).json({ error: "Quiz not found" });
            }
            
            return res.status(500).json({ error: "Internal server error" });
        }
    }

    /**
     * Get User Leaderboard Controller
     * GET /api/leaderboards/user/:userId
     */
    async getUserLeaderboard(req, res) {
        try {
            const { userId } = req.params;
            const currentUserId = req.user.id;
            
            if (!currentUserId) {
                return res.status(401).json({ error: "User not authenticated" });
            }
            
            const result = await leaderboardService.getUserLeaderboard(userId, currentUserId);
            
            return res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            console.error('Get user leaderboard error:', error);
            
            if (error instanceof ValidationError) {
                return res.status(400).json({ error: error.message });
            }
            
            return res.status(500).json({ error: "Internal server error" });
        }
    }

    /**
     * Get Global Leaderboard Controller
     * GET /api/leaderboards/global/top
     */
    async getGlobalLeaderboard(req, res) {
        try {
            const { limit = 10, offset = 0 } = req.query;
            const userId = req.user.id;
            
            if (!userId) {
                return res.status(401).json({ error: "User not authenticated" });
            }
            
            const result = await leaderboardService.getGlobalLeaderboard(parseInt(limit), parseInt(offset), userId);
            
            return res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            console.error('Get global leaderboard error:', error);
            
            if (error instanceof ValidationError) {
                return res.status(400).json({ error: error.message });
            }
            
            return res.status(500).json({ error: "Internal server error" });
        }
    }

    /**
     * Get Room Team Leaderboard Controller
     * GET /api/leaderboards/room/:roomId/team
     */
    async getRoomTeamLeaderboard(req, res) {
        try {
            const { roomId } = req.params;
            const userId = req.user.id;
            
            if (!userId) {
                return res.status(401).json({ error: "User not authenticated" });
            }
            
            const result = await leaderboardService.getRoomTeamLeaderboard(roomId, userId);
            
            return res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            console.error('Get room team leaderboard error:', error);
            
            if (error instanceof ValidationError) {
                return res.status(400).json({ error: error.message });
            }
            if (error instanceof UserNotInRoomError) {
                return res.status(403).json({ error: error.message });
            }
            if (error instanceof NotFoundError) {
                return res.status(404).json({ error: "Room not found" });
            }
            
            return res.status(500).json({ error: "Internal server error" });
        }
    }
}

export default new LeaderboardController();
