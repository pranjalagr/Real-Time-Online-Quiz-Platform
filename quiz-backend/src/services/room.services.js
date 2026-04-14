import roomValidator from '../validators/room.validator.js';
import roomRepository from '../repositories/room.repositories.js';
import quizRepository from '../repositories/quiz.repositories.js';
import questionRepository from '../repositories/question.repositories.js';
import submissionRepository from '../repositories/submission.repositories.js';
import leaderboardRepository from '../repositories/leaderboard.repositories.js';
import teamRepository from '../repositories/team.repositories.js';
import codeGenerator from '../utils/codeGenerator.js';
import quizTimerService from './quiztimer.service.js';
import {
    IncorrectStateError,
    UserNotHostError,
    UserNotInRoomError,
    DuplicateUserInRoomError,
    ValidationError
} from '../models/errors.js';

class RoomService {
    async createRoom(hostId, roomMode) {
        roomValidator.validateCreateRoomInput({ hostId, roomMode });

        const roomCode = await codeGenerator.generateUniqueRoomCode();
        const room = await roomRepository.createRoom({
            host_id: hostId,
            room_code: roomCode,
            room_mode: roomMode
        });

        await roomRepository.addUserToRoom(room.id, hostId, 'host');

        return {
            roomId: room.id,
            roomCode: room.room_code,
            roomMode: room.room_mode,
            state: room.state
        };
    }

    async joinRoom(userId, roomCode, role = 'player', teamId = null) {
        roomValidator.validateJoinRoomInput({ playerId: userId, roomCode });

        const room = await roomRepository.getRoomByCode(roomCode);
        if (room.state !== 'LOBBY') {
            throw new IncorrectStateError(room.state, 'LOBBY', 'join room');
        }

        const isUserInRoom = await roomRepository.isUserInRoom(room.id, userId);
        if (isUserInRoom) {
            throw new DuplicateUserInRoomError(userId, room.id);
        }

        if (room.room_mode === 'TEAM') {
            if (!teamId) {
                throw new ValidationError('teamId is required for TEAM rooms');
            }

            const teamExists = await teamRepository.teamExistsInRoom(room.id, teamId);
            if (!teamExists) {
                throw new ValidationError('Team does not exist in this room');
            }
        }

        await roomRepository.addUserToRoom(room.id, userId, role, teamId);

        if (room.room_mode === 'SOLO') {
            await leaderboardRepository.createEntry(userId, null, room.id, 0);
        }

        return {
            roomId: room.id,
            roomCode: room.room_code,
            roomMode: room.room_mode,
            teamId
        };
    }

    async createTeams(roomId, userId, teamNames) {
        roomValidator.validateRoomId(Number(roomId));
        roomValidator.validateUserId(Number(userId));

        const isHost = await roomRepository.isUserHost(roomId, userId);
        if (!isHost) {
            throw new UserNotHostError(userId, roomId);
        }

        const room = await roomRepository.getRoomById(roomId);
        if (room.room_mode !== 'TEAM') {
            throw new ValidationError('Teams can only be created in TEAM mode rooms');
        }

        if (room.state !== 'LOBBY') {
            throw new IncorrectStateError(room.state, 'LOBBY', 'create teams');
        }

        const createdTeams = [];
        for (const teamName of teamNames) {
            const team = await teamRepository.createTeam({ room_id: roomId, team_name: teamName });
            await leaderboardRepository.createEntry(null, team.id, roomId, 0);
            createdTeams.push({
                teamId: team.id,
                teamName: team.team_name
            });
        }

        return createdTeams;
    }

    async startQuiz(roomId, userId) {
        roomValidator.validateRoomId(Number(roomId));
        roomValidator.validateUserId(Number(userId));

        const isHost = await roomRepository.isUserHost(Number(roomId), userId);
        if (!isHost) {
            throw new UserNotHostError(userId, roomId);
        }

        const room = await roomRepository.getRoomById(Number(roomId));
        if (room.state !== 'LOBBY') {
            throw new IncorrectStateError(room.state, 'LOBBY', 'start quiz');
        }

        const quiz = await quizRepository.getQuizByRoomId(room.id);
        if (!quiz) {
            throw new ValidationError('No quiz has been created for this room');
        }

        const questions = await questionRepository.getQuestionsByQuizId(quiz.id);
        if (questions.length === 0) {
            throw new ValidationError('Quiz has no questions');
        }

        await roomRepository.updateRoomState(room.id, 'LIVE');
        await quizTimerService.registerQuizTimer(room.id, quiz.id, quiz.duration_seconds);

        return {
            roomId: room.id,
            quizId: quiz.id,
            state: 'LIVE',
            firstQuestion: {
                id: questions[0].id,
                text: questions[0].question_text,
                options: questions[0].question_options,
                order: questions[0].question_order
            }
        };
    }

