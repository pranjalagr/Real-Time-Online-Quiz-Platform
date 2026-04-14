import leaderboardRepository from '../repositories/leaderboard.repositories.js';
import roomRepository from '../repositories/room.repositories.js';
import { ValidationError, UserNotInRoomError } from '../models/errors.js';

class LeaderboardService {
    async getRoomLeaderboard(roomId, userId) {
        const room = await roomRepository.getRoomById(Number(roomId));
        const isInRoom = await roomRepository.isUserInRoom(room.id, userId);
        if (!isInRoom) {
            throw new UserNotInRoomError(userId, room.id);
        }

        return room.room_mode === 'TEAM'
            ? leaderboardRepository.getTeamLeaderboard(room.id)
            : leaderboardRepository.getUserLeaderboard(room.id);
    }

    async getQuizLeaderboard(quizId, userId) {
        return { quizId: Number(quizId), message: 'Use room leaderboard for active scoring' };
    }

    async getUserLeaderboard(userId, currentUserId) {
        if (Number(userId) !== Number(currentUserId)) {
            throw new ValidationError('Access denied');
        }

        const leaderboard = await leaderboardRepository.getGlobalLeaderboard(1000, 0);
        return leaderboard.find((entry) => Number(entry.user_id) === Number(userId)) || null;
    }

    async getGlobalLeaderboard(limit = 10, offset = 0) {
        return leaderboardRepository.getGlobalLeaderboard(limit, offset);
    }

    async getRoomTeamLeaderboard(roomId, userId) {
        const room = await roomRepository.getRoomById(Number(roomId));
        const isInRoom = await roomRepository.isUserInRoom(room.id, userId);
        if (!isInRoom) {
            throw new UserNotInRoomError(userId, room.id);
        }

        return leaderboardRepository.getTeamLeaderboard(room.id);
    }
}

export default new LeaderboardService();
