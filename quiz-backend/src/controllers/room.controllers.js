import roomService from '../services/room.services.js';
import { ValidationError, UserNotHostError, UserNotInRoomError, IncorrectStateError, DuplicateUserInRoomError } from '../models/errors.js';

class RoomController {
    
    /**
     * Create Room Controller
     * POST /api/rooms/create
     */
    async createRoom(req, res) {
        try {
            const { roomMode } = req.body;
            const hostId = req.user.id;
            
            if (!hostId) {
                return res.status(401).json({ error: "User not authenticated" });
            }
            
            const result = await roomService.createRoom(hostId, roomMode);
            
            return res.status(201).json({
                success: true,
                message: "Room created successfully",
                data: result
            });
        } catch (error) {
            console.error('Create room error:', error);
            
            if (error instanceof ValidationError) {
                return res.status(400).json({ error: error.message });
            }
            
            return res.status(500).json({ error: "Internal server error" });
        }
    }

    /**
     * Join Room Controller
     * POST /api/rooms/join
     */
    async joinRoom(req, res) {
        try {
            const { roomCode, role = 'player', teamId = null } = req.body;
            const userId = req.user.id;
            
            if (!userId) {
                return res.status(401).json({ error: "User not authenticated" });
            }
            
            const result = await roomService.joinRoom(userId, roomCode, role, teamId);
            
            return res.status(200).json({
                success: true,
                message: "Joined room successfully",
                data: result
            });
        } catch (error) {
            console.error('Join room error:', error);
            
            if (error instanceof ValidationError) {
                return res.status(400).json({ error: error.message });
            }
            if (error instanceof DuplicateUserInRoomError) {
                return res.status(409).json({ error: "User already in room" });
            }
            if (error instanceof IncorrectStateError) {
                return res.status(403).json({ error: `Cannot join room: ${error.message}` });
            }
            
            return res.status(500).json({ error: "Internal server error" });
        }
    }

    /**
     * Start Quiz Controller
     * POST /api/rooms/:roomId/start
     */
    async startQuiz(req, res) {
        try {
            const { roomId } = req.params;
            const userId = req.user.id;
            
            if (!userId) {
                return res.status(401).json({ error: "User not authenticated" });
            }
            
            const result = await roomService.startQuiz(roomId, userId);
            
            return res.status(200).json({
                success: true,
                message: "Quiz started successfully",
                data: result
            });
        } catch (error) {
            console.error('Start quiz error:', error);
            
            if (error instanceof ValidationError) {
                return res.status(400).json({ error: error.message });
            }
            if (error instanceof UserNotHostError) {
                return res.status(403).json({ error: "Only host can start quiz" });
            }
            if (error instanceof IncorrectStateError) {
                return res.status(403).json({ error: `Cannot start quiz: ${error.message}` });
            }
            
            return res.status(500).json({ error: "Internal server error" });
        }
    }

    /**
     * Submit Answer Controller
     * POST /api/rooms/:roomId/questions/:questionId/submit
     */
    async submitAnswer(req, res) {
        try {
            const { roomId, questionId } = req.params;
            const { selectedOption, quizId, teamId = null } = req.body;
            const userId = req.user.id;
            
            if (!userId) {
                return res.status(401).json({ error: "User not authenticated" });
            }
            
            const result = await roomService.submitAnswer(userId, roomId, questionId, selectedOption, quizId, teamId);
            
            return res.status(200).json({
                success: true,
                message: "Answer submitted successfully",
                data: result
            });
        } catch (error) {
            console.error('Submit answer error:', error);
            
            if (error instanceof ValidationError) {
                return res.status(400).json({ error: error.message });
            }
            if (error instanceof UserNotInRoomError) {
                return res.status(403).json({ error: "User not in room" });
            }
            if (error instanceof IncorrectStateError) {
                return res.status(403).json({ error: `Cannot submit answer: ${error.message}` });
            }
            
            return res.status(500).json({ error: "Internal server error" });
        }
    }

