import adminService from '../services/admin.services.js';
import { ValidationError, NotFoundError } from '../models/errors.js';

class AdminController {
    
    /**
     * Get Platform Stats Controller
     * GET /api/admin/stats
     */
    async getPlatformStats(req, res) {
        try {
            const userId = req.user.id;
            
            if (!userId) {
                return res.status(401).json({ error: "User not authenticated" });
            }
            
            const result = await adminService.getPlatformStats(userId);
            
            return res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            console.error('Get platform stats error:', error);
            
            if (error instanceof ValidationError) {
                return res.status(400).json({ error: error.message });
            }
            
            return res.status(500).json({ error: "Internal server error" });
        }
    }

    /**
     * Get All Users Controller
     * GET /api/admin/users
     */
    async getAllUsers(req, res) {
        try {
            const { limit = 10, offset = 0, search } = req.query;
            const userId = req.user.id;
            
            if (!userId) {
                return res.status(401).json({ error: "User not authenticated" });
            }
            
            const result = await adminService.getAllUsers(userId, parseInt(limit), parseInt(offset), search);
            
            return res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            console.error('Get all users error:', error);
            
            if (error instanceof ValidationError) {
                return res.status(400).json({ error: error.message });
            }
            
            return res.status(500).json({ error: "Internal server error" });
        }
    }

    /**
     * Get All Quizzes Controller
     * GET /api/admin/quizzes
     */
    async getAllQuizzes(req, res) {
        try {
            const { limit = 10, offset = 0 } = req.query;
            const userId = req.user.id;
            
            if (!userId) {
                return res.status(401).json({ error: "User not authenticated" });
            }
            
            const result = await adminService.getAllQuizzes(userId, parseInt(limit), parseInt(offset));
            
            return res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            console.error('Get all quizzes error:', error);
            
            if (error instanceof ValidationError) {
                return res.status(400).json({ error: error.message });
            }
            
            return res.status(500).json({ error: "Internal server error" });
        }
    }

    /**
     * Delete User Controller
     * DELETE /api/admin/users/:userId
     */
    async deleteUser(req, res) {
        try {
            const { userId } = req.params;
            const adminId = req.user.id;
            
            if (!adminId) {
                return res.status(401).json({ error: "User not authenticated" });
            }
            
            await adminService.deleteUser(adminId, userId);
            
            return res.status(200).json({
                success: true,
                message: "User deleted successfully"
            });
        } catch (error) {
            console.error('Delete user error:', error);
            
            if (error instanceof ValidationError) {
                return res.status(400).json({ error: error.message });
            }
            if (error instanceof NotFoundError) {
                return res.status(404).json({ error: "User not found" });
            }
            
            return res.status(500).json({ error: "Internal server error" });
        }
    }

    /**
     * Delete Quiz Controller
     * DELETE /api/admin/quizzes/:quizId
     */
    async deleteQuiz(req, res) {
        try {
            const { quizId } = req.params;
            const adminId = req.user.id;
            
            if (!adminId) {
                return res.status(401).json({ error: "User not authenticated" });
            }
            
            await adminService.deleteQuiz(adminId, quizId);
            
            return res.status(200).json({
                success: true,
                message: "Quiz deleted successfully"
            });
        } catch (error) {
            console.error('Delete quiz error:', error);
            
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
     * Get Reports Controller
     * GET /api/admin/reports
     */
    async getReports(req, res) {
        try {
            const userId = req.user.id;
            
            if (!userId) {
                return res.status(401).json({ error: "User not authenticated" });
            }
            
            const result = await adminService.getReports(userId);
            
            return res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            console.error('Get reports error:', error);
            
            if (error instanceof ValidationError) {
                return res.status(400).json({ error: error.message });
            }
            
            return res.status(500).json({ error: "Internal server error" });
        }
    }
}

export default new AdminController();