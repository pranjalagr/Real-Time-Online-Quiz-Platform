import express from 'express';
import submissionController from '../controllers/submission.controllers.js';
import { authMiddleware } from '../middlewares/auth.middlewares.js';

const router = express.Router();

router.get('/:submissionId', authMiddleware, submissionController.getSubmission);
router.get('/quiz/:quizId/all', authMiddleware, submissionController.getQuizSubmissions);

export default router;