    /**
     * End Quiz Controller
     * POST /api/rooms/:roomId/end
     */
    async endQuiz(req, res) {
        try {
            const { roomId } = req.params;
            const userId = req.user.id;
            
            if (!userId) {
                return res.status(401).json({ error: "User not authenticated" });
            }
            
            const result = await roomService.endQuiz(roomId, userId);
            
            return res.status(200).json({
                success: true,
                message: "Quiz ended successfully",
                data: result
            });
        } catch (error) {
            console.error('End quiz error:', error);
            
            if (error instanceof ValidationError) {
                return res.status(400).json({ error: error.message });
            }
            if (error instanceof UserNotHostError) {
                return res.status(403).json({ error: "Only host can end quiz" });
            }
            if (error instanceof IncorrectStateError) {
                return res.status(403).json({ error: `Cannot end quiz: ${error.message}` });
            }
            
            return res.status(500).json({ error: "Internal server error" });
        }
    }

    /**
     * Leave Room Controller
     * POST /api/rooms/:roomId/leave
     */
    async leaveRoom(req, res) {
        try {
            const { roomId } = req.params;
            const userId = req.user.id;
            
            if (!userId) {
                return res.status(401).json({ error: "User not authenticated" });
            }
            
            const result = await roomService.leaveRoom(roomId, userId);
            
            return res.status(200).json({
                success: true,
                message: "Left room successfully",
                data: result
            });
        } catch (error) {
            console.error('Leave room error:', error);
            
            if (error instanceof ValidationError) {
                return res.status(400).json({ error: error.message });
            }
            if (error instanceof UserNotInRoomError) {
                return res.status(403).json({ error: "User not in room" });
            }
            if (error instanceof IncorrectStateError) {
                return res.status(403).json({ error: `Cannot leave room: ${error.message}` });
            }
            
            return res.status(500).json({ error: "Internal server error" });
        }
    }

    /**
     * Restart Room Controller
     * POST /api/rooms/:roomId/restart
     */
    async restartRoom(req, res) {
        try {
            const { roomId } = req.params;
            const userId = req.user.id;
            
            if (!userId) {
                return res.status(401).json({ error: "User not authenticated" });
            }
            
            const result = await roomService.restartRoom(roomId, userId);
            
            return res.status(200).json({
                success: true,
                message: "Room restarted successfully",
                data: result
            });
        } catch (error) {
            console.error('Restart room error:', error);
            
            if (error instanceof ValidationError) {
                return res.status(400).json({ error: error.message });
            }
            if (error instanceof UserNotHostError) {
                return res.status(403).json({ error: "Only host can restart room" });
            }
            if (error instanceof IncorrectStateError) {
                return res.status(403).json({ error: `Cannot restart room: ${error.message}` });
            }
            
            return res.status(500).json({ error: "Internal server error" });
        }
    }

    /**
     * Get Room Info Controller
     * GET /api/rooms/:roomId
     */
    async getRoomInfo(req, res) {
        try {
            const { roomId } = req.params;
            const userId = req.user.id;
            
            if (!userId) {
                return res.status(401).json({ error: "User not authenticated" });
            }
            
            const result = await roomService.getRoomInfo(roomId, userId);
            
            return res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            console.error('Get room info error:', error);
            
            if (error instanceof ValidationError) {
                return res.status(400).json({ error: error.message });
            }
            if (error instanceof UserNotInRoomError) {
                return res.status(403).json({ error: "User not in room" });
            }
            
            return res.status(500).json({ error: "Internal server error" });
        }
    }

    /**
     * Get Leaderboard Controller
     * GET /api/rooms/:roomId/leaderboard
     */
    async getLeaderboard(req, res) {
        try {
            const { roomId } = req.params;
            const userId = req.user.id;
            
            if (!userId) {
                return res.status(401).json({ error: "User not authenticated" });
            }
            
            const result = await roomService.getLeaderboard(roomId, userId);
            
            return res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            console.error('Get leaderboard error:', error);
            
            if (error instanceof ValidationError) {
                return res.status(400).json({ error: error.message });
            }
            if (error instanceof UserNotInRoomError) {
                return res.status(403).json({ error: "User not in room" });
            }
            
            return res.status(500).json({ error: "Internal server error" });
        }
    }
}

export default new RoomController();