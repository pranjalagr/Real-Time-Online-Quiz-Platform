import express from 'express';
import quizController from '../controllers/quiz.controllers.js';
import { authMiddleware } from '../middlewares/auth.middlewares.js';

const router = express.Router();

/**
 * POST /api/quizzes
 * Create a new quiz
 * @requires authentication
 * @body { title: string, description: string, topic: string, timeLimit: number }
 */
router.post('/', authMiddleware, quizController.createQuiz);
router.post('/pdf/upload', authMiddleware, quizController.createPdfUpload);
router.post('/pdf/finalize', authMiddleware, quizController.finalizePdfQuiz);
router.get('/pdf/jobs/:jobId', authMiddleware, quizController.getPdfJobStatus);

/**
 * GET /api/quizzes/:quizId
 * Get quiz details
 * @requires authentication
 * @param { quizId: number }
 */
router.get('/:quizId', authMiddleware, quizController.getQuiz);

/**
 * PUT /api/quizzes/:quizId
 * Update quiz details
 * @requires authentication (host/creator only)
 * @param { quizId: number }
 * @body { title?: string, description?: string, timeLimit?: number }
 */
router.put('/:quizId', authMiddleware, quizController.updateQuiz);

/**
 * DELETE /api/quizzes/:quizId
 * Delete quiz
 * @requires authentication (host/creator only)
 * @param { quizId: number }
 */
router.delete('/:quizId', authMiddleware, quizController.deleteQuiz);

/**
 * GET /api/quizzes/:quizId/questions
 * Get all questions for a quiz
 * @requires authentication
 * @param { quizId: number }
 */
router.get('/:quizId/questions', authMiddleware, quizController.getQuizQuestions);

/**
 * GET /api/quizzes/:quizId/results
 * Get quiz results and analytics
 * @requires authentication
 * @param { quizId: number }
 */
router.get('/:quizId/results', authMiddleware, quizController.getQuizResults);

/**
 * GET /api/quizzes/user/:userId
 * Get all quizzes created by user
 * @requires authentication
 * @param { userId: number }
 */
router.get('/user/:userId/created', authMiddleware, quizController.getUserQuizzes);

export default router;
