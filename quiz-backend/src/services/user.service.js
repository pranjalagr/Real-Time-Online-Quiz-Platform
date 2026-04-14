import userRepository from '../repositories/user.repositories.js';
import quizRepository from '../repositories/quiz.repositories.js';
import leaderboardRepository from '../repositories/leaderboard.repositories.js';
import { ValidationError, NotFoundError } from '../models/errors.js';

class UserService {
    async getCurrentUser(userId) {
        const user = await userRepository.getUserById(userId);
        if (!user) {
            throw new NotFoundError('User', userId);
        }

        return {
            id: user.id,
            username: user.username,
            email: user.email,
            userType: user.user_type,
            createdAt: user.created_at
        };
    }

    async getUserProfile(userId) {
        return this.getCurrentUser(Number(userId));
    }

    async updateProfile(userId, email, username) {
        const user = await userRepository.updateUser(userId, {
            email,
            username
        });

        return {
            id: user.id,
            username: user.username,
            email: user.email,
            userType: user.user_type,
            createdAt: user.created_at
        };
    }

    async getUserStats(userId, currentUserId) {
        if (Number(userId) !== Number(currentUserId)) {
            throw new ValidationError('Access denied');
        }

        const quizzesCreated = await quizRepository.getQuizzesByHostId(Number(userId));
        const global = await leaderboardRepository.getGlobalLeaderboard(1000, 0);
        const userStats = global.find((entry) => Number(entry.user_id) === Number(userId));

        return {
            userId: Number(userId),
            totalQuizzesCreated: quizzesCreated.length,
            totalPointsEarned: userStats?.total_score || 0,
            totalGamesPlayed: userStats?.games_played || 0
        };
    }

    async deleteAccount(userId) {
        return userRepository.deleteUser(userId);
    }
}

export default new UserService();
