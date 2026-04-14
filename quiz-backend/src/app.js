import express from 'express';
import cors from 'cors';
import roomRoutes from './routes/room.routes.js';
import authRoutes from './routes/auth.routes.js';
import quizRoutes from './routes/quiz.routes.js';
import questionRoutes from './routes/question.routes.js';
import submissionRoutes from './routes/submission.routes.js';
import leaderboardRoutes from './routes/leaderboard.routes.js';
import userRoutes from './routes/user.routes.js';
// import adminRoutes from './routes/admin.routes.js';
import {
    errorHandler,
    requestLogger,
    rateLimiter,
    securityHeaders
} from './middlewares/auth.middlewares.js';

const app = express();

// =============== GLOBAL MIDDLEWARES ===============
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Security headers
app.use(securityHeaders);

// Request logging
app.use(requestLogger);

// Rate limiting (100 requests per 15 minutes)
if (process.env.NODE_ENV !== 'development') {
  app.use(rateLimiter(15 * 60 * 1000, 100));
}


// =============== API ROUTES ===============
// Public routes (no authentication required)
app.use('/api/auth', authRoutes);

// Protected routes (authentication required)
app.use('/api/rooms', roomRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/leaderboards', leaderboardRoutes);
app.use('/api/users', userRoutes);

// Admin routes (admin role required)
// app.use('/api/admin', adminRoutes);

// =============== HEALTH & STATUS ENDPOINTS ===============
/**
 * GET /health
 * Server health check endpoint
 */
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

/**
 * GET /api/status
 * Detailed server status
 */
app.get('/api/status', (req, res) => {
    res.status(200).json({
        success: true,
        server: {
            status: 'online',
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',
            version: process.env.API_VERSION || '1.0.0'
        },
        timestamp: new Date().toISOString()
    });
});

// =============== API DOCUMENTATION ===============
/**
 * GET /api/docs
 * API documentation endpoint
 */
app.get('/api/docs', (req, res) => {
    const docs = {
        title: 'Quiz Backend API',
        version: '1.0.0',
        baseUrl: `${req.protocol}://${req.get('host')}/api`,
        endpoints: {
            auth: {
                register: 'POST /api/auth/register',
                login: 'POST /api/auth/login',
                guest: 'POST /api/auth/guest'
            },
            rooms: {
                create: 'POST /api/rooms/create',
                join: 'POST /api/rooms/join',
                start: 'POST /api/rooms/:roomId/start',
                end: 'POST /api/rooms/:roomId/end',
                leave: 'POST /api/rooms/:roomId/leave',
                restart: 'POST /api/rooms/:roomId/restart',
                submitAnswer: 'POST /api/rooms/:roomId/questions/:questionId/submit',
                getRoomInfo: 'GET /api/rooms/:roomId',
                getLeaderboard: 'GET /api/rooms/:roomId/leaderboard'
            },
            quizzes: {
                create: 'POST /api/quizzes',
                createPdfUpload: 'POST /api/quizzes/pdf/upload',
                finalizePdfQuiz: 'POST /api/quizzes/pdf/finalize',
                getPdfJobStatus: 'GET /api/quizzes/pdf/jobs/:jobId',
                get: 'GET /api/quizzes/:quizId',
                update: 'PUT /api/quizzes/:quizId',
                delete: 'DELETE /api/quizzes/:quizId',
                getQuestions: 'GET /api/quizzes/:quizId/questions',
                getResults: 'GET /api/quizzes/:quizId/results'
            },
            questions: {
                create: 'POST /api/questions',
                get: 'GET /api/questions/:questionId',
                update: 'PUT /api/questions/:questionId',
                delete: 'DELETE /api/questions/:questionId',
                createBatch: 'POST /api/questions/batch/create',
                getQuizQuestions: 'GET /api/questions/quiz/:quizId/all'
            },
            submissions: {
                get: 'GET /api/submissions/:submissionId',
                getQuizSubmissions: 'GET /api/submissions/quiz/:quizId/all'
            },
            leaderboards: {
                getRoomLeaderboard: 'GET /api/leaderboards/room/:roomId',
                getQuizLeaderboard: 'GET /api/leaderboards/quiz/:quizId',
                getUserLeaderboard: 'GET /api/leaderboards/user/:userId',
                getGlobalLeaderboard: 'GET /api/leaderboards/global/top',
                getRoomTeamLeaderboard: 'GET /api/leaderboards/room/:roomId/team'
            },
            users: {
                getCurrentUser: 'GET /api/users/me',
                getProfile: 'GET /api/users/:userId',
                updateProfile: 'PUT /api/users/me',
                deleteAccount: 'DELETE /api/users/me'
            },
            // admin: {
            //     getPlatformStats: 'GET /api/admin/stats',
            //     getAllUsers: 'GET /api/admin/users',
            //     getAllQuizzes: 'GET /api/admin/quizzes',
            //     deleteUser: 'DELETE /api/admin/users/:userId',
            //     deleteQuiz: 'DELETE /api/admin/quizzes/:quizId',
            //     getReports: 'GET /api/admin/reports'
            // }
        }
    };
    res.status(200).json(docs);
});

// =============== 404 NOT FOUND ===============
app.use('/{*any}', (req, res) => {
    res.status(404).json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: `Endpoint ${req.method} ${req.path} not found`,
            path: req.path,
            method: req.method,
            timestamp: new Date().toISOString(),
            suggestion: 'Check available endpoints at GET /api/docs'
        }
    });
});

// =============== ERROR HANDLING (MUST BE LAST) ===============
app.use(errorHandler);

export default app;
