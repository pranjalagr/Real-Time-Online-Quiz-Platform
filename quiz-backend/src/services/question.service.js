import questionRepository from '../repositories/question.repositories.js';
import quizRepository from '../repositories/quiz.repositories.js';
import roomRepository from '../repositories/room.repositories.js';
import { ValidationError, NotFoundError, UserNotHostError, IncorrectStateError } from '../models/errors.js';

class QuestionService {
    async createQuestion(userId, quizId, questionText, options, correctOption, order) {
        const quiz = await quizRepository.getQuizById(Number(quizId));
        const room = await roomRepository.getRoomById(quiz.room_id);

        if (!(await roomRepository.isUserHost(room.id, userId))) {
            throw new UserNotHostError(userId, room.id);
        }

        if (room.state !== 'LOBBY') {
            throw new IncorrectStateError(room.state, 'LOBBY', 'create question');
        }

        return questionRepository.createQuestion({
            quiz_id: quiz.id,
            question_text: questionText,
            options,
            correct_option: correctOption,
            question_order: order
        });
    }

    async getQuestion(questionId) {
        return questionRepository.getQuestionById(Number(questionId));
    }

    async updateQuestion(questionId, userId, questionText, options, correctOption) {
        const question = await questionRepository.getQuestionById(Number(questionId));
        const quiz = await quizRepository.getQuizById(question.quizzes_id);
        const room = await roomRepository.getRoomById(quiz.room_id);

        if (!(await roomRepository.isUserHost(room.id, userId))) {
            throw new UserNotHostError(userId, room.id);
        }

        if (room.state !== 'LOBBY') {
            throw new IncorrectStateError(room.state, 'LOBBY', 'update question');
        }

        return questionRepository.updateQuestion(question.id, {
            question_text: questionText,
            options,
            correct_option: correctOption
        });
    }

    async deleteQuestion(questionId, userId) {
        const question = await questionRepository.getQuestionById(Number(questionId));
        const quiz = await quizRepository.getQuizById(question.quizzes_id);
        const room = await roomRepository.getRoomById(quiz.room_id);

        if (!(await roomRepository.isUserHost(room.id, userId))) {
            throw new UserNotHostError(userId, room.id);
        }

        if (room.state !== 'LOBBY') {
            throw new IncorrectStateError(room.state, 'LOBBY', 'delete question');
        }

        return questionRepository.deleteQuestion(question.id);
    }

    async createBatchQuestions(userId, quizId, questions) {
        const created = [];
        for (const [index, question] of questions.entries()) {
            created.push(await this.createQuestion(
                userId,
                quizId,
                question.questionText,
                question.options,
                question.correctOption,
                question.order || index + 1
            ));
        }
        return created;
    }

    async getQuizAllQuestions(quizId) {
        await quizRepository.getQuizById(Number(quizId));
        return questionRepository.getQuestionsByQuizId(Number(quizId));
    }
}

export default new QuestionService();