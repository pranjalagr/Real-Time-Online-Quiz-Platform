import db from '../utils/database.js';
import { DatabaseError, NotFoundError, ValidationError } from '../models/errors.js';

class TeamRepository {
    async createTeam({ room_id, team_name }) {
        try {
            const result = await db.query(
                `INSERT INTO teams (room_id, team_name)
                 VALUES ($1, $2)
                 RETURNING id, room_id, team_name, created_at`,
                [room_id, team_name]
            );
            return result.rows[0];
        } catch (error) {
            if (error.code === '23505') {
                throw new ValidationError('Team name already exists in this room');
            }
            throw new DatabaseError(`Failed to create team: ${error.message}`, 'CREATE_TEAM', error);
        }
    }

    async getTeamById(teamId) {
        try {
            const result = await db.query(
                `SELECT id, room_id, team_name, created_at
                 FROM teams
                 WHERE id = $1`,
                [teamId]
            );
            if (result.rows.length === 0) {
                throw new NotFoundError('Team', teamId);
            }
            return result.rows[0];
        } catch (error) {
            if (error instanceof NotFoundError) {
                throw error;
            }
            throw new DatabaseError(`Failed to get team: ${error.message}`, 'GET_TEAM', error);
        }
    }

    async getTeamsByRoomId(roomId) {
        try {
            const result = await db.query(
                `SELECT id, room_id, team_name, created_at
                 FROM teams
                 WHERE room_id = $1
                 ORDER BY created_at ASC`,
                [roomId]
            );
            return result.rows;
        } catch (error) {
            throw new DatabaseError(`Failed to get room teams: ${error.message}`, 'GET_TEAMS', error);
        }
    }

    async teamExistsInRoom(roomId, teamId) {
        try {
            const result = await db.query(
                'SELECT 1 FROM teams WHERE id = $1 AND room_id = $2',
                [teamId, roomId]
            );
            return result.rows.length > 0;
        } catch (error) {
            throw new DatabaseError(`Failed to check team: ${error.message}`, 'CHECK_TEAM', error);
        }
    }
}

export default new TeamRepository();
