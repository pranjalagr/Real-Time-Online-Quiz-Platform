import quizRepository from '../repositories/quiz.repositories.js';
import questionRepository from '../repositories/question.repositories.js';
import roomRepository from '../repositories/room.repositories.js';
import pdfQuizGenerator from './quizservices/generators/pdfquiz.js';
import { ValidationError, NotFoundError, UserNotHostError, IncorrectStateError } from '../models/errors.js';

class QuizService {
    async createQuiz(userId, roomId, durationSeconds, questions = []) {
        if (!userId || !roomId || !durationSeconds) {
            throw new ValidationError('userId, roomId and durationSeconds are required');
        }

        const room = await roomRepository.getRoomById(Number(roomId));
        if (!(await roomRepository.isUserHost(room.id, userId))) {
            throw new UserNotHostError(userId, room.id);
        }

        if (room.state !== 'LOBBY') {
            throw new IncorrectStateError(room.state, 'LOBBY', 'create quiz');
        }

        const quiz = await quizRepository.createQuiz({
            room_id: room.id,
            duration_seconds: Number(durationSeconds)
        });

        if (Array.isArray(questions) && questions.length > 0) {
            await questionRepository.createMultipleQuestions(quiz.id, questions.map((question, index) => ({
                question_text: question.questionText,
                options: question.options,
                correct_option: question.correctOption,
                question_order: question.order || index + 1
            })));
        }

        return this.getQuiz(quiz.id, userId);
    }

    async getQuiz(quizId) {
        const quiz = await quizRepository.getQuizById(Number(quizId));
        const questions = await questionRepository.getQuestionsByQuizId(quiz.id);
        return { ...quiz, questions };
    }

    async updateQuiz(quizId, userId, durationSeconds) {
        const quiz = await quizRepository.getQuizById(Number(quizId));
        const room = await roomRepository.getRoomById(quiz.room_id);

        if (!(await roomRepository.isUserHost(room.id, userId))) {
            throw new UserNotHostError(userId, room.id);
        }

        if (room.state !== 'LOBBY') {
            throw new IncorrectStateError(room.state, 'LOBBY', 'update quiz');
        }

        return quizRepository.updateQuiz(quiz.id, { duration_seconds: Number(durationSeconds) });
    }

    async deleteQuiz(quizId, userId) {
        const quiz = await quizRepository.getQuizById(Number(quizId));
        const room = await roomRepository.getRoomById(quiz.room_id);

        if (!(await roomRepository.isUserHost(room.id, userId))) {
            throw new UserNotHostError(userId, room.id);
        }

        if (room.state !== 'LOBBY') {
            throw new IncorrectStateError(room.state, 'LOBBY', 'delete quiz');
        }

        await questionRepository.deleteQuestionsByQuizId(quiz.id);
        return quizRepository.deleteQuiz(quiz.id);
    }

    async getQuizQuestions(quizId) {
        await quizRepository.getQuizById(Number(quizId));
        return questionRepository.getQuestionsByQuizId(Number(quizId));
    }

    async getQuizResults(quizId) {
        return this.getQuiz(quizId);
    }

    async getUserQuizzes(userId, currentUserId) {
        if (Number(userId) !== Number(currentUserId)) {
            throw new ValidationError('Access denied');
        }
        return quizRepository.getQuizzesByHostId(Number(userId));
    }

    async createPdfUpload(userId, roomId, durationSeconds, numQuestions) {
        return pdfQuizGenerator.generateUploadUrl(userId, Number(roomId), Number(durationSeconds), Number(numQuestions));
    }

    async finalizePdfQuiz(userId, quizId, additionalPrompt = '') {
        const quiz = await quizRepository.getQuizById(Number(quizId));
        const room = await roomRepository.getRoomById(quiz.room_id);

        if (!(await roomRepository.isUserHost(room.id, userId))) {
            throw new UserNotHostError(userId, room.id);
        }

        return pdfQuizGenerator.queueUploadedPdf({
            quizId: Number(quizId),
            userId,
            additionalPrompt
        });
    }

    async getPdfJobStatus(jobId) {
        return pdfQuizGenerator.getJobStatus(jobId);
    }
}

export default new QuizService();