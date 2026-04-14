import questionService from '../services/question.service.js';
import { ValidationError, UserNotHostError, NotFoundError, IncorrectStateError } from '../models/errors.js';

class QuestionController {
    async createQuestion(req, res) {
        try {
            const { quizId, questionText, options, correctOption, order } = req.body;
            const result = await questionService.createQuestion(req.user.id, quizId, questionText, options, correctOption, order);
            return res.status(201).json({ success: true, data: result });
        } catch (error) {
            console.error('Create question error:', error);
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

    async getQuestion(req, res) {
        try {
            const result = await questionService.getQuestion(req.params.questionId);
            return res.status(200).json({ success: true, data: result });
        } catch (error) {
            console.error('Get question error:', error);
            if (error instanceof NotFoundError) {
                return res.status(404).json({ error: error.message });
            }
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    async updateQuestion(req, res) {
        try {
            const { questionText, options, correctOption } = req.body;
            const result = await questionService.updateQuestion(req.params.questionId, req.user.id, questionText, options, correctOption);
            return res.status(200).json({ success: true, data: result });
        } catch (error) {
            console.error('Update question error:', error);
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

    async deleteQuestion(req, res) {
        try {
            await questionService.deleteQuestion(req.params.questionId, req.user.id);
            return res.status(200).json({ success: true, message: 'Question deleted successfully' });
        } catch (error) {
            console.error('Delete question error:', error);
            if (error instanceof UserNotHostError) {
                return res.status(403).json({ error: error.message });
            }
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    async createBatchQuestions(req, res) {
        try {
            const result = await questionService.createBatchQuestions(req.user.id, req.body.quizId, req.body.questions || []);
            return res.status(201).json({ success: true, data: result });
        } catch (error) {
            console.error('Create batch questions error:', error);
            if (error instanceof ValidationError) {
                return res.status(400).json({ error: error.message });
            }
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    async getQuizAllQuestions(req, res) {
        try {
            const result = await questionService.getQuizAllQuestions(req.params.quizId);
            return res.status(200).json({ success: true, data: result });
        } catch (error) {
            console.error('Get quiz questions error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
}

export default new QuestionController();
