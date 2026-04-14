import express from 'express';
import questionController from '../controllers/question.controllers.js';
import { authMiddleware } from '../middlewares/auth.middlewares.js';

const router = express.Router();

/**
 * POST /api/questions
 * Create a new question
 * @requires authentication
 * @body { quizId: number, questionText: string, options: string[], correctOption: number, order: number }
 */
router.post('/', authMiddleware, questionController.createQuestion);

/**
 * GET /api/questions/:questionId
 * Get question details
 * @requires authentication
 * @param { questionId: number }
 */
router.get('/:questionId', authMiddleware, questionController.getQuestion);

/**
 * PUT /api/questions/:questionId
 * Update question
 * @requires authentication (quiz creator only)
 * @param { questionId: number }
 * @body { questionText?: string, options?: string[], correctOption?: number }
 */
router.put('/:questionId', authMiddleware, questionController.updateQuestion);

/**
 * DELETE /api/questions/:questionId
 * Delete question
 * @requires authentication (quiz creator only)
 * @param { questionId: number }
 */
router.delete('/:questionId', authMiddleware, questionController.deleteQuestion);

/**
 * POST /api/questions/batch
 * Create multiple questions at once
 * @requires authentication
 * @body { quizId: number, questions: Array<{questionText, options, correctOption}> }
 */
router.post('/batch/create', authMiddleware, questionController.createBatchQuestions);

/**
 * GET /api/questions/quiz/:quizId
 * Get all questions for a quiz (with answers hidden)
 * @requires authentication
 * @param { quizId: number }
 */
router.get('/quiz/:quizId/all', authMiddleware, questionController.getQuizAllQuestions);

export default router;