    async submitAnswer(userId, roomId, questionId, selectedOption, quizId = null, teamId = null) {
        roomValidator.validateUserId(userId);
        roomValidator.validateRoomId(Number(roomId));
        roomValidator.validateQuestionId(Number(questionId));
        roomValidator.validateSelectedOption(Number(selectedOption));

        const room = await roomRepository.getRoomById(Number(roomId));
        if (!(await roomRepository.isUserInRoom(room.id, userId))) {
            throw new UserNotInRoomError(userId, room.id);
        }

        if (room.state !== 'LIVE') {
            throw new IncorrectStateError(room.state, 'LIVE', 'submit answer');
        }

        const activeQuiz = quizId ? await quizRepository.getQuizById(Number(quizId)) : await quizRepository.getQuizByRoomId(room.id);
        if (!activeQuiz) {
            throw new ValidationError('No active quiz found for this room');
        }
        const question = await questionRepository.getQuestionById(Number(questionId));

        if (question.quizzes_id !== activeQuiz.id) {
            throw new ValidationError('Question does not belong to this quiz');
        }

        const effectiveTeamId = room.room_mode === 'TEAM'
            ? teamId || (await roomRepository.getUserTeamInRoom(userId, room.id))?.team_id
            : null;

        if (room.room_mode === 'TEAM' && !effectiveTeamId) {
            throw new ValidationError('User must belong to a team in TEAM mode');
        }

        const alreadyAnswered = room.room_mode === 'TEAM'
            ? await submissionRepository.hasTeamAnsweredQuestion(effectiveTeamId, question.id)
            : await submissionRepository.hasUserAnsweredQuestion(userId, question.id);

        if (alreadyAnswered) {
            throw new ValidationError('Answer already submitted');
        }

        const submission = await submissionRepository.submitAnswer(
            userId,
            effectiveTeamId,
            activeQuiz.id,
            question.id,
            Number(selectedOption)
        );

        const isCorrect = Number(selectedOption) === question.correct_option;
        if (isCorrect) {
            if (room.room_mode === 'TEAM') {
                await leaderboardRepository.updateTeamScore(effectiveTeamId, room.id, 1);
            } else {
                await leaderboardRepository.updateUserScore(userId, room.id, 1);
            }
        }

        return {
            submissionId: submission.id,
            quizId: activeQuiz.id,
            questionId: question.id,
            selectedOption: Number(selectedOption),
            correctOption: question.correct_option,
            isCorrect
        };
    }

    async endQuiz(roomId, userId) {
        roomValidator.validateRoomId(Number(roomId));

        if (userId && !(await roomRepository.isUserHost(Number(roomId), userId))) {
            throw new UserNotHostError(userId, roomId);
        }

        const room = await roomRepository.getRoomById(Number(roomId));
        if (room.state !== 'LIVE') {
            throw new IncorrectStateError(room.state, 'LIVE', 'end quiz');
        }

        const quiz = await quizRepository.getQuizByRoomId(room.id);
        if (quiz) {
            await quizTimerService.cancelQuizTimer(quiz.id);
        }

        await roomRepository.updateRoomState(room.id, 'ENDED');

        return {
            roomId: room.id,
            state: 'ENDED',
            finalLeaderboard: await this.getLeaderboard(room.id, room.host_id)
        };
    }

    async leaveRoom(roomId, userId) {
        if (!(await roomRepository.isUserInRoom(Number(roomId), userId))) {
            throw new UserNotInRoomError(userId, roomId);
        }

        const room = await roomRepository.getRoomById(Number(roomId));
        if (room.state !== 'LOBBY') {
            throw new IncorrectStateError(room.state, 'LOBBY', 'leave room');
        }

        return roomRepository.removeUserFromRoom(Number(roomId), userId);
    }

    async restartRoom(roomId, userId) {
        const room = await roomRepository.getRoomById(Number(roomId));
        if (!(await roomRepository.isUserHost(room.id, userId))) {
            throw new UserNotHostError(userId, roomId);
        }

        if (room.state !== 'ENDED') {
            throw new IncorrectStateError(room.state, 'ENDED', 'restart room');
        }

        const quiz = await quizRepository.getQuizByRoomId(room.id);
        if (quiz) {
            await submissionRepository.deleteSubmissionsByQuiz(quiz.id);
        }

        await leaderboardRepository.resetScoresByRoomId(room.id);
        await roomRepository.updateRoomState(room.id, 'LOBBY');

        return {
            roomId: room.id,
            state: 'LOBBY'
        };
    }

    async getRoomInfo(roomId, userId) {
        if (!(await roomRepository.isUserInRoom(Number(roomId), userId))) {
            throw new UserNotInRoomError(userId, roomId);
        }

        const room = await roomRepository.getRoomWithUsers(Number(roomId));
        const quiz = await quizRepository.getQuizByRoomId(Number(roomId));
        const teams = room.room_mode === 'TEAM' ? await teamRepository.getTeamsByRoomId(Number(roomId)) : [];

        return {
            ...room,
            currentQuiz: quiz,
            teams
        };
    }

    async getLeaderboard(roomId, userId) {
        if (!(await roomRepository.isUserInRoom(Number(roomId), userId))) {
            throw new UserNotInRoomError(userId, roomId);
        }

        const room = await roomRepository.getRoomById(Number(roomId));
        return room.room_mode === 'TEAM'
            ? leaderboardRepository.getTeamLeaderboard(room.id)
            : leaderboardRepository.getUserLeaderboard(room.id);
    }
}

export default new RoomService();
