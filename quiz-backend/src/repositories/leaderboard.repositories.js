import db from '../utils/database.js';
import { DatabaseError, NotFoundError, ValidationError } from '../models/errors.js';

class LeaderboardRepository {
    async createEntry(userId, teamId, roomId, initialScore = 0) {
        if (!userId && !teamId) {
            throw new ValidationError('Either userId or teamId is required');
        }

        try {
            const result = await db.query(
                `INSERT INTO leaderboard (room_id, user_id, team_id, score)
                 VALUES ($1, $2, $3, $4)
                 RETURNING id, room_id, user_id, team_id, score, last_updated`,
                [roomId, userId, teamId, initialScore]
            );
            return result.rows[0];
        } catch (error) {
            if (error.code === '23505') {
                throw new ValidationError('Leaderboard entry already exists');
            }
            throw new DatabaseError(`Failed to create leaderboard entry: ${error.message}`, 'CREATE_LEADERBOARD', error);
        }
    }

    async updateUserScore(userId, roomId, pointsToAdd) {
        try {
            const result = await db.query(
                `UPDATE leaderboard
                 SET score = score + $1, last_updated = NOW()
                 WHERE room_id = $2 AND user_id = $3
                 RETURNING id, room_id, user_id, score, last_updated`,
                [pointsToAdd, roomId, userId]
            );
            if (result.rows.length === 0) {
                throw new NotFoundError('Leaderboard entry', `${roomId}:${userId}`);
            }
            return result.rows[0];
        } catch (error) {
            if (error instanceof NotFoundError) {
                throw error;
            }
            throw new DatabaseError(`Failed to update user score: ${error.message}`, 'UPDATE_LEADERBOARD', error);
        }
    }

    async updateTeamScore(teamId, roomId, pointsToAdd) {
        try {
            const result = await db.query(
                `UPDATE leaderboard
                 SET score = score + $1, last_updated = NOW()
                 WHERE room_id = $2 AND team_id = $3
                 RETURNING id, room_id, team_id, score, last_updated`,
                [pointsToAdd, roomId, teamId]
            );
            if (result.rows.length === 0) {
                throw new NotFoundError('Leaderboard entry', `${roomId}:${teamId}`);
            }
            return result.rows[0];
        } catch (error) {
            if (error instanceof NotFoundError) {
                throw error;
            }
            throw new DatabaseError(`Failed to update team score: ${error.message}`, 'UPDATE_LEADERBOARD', error);
        }
    }

    async getUserLeaderboard(roomId) {
        try {
            const result = await db.query(
                `SELECT l.user_id, u.username, l.score,
                        ROW_NUMBER() OVER (ORDER BY l.score DESC, l.last_updated ASC) AS rank
                 FROM leaderboard l
                 JOIN users u ON u.id = l.user_id
                 WHERE l.room_id = $1 AND l.user_id IS NOT NULL
                 ORDER BY l.score DESC, l.last_updated ASC`,
                [roomId]
            );
            return result.rows;
        } catch (error) {
            throw new DatabaseError(`Failed to get user leaderboard: ${error.message}`, 'GET_LEADERBOARD', error);
        }
    }

    async getTeamLeaderboard(roomId) {
        try {
            const result = await db.query(
                `SELECT l.team_id, t.team_name, l.score,
                        ROW_NUMBER() OVER (ORDER BY l.score DESC, l.last_updated ASC) AS rank
                 FROM leaderboard l
                 JOIN teams t ON t.id = l.team_id
                 WHERE l.room_id = $1 AND l.team_id IS NOT NULL
                 ORDER BY l.score DESC, l.last_updated ASC`,
                [roomId]
            );
            return result.rows;
        } catch (error) {
            throw new DatabaseError(`Failed to get team leaderboard: ${error.message}`, 'GET_LEADERBOARD', error);
        }
    }

    async resetScoresByRoomId(roomId) {
        try {
            const result = await db.query(
                `UPDATE leaderboard
                 SET score = 0, last_updated = NOW()
                 WHERE room_id = $1`,
                [roomId]
            );
            return result.rowCount;
        } catch (error) {
            throw new DatabaseError(`Failed to reset leaderboard: ${error.message}`, 'RESET_LEADERBOARD', error);
        }
    }

    async getGlobalLeaderboard(limit = 10, offset = 0) {
        try {
            const result = await db.query(
                `SELECT l.user_id, u.username, SUM(l.score)::int AS total_score, COUNT(*)::int AS games_played
                 FROM leaderboard l
                 JOIN users u ON u.id = l.user_id
                 WHERE l.user_id IS NOT NULL
                 GROUP BY l.user_id, u.username
                 ORDER BY total_score DESC, games_played DESC, u.username ASC
                 LIMIT $1 OFFSET $2`,
                [limit, offset]
            );
            return result.rows;
        } catch (error) {
            throw new DatabaseError(`Failed to get global leaderboard: ${error.message}`, 'GET_LEADERBOARD', error);
        }
    }
}

export default new LeaderboardRepository();
