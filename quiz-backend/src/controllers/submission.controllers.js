import submissionService from '../services/submission.service.js';
import { NotFoundError } from '../models/errors.js';

class SubmissionController {
    async getSubmission(req, res) {
        try {
            const result = await submissionService.getSubmission(req.params.submissionId);
            return res.status(200).json({ success: true, data: result });
        } catch (error) {
            console.error('Get submission error:', error);
            if (error instanceof NotFoundError) {
                return res.status(404).json({ error: error.message });
            }
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    async getQuizSubmissions(req, res) {
        try {
            const result = await submissionService.getQuizSubmissions(req.params.quizId);
            return res.status(200).json({ success: true, data: result });
        } catch (error) {
            console.error('Get quiz submissions error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
}

export default new SubmissionController();
