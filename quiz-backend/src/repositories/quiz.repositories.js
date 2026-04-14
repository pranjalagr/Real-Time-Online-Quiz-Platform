import db from '../utils/database.js';
import { DatabaseError, NotFoundError } from '../models/errors.js';

class QuizRepository {
    async createQuiz({ room_id, duration_seconds, expires_at = null }) {
        try {
            const result = await db.query(
                `INSERT INTO quizzes (room_id, duration_seconds, expires_at)
                 VALUES ($1, $2, $3)
                 RETURNING id, room_id, duration_seconds, created_at, expires_at`,
                [room_id, duration_seconds, expires_at]
            );
            return result.rows[0];
        } catch (error) {
            throw new DatabaseError(`Failed to create quiz: ${error.message}`, 'CREATE_QUIZ', error);
        }
    }

    async getQuizById(quizId) {
        try {
            const result = await db.query(
                `SELECT id, room_id, duration_seconds, created_at, expires_at
                 FROM quizzes
                 WHERE id = $1`,
                [quizId]
            );
            if (result.rows.length === 0) {
                throw new NotFoundError('Quiz', quizId);
            }
            return result.rows[0];
        } catch (error) {
            if (error instanceof NotFoundError) {
                throw error;
            }
            throw new DatabaseError(`Failed to get quiz: ${error.message}`, 'GET_QUIZ', error);
        }
    }

    async getQuizByRoomId(roomId) {
        try {
            const result = await db.query(
                `SELECT id, room_id, duration_seconds, created_at, expires_at
                 FROM quizzes
                 WHERE room_id = $1
                 ORDER BY created_at DESC
                 LIMIT 1`,
                [roomId]
            );
            return result.rows[0] || null;
        } catch (error) {
            throw new DatabaseError(`Failed to get quiz by room: ${error.message}`, 'GET_QUIZ', error);
        }
    }

    async updateQuiz(quizId, updateData) {
        const fields = [];
        const values = [];
        let index = 1;

        if (updateData.duration_seconds !== undefined) {
            fields.push(`duration_seconds = $${index++}`);
            values.push(updateData.duration_seconds);
        }
        if (updateData.expires_at !== undefined) {
            fields.push(`expires_at = $${index++}`);
            values.push(updateData.expires_at);
        }

        values.push(quizId);

        try {
            const result = await db.query(
                `UPDATE quizzes
                 SET ${fields.join(', ')}
                 WHERE id = $${index}
                 RETURNING id, room_id, duration_seconds, created_at, expires_at`,
                values
            );
            if (result.rows.length === 0) {
                throw new NotFoundError('Quiz', quizId);
            }
            return result.rows[0];
        } catch (error) {
            if (error instanceof NotFoundError) {
                throw error;
            }
            throw new DatabaseError(`Failed to update quiz: ${error.message}`, 'UPDATE_QUIZ', error);
        }
    }

    async deleteQuiz(quizId) {
        try {
            const result = await db.query(
                'DELETE FROM quizzes WHERE id = $1 RETURNING id',
                [quizId]
            );
            return result.rows.length > 0;
        } catch (error) {
            throw new DatabaseError(`Failed to delete quiz: ${error.message}`, 'DELETE_QUIZ', error);
        }
    }

    async getQuizzesByHostId(hostId) {
        try {
            const result = await db.query(
                `SELECT q.id, q.room_id, q.duration_seconds, q.created_at, q.expires_at
                 FROM quizzes q
                 JOIN rooms r ON r.id = q.room_id
                 WHERE r.host_id = $1
                 ORDER BY q.created_at DESC`,
                [hostId]
            );
            return result.rows;
        } catch (error) {
            throw new DatabaseError(`Failed to get host quizzes: ${error.message}`, 'GET_QUIZZES', error);
        }
    }
}

export default new QuizRepository();
