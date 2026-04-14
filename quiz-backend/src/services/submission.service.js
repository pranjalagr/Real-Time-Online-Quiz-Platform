import submissionRepository from '../repositories/submission.repositories.js';
import { ValidationError } from '../models/errors.js';

class SubmissionService {
    async getSubmission(submissionId) {
        return submissionRepository.getSubmissionById(Number(submissionId));
    }

    async getQuizSubmissions(quizId) {
        return submissionRepository.getSubmissionsByQuiz(Number(quizId));
    }
}

export default new SubmissionService();
