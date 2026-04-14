import quizService from '../services/quiz.service.js';
import { ValidationError, UserNotHostError, NotFoundError, IncorrectStateError } from '../models/errors.js';

class QuizController {
    async createQuiz(req, res) {
        try {
            const { roomId, durationSeconds, questions = [] } = req.body;
            const result = await quizService.createQuiz(req.user.id, roomId, durationSeconds, questions);
            return res.status(201).json({ success: true, data: result });
        } catch (error) {
            console.error('Create quiz error:', error);
            if (error instanceof ValidationError) {
                return res.status(400).json({ error: error.message });
            }
            if (error instanceof UserNotHostError) {
                return res.status(403).json({ error: error.message });
            }
            if (error instanceof IncorrectStateError) {
                return res.status(409).json({ error: error.message });
            }
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    async getQuiz(req, res) {
        try {
            const result = await quizService.getQuiz(req.params.quizId, req.user.id);
            return res.status(200).json({ success: true, data: result });
        } catch (error) {
            console.error('Get quiz error:', error);
            if (error instanceof NotFoundError) {
                return res.status(404).json({ error: error.message });
            }
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    async updateQuiz(req, res) {
        try {
            const result = await quizService.updateQuiz(req.params.quizId, req.user.id, req.body.durationSeconds);
            return res.status(200).json({ success: true, data: result });
        } catch (error) {
            console.error('Update quiz error:', error);
            if (error instanceof ValidationError) {
                return res.status(400).json({ error: error.message });
            }
            if (error instanceof UserNotHostError) {
                return res.status(403).json({ error: error.message });
            }
            if (error instanceof IncorrectStateError) {
                return res.status(409).json({ error: error.message });
            }
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    async deleteQuiz(req, res) {
        try {
            await quizService.deleteQuiz(req.params.quizId, req.user.id);
            return res.status(200).json({ success: true, message: 'Quiz deleted successfully' });
        } catch (error) {
            console.error('Delete quiz error:', error);
            if (error instanceof UserNotHostError) {
                return res.status(403).json({ error: error.message });
            }
            if (error instanceof IncorrectStateError) {
                return res.status(409).json({ error: error.message });
            }
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    async getQuizQuestions(req, res) {
        try {
            const result = await quizService.getQuizQuestions(req.params.quizId);
            return res.status(200).json({ success: true, data: result });
        } catch (error) {
            console.error('Get quiz questions error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    async getQuizResults(req, res) {
        try {
            const result = await quizService.getQuizResults(req.params.quizId);
            return res.status(200).json({ success: true, data: result });
        } catch (error) {
            console.error('Get quiz results error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    async getUserQuizzes(req, res) {
        try {
            const result = await quizService.getUserQuizzes(req.params.userId, req.user.id);
            return res.status(200).json({ success: true, data: result });
        } catch (error) {
            console.error('Get user quizzes error:', error);
            if (error instanceof ValidationError) {
                return res.status(403).json({ error: error.message });
            }
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    async createPdfUpload(req, res) {
        try {
            const { roomId, durationSeconds, numQuestions } = req.body;
            const result = await quizService.createPdfUpload(req.user.id, roomId, durationSeconds, numQuestions);
            return res.status(201).json({ success: true, data: result });
        } catch (error) {
            console.error('Create pdf upload error:', error);
            if (error instanceof ValidationError) {
                return res.status(400).json({ error: error.message });
            }
            if (error instanceof UserNotHostError) {
                return res.status(403).json({ error: error.message });
            }
            if (error instanceof IncorrectStateError) {
                return res.status(409).json({ error: error.message });
            }
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    async finalizePdfQuiz(req, res) {
        try {
            const { quizId, additionalPrompt = '' } = req.body;
            const result = await quizService.finalizePdfQuiz(req.user.id, quizId, additionalPrompt);
            return res.status(202).json({ success: true, data: result });
        } catch (error) {
            console.error('Finalize pdf quiz error:', error);
            if (error instanceof ValidationError) {
                return res.status(400).json({ error: error.message });
            }
            if (error instanceof UserNotHostError) {
                return res.status(403).json({ error: error.message });
            }
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    async getPdfJobStatus(req, res) {
        try {
            const result = await quizService.getPdfJobStatus(req.params.jobId);
            return res.status(200).json({ success: true, data: result });
        } catch (error) {
            console.error('Get pdf job status error:', error);
            if (error instanceof NotFoundError) {
                return res.status(404).json({ error: error.message });
            }
            if (error instanceof ValidationError) {
                return res.status(400).json({ error: error.message });
            }
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
}

export default new QuizController();
