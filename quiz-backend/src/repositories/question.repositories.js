import db from '../utils/database.js';
import { DatabaseError, NotFoundError, ValidationError } from '../models/errors.js';

class QuestionRepository {
    async createQuestion({ quiz_id, question_text, options, correct_option, question_order }) {
        if (!Array.isArray(options) || options.length !== 4) {
            throw new ValidationError('Question must have exactly 4 options');
        }

        try {
            const result = await db.query(
                `INSERT INTO questions (quizzes_id, question_text, question_options, correct_option, question_order)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING id, quizzes_id, question_text, question_options, correct_option, question_order`,
                [quiz_id, question_text, options, correct_option, question_order]
            );
            return result.rows[0];
        } catch (error) {
            throw new DatabaseError(`Failed to create question: ${error.message}`, 'CREATE_QUESTION', error);
        }
    }

    async createMultipleQuestions(quizId, questions) {
        const created = [];
        for (const question of questions) {
            created.push(await this.createQuestion({ quiz_id: quizId, ...question }));
        }
        return created;
    }

    async getQuestionById(questionId) {
        try {
            const result = await db.query(
                `SELECT id, quizzes_id, question_text, question_options, correct_option, question_order
                 FROM questions
                 WHERE id = $1`,
                [questionId]
            );
            if (result.rows.length === 0) {
                throw new NotFoundError('Question', questionId);
            }
            return result.rows[0];
        } catch (error) {
            if (error instanceof NotFoundError) {
                throw error;
            }
            throw new DatabaseError(`Failed to get question: ${error.message}`, 'GET_QUESTION', error);
        }
    }

    async getQuestionsByQuizId(quizId) {
        try {
            const result = await db.query(
                `SELECT id, quizzes_id, question_text, question_options, correct_option, question_order
                 FROM questions
                 WHERE quizzes_id = $1
                 ORDER BY question_order ASC`,
                [quizId]
            );
            return result.rows;
        } catch (error) {
            throw new DatabaseError(`Failed to get quiz questions: ${error.message}`, 'GET_QUESTIONS', error);
        }
    }

    async updateQuestion(questionId, updateData) {
        const fields = [];
        const values = [];
        let index = 1;

        if (updateData.question_text !== undefined) {
            fields.push(`question_text = $${index++}`);
            values.push(updateData.question_text);
        }
        if (updateData.options !== undefined) {
            fields.push(`question_options = $${index++}`);
            values.push(updateData.options);
        }
        if (updateData.correct_option !== undefined) {
            fields.push(`correct_option = $${index++}`);
            values.push(updateData.correct_option);
        }

        if (fields.length === 0) {
            throw new ValidationError('No fields to update');
        }

        values.push(questionId);

        try {
            const result = await db.query(
                `UPDATE questions
                 SET ${fields.join(', ')}
                 WHERE id = $${index}
                 RETURNING id, quizzes_id, question_text, question_options, correct_option, question_order`,
                values
            );
            if (result.rows.length === 0) {
                throw new NotFoundError('Question', questionId);
            }
            return result.rows[0];
        } catch (error) {
            if (error instanceof NotFoundError || error instanceof ValidationError) {
                throw error;
            }
            throw new DatabaseError(`Failed to update question: ${error.message}`, 'UPDATE_QUESTION', error);
        }
    }

    async deleteQuestion(questionId) {
        try {
            const result = await db.query(
                'DELETE FROM questions WHERE id = $1 RETURNING id',
                [questionId]
            );
            return result.rows.length > 0;
        } catch (error) {
            throw new DatabaseError(`Failed to delete question: ${error.message}`, 'DELETE_QUESTION', error);
        }
    }

    async deleteQuestionsByQuizId(quizId) {
        try {
            const result = await db.query(
                'DELETE FROM questions WHERE quizzes_id = $1',
                [quizId]
            );
            return result.rowCount;
        } catch (error) {
            throw new DatabaseError(`Failed to delete quiz questions: ${error.message}`, 'DELETE_QUESTIONS', error);
        }
    }
}

export default new QuestionRepository();
