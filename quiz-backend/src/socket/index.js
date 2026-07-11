import { Server } from 'socket.io';
import authService from '../services/auth.service.js';
import roomService from '../services/room.service.js';
import { attachSocketRedisAdapter } from './redis.adapter.js';

/**
 * Create the Socket.IO server and connect it to Redis.
 *
 * Call flow:
 * - `server.js` creates the HTTP server.
 * - `server.js` calls this function with that HTTP server.
 * - this function creates Socket.IO and attaches the Redis adapter.
 * - every socket event below can now broadcast across all backend instances.
 */
export async function initSockets(httpServer) {
    const io = new Server(httpServer, {
    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true
    }
    });
    await attachSocketRedisAdapter(io);

    // Authenticate every socket before it is allowed to join rooms or emit actions.
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
        // Every connected socket is tied to one authenticated user.
        const userId = socket.user.id;

        // CREATE_ROOM: host creates a room, joins that room locally, and receives the room metadata back.
        socket.on('CREATE_ROOM', safeSocketHandler(socket, async ({ roomMode }) => {
            const result = await roomService.createRoom(userId, roomMode);
            socket.join(`room:${result.roomId}`);
            socket.emit('ROOM_CREATED', result);
        }, 'CREATE_ROOM'));

        // JOIN_ROOM: player joins a room and the room membership becomes visible to all Socket.IO servers.
        socket.on('JOIN_ROOM', safeSocketHandler(socket, async ({ roomCode, teamId }) => {
            const result = await roomService.joinRoom(userId, roomCode, 'player', teamId);
            socket.join(`room:${result.roomId}`);
            io.to(`room:${result.roomId}`).emit('PLAYER_JOINED', {
                userId,
                roomId: result.roomId,
                teamId: result.teamId
            });
            socket.emit('JOINED_ROOM', result);
        }, 'JOIN_ROOM'));

        // SYNC_ROOM: attach the socket to an already joined room after an HTTP create/join flow.
        socket.on('SYNC_ROOM', safeSocketHandler(socket, async ({ roomId }) => {
            const room = await roomService.getRoomInfo(roomId, userId);
            socket.join(`room:${roomId}`);
            return {
                roomId: Number(roomId),
                roomCode: room.room_code,
                state: room.state
            };
        }, 'SYNC_ROOM'));

        // START_QUIZ: host starts the quiz; the Redis adapter forwards the broadcast to all servers.
        socket.on('START_QUIZ', safeSocketHandler(socket, async ({ roomId }) => {
            const result = await roomService.startQuiz(roomId, userId);
            io.to(`room:${result.roomId}`).emit('QUIZ_STARTED', result);
            return result;
        }, 'START_QUIZ'));

        // SUBMIT_ANSWER: hand the request to the submission flow that locks Redis, queues the job, and then updates live state.
        socket.on('SUBMIT_ANSWER', safeSocketHandler(socket, async ({ roomId, questionId, selectedOption, quizId, teamId }) => {
            const result = await roomService.submitAnswer(userId, roomId, questionId, selectedOption, quizId, teamId);
            socket.emit('ANSWER_QUEUED', result);
            return result;
        }, 'SUBMIT_ANSWER'));
        // GET_LEADERBOARD: direct request/response path for a single client.
        socket.on('GET_LEADERBOARD', safeSocketHandler(socket, async ({ roomId }) => {
            const leaderboard = await roomService.getLeaderboard(roomId, userId);
            socket.emit('LEADERBOARD', leaderboard);
        }, 'GET_LEADERBOARD'));
    });

    return io;
}

/**
 * Wrap a socket handler so one failing event does not crash the connection.
 * The wrapper keeps event code small and gives us one place to log and respond with errors.
 */
function safeSocketHandler(socket, handler, eventName) {
    return async (payload, ack) => {
        try {
            const result = await handler(payload);
            if (typeof ack === 'function') {
                ack({ success: true, data: result || null });
            }
        } catch (error) {
            console.error(`Socket event failed: ${eventName}`, error);
            if (typeof ack === 'function') {
                ack({
                    success: false,
                    error: error.message || 'Socket event failed'
                });
                return;
            }
            socket.emit('SOCKET_ERROR', {
                event: eventName,
                message: error.message || 'Socket event failed'
            });
        }
    };
}
