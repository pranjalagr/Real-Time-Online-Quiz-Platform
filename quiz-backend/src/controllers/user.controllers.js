import userService from '../services/user.service.js';
import { ValidationError, NotFoundError } from '../models/errors.js';

class UserController {
    
    /**
     * Get Current User Controller
     * GET /api/users/me
     */
    async getCurrentUser(req, res) {
        try {
            const userId = req.user.id;
            
            if (!userId) {
                return res.status(401).json({ error: "User not authenticated" });
            }
            
            const result = await userService.getCurrentUser(userId);
            
            return res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            console.error('Get current user error:', error);
            
            if (error instanceof ValidationError) {
                return res.status(400).json({ error: error.message });
            }
            
            return res.status(500).json({ error: "Internal server error" });
        }
    }

    /**
     * Get User Profile Controller
     * GET /api/users/:userId
     */
    async getUserProfile(req, res) {
        try {
            const { userId } = req.params;
            const currentUserId = req.user.id;
            
            if (!currentUserId) {
                return res.status(401).json({ error: "User not authenticated" });
            }
            
            const result = await userService.getUserProfile(userId, currentUserId);
            
            return res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            console.error('Get user profile error:', error);
            
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
     * Update Profile Controller
     * PUT /api/users/me
     */
    async updateProfile(req, res) {
        try {
            const { email, username } = req.body;
            const userId = req.user.id;
            
            if (!userId) {
                return res.status(401).json({ error: "User not authenticated" });
            }
            
            const result = await userService.updateProfile(userId, email, username);
            
            return res.status(200).json({
                success: true,
                message: "Profile updated successfully",
                data: result
            });
        } catch (error) {
            console.error('Update profile error:', error);
            
            if (error instanceof ValidationError) {
                return res.status(400).json({ error: error.message });
            }
            
            return res.status(500).json({ error: "Internal server error" });
        }
    }

    /**
     * Get User Stats Controller
     * GET /api/users/:userId/stats
     */
    async getUserStats(req, res) {
        try {
            const { userId } = req.params;
            const currentUserId = req.user.id;
            
            if (!currentUserId) {
                return res.status(401).json({ error: "User not authenticated" });
            }
            
            const result = await userService.getUserStats(userId, currentUserId);
            
            return res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            console.error('Get user stats error:', error);
            
            if (error instanceof ValidationError) {
                return res.status(400).json({ error: error.message });
            }
            
            return res.status(500).json({ error: "Internal server error" });
        }
    }

    /**
     * Get User Achievements Controller
     * GET /api/users/:userId/achievements
     */
    async getUserAchievements(req, res) {
        try {
            const { userId } = req.params;
            const currentUserId = req.user.id;
            
            if (!currentUserId) {
                return res.status(401).json({ error: "User not authenticated" });
            }
            
            const result = await userService.getUserAchievements(userId, currentUserId);
            
            return res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            console.error('Get user achievements error:', error);
            
            if (error instanceof ValidationError) {
                return res.status(400).json({ error: error.message });
            }
            
            return res.status(500).json({ error: "Internal server error" });
        }
    }

    /**
     * Delete Account Controller
     * DELETE /api/users/me
     */
    async deleteAccount(req, res) {
        try {
            const userId = req.user.id;
            
            if (!userId) {
                return res.status(401).json({ error: "User not authenticated" });
            }
            
            await userService.deleteAccount(userId);
            
            return res.status(200).json({
                success: true,
                message: "Account deleted successfully"
            });
        } catch (error) {
            console.error('Delete account error:', error);
            
            if (error instanceof ValidationError) {
                return res.status(400).json({ error: error.message });
            }
            
            return res.status(500).json({ error: "Internal server error" });
        }
    }
}

export default new UserController();
