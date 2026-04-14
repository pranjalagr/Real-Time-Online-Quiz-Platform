import { Server } from 'socket.io';
import authService from '../services/auth.services.js';
import roomService from '../services/room.services.js';
import leaderboardService from '../services/leaderboard.service.js';

export function initSockets(httpServer) {
    const io = new Server(httpServer, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        }
    });

    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token;
            if (!token) {
                return next(new Error('Unauthorized'));
            }

            socket.user = await authService.verifyToken(token);
            next();
        } catch {
            next(new Error('Unauthorized'));
        }
    });

    io.on('connection', (socket) => {
        const userId = socket.user.id;

        socket.on('CREATE_ROOM', async ({ roomMode }) => {
            const result = await roomService.createRoom(userId, roomMode);
            socket.join(`room:${result.roomId}`);
            socket.emit('ROOM_CREATED', result);
        });

        socket.on('JOIN_ROOM', async ({ roomCode, teamId }) => {
            const result = await roomService.joinRoom(userId, roomCode, 'player', teamId);
            socket.join(`room:${result.roomId}`);
            socket.emit('JOINED_ROOM', result);
        });

        socket.on('START_QUIZ', async ({ roomId }) => {
            const result = await roomService.startQuiz(roomId, userId);
            io.to(`room:${result.roomId}`).emit('QUIZ_STARTED', result);
        });

        socket.on('SUBMIT_ANSWER', async ({ roomId, questionId, selectedOption, quizId, teamId }) => {
            const result = await roomService.submitAnswer(userId, roomId, questionId, selectedOption, quizId, teamId);
            socket.emit('ANSWER_RESULT', result);
        });

        socket.on('GET_LEADERBOARD', async ({ roomId }) => {
            const leaderboard = await leaderboardService.getRoomLeaderboard(roomId, userId);
            socket.emit('LEADERBOARD', leaderboard);
        });
    });

    return io;
}
