import db from '../utils/database.js';
import { DatabaseError, NotFoundError, ValidationError } from '../models/errors.js';

class RoomRepository {
    async createRoom({ host_id, room_code, room_mode }) {
        try {
            const result = await db.query(
                `INSERT INTO rooms (host_id, room_code, room_mode, state)
                 VALUES ($1, $2, $3, 'LOBBY')
                 RETURNING id, host_id, room_code, room_mode, state, created_at`,
                [host_id, room_code, room_mode]
            );
            return result.rows[0];
        } catch (error) {
            if (error.code === '23505') {
                throw new ValidationError('Room code already exists');
            }
            throw new DatabaseError(`Failed to create room: ${error.message}`, 'CREATE_ROOM', error);
        }
    }

    async getRoomById(roomId) {
        try {
            const result = await db.query(
                `SELECT id, host_id, room_code, room_mode, state, created_at
                 FROM rooms
                 WHERE id = $1`,
                [roomId]
            );
            if (result.rows.length === 0) {
                throw new NotFoundError('Room', roomId);
            }
            return result.rows[0];
        } catch (error) {
            if (error instanceof NotFoundError) {
                throw error;
            }
            throw new DatabaseError(`Failed to get room: ${error.message}`, 'GET_ROOM', error);
        }
    }

    async getRoomInfo(roomId) {
        return this.getRoomById(roomId);
    }

    async getRoomByCode(roomCode) {
        try {
            const result = await db.query(
                `SELECT id, host_id, room_code, room_mode, state, created_at
                 FROM rooms
                 WHERE room_code = $1`,
                [roomCode]
            );
            if (result.rows.length === 0) {
                throw new NotFoundError('Room', roomCode);
            }
            return result.rows[0];
        } catch (error) {
            if (error instanceof NotFoundError) {
                throw error;
            }
            throw new DatabaseError(`Failed to get room by code: ${error.message}`, 'GET_ROOM', error);
        }
    }

    async getRoomState(roomId) {
        const room = await this.getRoomById(roomId);
        return room.state;
    }

    async updateRoomState(roomId, newState) {
        try {
            const result = await db.query(
                `UPDATE rooms
                 SET state = $1
                 WHERE id = $2
                 RETURNING id, state`,
                [newState, roomId]
            );
            if (result.rows.length === 0) {
                throw new NotFoundError('Room', roomId);
            }
            return result.rows[0];
        } catch (error) {
            if (error instanceof NotFoundError) {
                throw error;
            }
            throw new DatabaseError(`Failed to update room state: ${error.message}`, 'UPDATE_ROOM', error);
        }
    }

    async addUserToRoom(roomId, userId, role = 'player', teamId = null) {
        try {
            const result = await db.query(
                `INSERT INTO room_users (user_id, room_id, team_id, role)
                 VALUES ($1, $2, $3, $4)
                 RETURNING user_id, room_id, team_id, role, joined_at`,
                [userId, roomId, teamId, role]
            );
            return result.rows[0];
        } catch (error) {
            if (error.code === '23505') {
                throw new ValidationError('User already in room');
            }
            throw new DatabaseError(`Failed to add user to room: ${error.message}`, 'ADD_ROOM_USER', error);
        }
    }

    async removeUserFromRoom(roomId, userId) {
        try {
            const result = await db.query(
                'DELETE FROM room_users WHERE room_id = $1 AND user_id = $2 RETURNING user_id',
                [roomId, userId]
            );
            return result.rows.length > 0;
        } catch (error) {
            throw new DatabaseError(`Failed to remove user from room: ${error.message}`, 'REMOVE_ROOM_USER', error);
        }
    }

    async getUsersInRoom(roomId) {
        try {
            const result = await db.query(
                `SELECT ru.user_id, ru.room_id, ru.team_id, ru.role, ru.joined_at, u.username, u.user_type
                 FROM room_users ru
                 JOIN users u ON u.id = ru.user_id
                 WHERE ru.room_id = $1
                 ORDER BY ru.joined_at ASC`,
                [roomId]
            );
            return result.rows;
        } catch (error) {
            throw new DatabaseError(`Failed to get room users: ${error.message}`, 'GET_ROOM_USERS', error);
        }
    }

    async getUserTeamInRoom(userId, roomId) {
        try {
            const result = await db.query(
                `SELECT ru.team_id, t.team_name
                 FROM room_users ru
                 LEFT JOIN teams t ON t.id = ru.team_id
                 WHERE ru.user_id = $1 AND ru.room_id = $2`,
                [userId, roomId]
            );
            return result.rows[0] || null;
        } catch (error) {
            throw new DatabaseError(`Failed to get user team: ${error.message}`, 'GET_USER_TEAM', error);
        }
    }

    async updateUserTeam(userId, roomId, teamId) {
        try {
            const result = await db.query(
                `UPDATE room_users
                 SET team_id = $1
                 WHERE user_id = $2 AND room_id = $3
                 RETURNING user_id, room_id, team_id`,
                [teamId, userId, roomId]
            );
            if (result.rows.length === 0) {
                throw new NotFoundError('Room user', `${roomId}:${userId}`);
            }
            return result.rows[0];
        } catch (error) {
            if (error instanceof NotFoundError) {
                throw error;
            }
            throw new DatabaseError(`Failed to update user team: ${error.message}`, 'UPDATE_ROOM_USER', error);
        }
    }

    async isUserHost(roomId, userId) {
        try {
            const result = await db.query(
                'SELECT 1 FROM rooms WHERE id = $1 AND host_id = $2',
                [roomId, userId]
            );
            return result.rows.length > 0;
        } catch (error) {
            throw new DatabaseError(`Failed to check host: ${error.message}`, 'CHECK_HOST', error);
        }
    }

    async isUserInRoom(roomId, userId) {
        try {
            const result = await db.query(
                'SELECT 1 FROM room_users WHERE room_id = $1 AND user_id = $2',
                [roomId, userId]
            );
            return result.rows.length > 0;
        } catch (error) {
            throw new DatabaseError(`Failed to check room user: ${error.message}`, 'CHECK_ROOM_USER', error);
        }
    }

    async getRoomWithUsers(roomId) {
        const room = await this.getRoomById(roomId);
        const users = await this.getUsersInRoom(roomId);
        return { ...room, users };
    }
}

export default new RoomRepository();
