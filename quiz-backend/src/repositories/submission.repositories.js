import db from '../utils/database.js';
import { DatabaseError, NotFoundError, ValidationError } from '../models/errors.js';

class SubmissionRepository {
    async submitAnswer(userId, teamId, quizId, questionId, selectedOption) {
        if (selectedOption < 1 || selectedOption > 4) {
            throw new ValidationError('Selected option must be between 1 and 4');
        }

        try {
            const result = await db.query(
                `INSERT INTO submissions (user_id, team_id, quiz_id, questions_id, selected_option)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING id, user_id, team_id, quiz_id, questions_id, selected_option, submitted_at`,
                [userId, teamId, quizId, questionId, selectedOption]
            );
            return result.rows[0];
        } catch (error) {
            if (error.code === '23505') {
                throw new ValidationError('Answer already submitted');
            }
            throw new DatabaseError(`Failed to submit answer: ${error.message}`, 'SUBMIT_ANSWER', error);
        }
    }

    async getSubmissionById(submissionId) {
        try {
            const result = await db.query(
                `SELECT id, user_id, team_id, quiz_id, questions_id, selected_option, submitted_at
                 FROM submissions
                 WHERE id = $1`,
                [submissionId]
            );
            if (result.rows.length === 0) {
                throw new NotFoundError('Submission', submissionId);
            }
            return result.rows[0];
        } catch (error) {
            if (error instanceof NotFoundError) {
                throw error;
            }
            throw new DatabaseError(`Failed to get submission: ${error.message}`, 'GET_SUBMISSION', error);
        }
    }

    async getSubmissionsByQuiz(quizId) {
        try {
            const result = await db.query(
                `SELECT id, user_id, team_id, quiz_id, questions_id, selected_option, submitted_at
                 FROM submissions
                 WHERE quiz_id = $1
                 ORDER BY submitted_at ASC`,
                [quizId]
            );
            return result.rows;
        } catch (error) {
            throw new DatabaseError(`Failed to get quiz submissions: ${error.message}`, 'GET_SUBMISSIONS', error);
        }
    }

    async deleteSubmissionsByQuiz(quizId) {
        try {
            const result = await db.query(
                'DELETE FROM submissions WHERE quiz_id = $1',
                [quizId]
            );
            return result.rowCount;
        } catch (error) {
            throw new DatabaseError(`Failed to delete quiz submissions: ${error.message}`, 'DELETE_SUBMISSIONS', error);
        }
    }
}

export default new SubmissionRepository();
