import express from 'express';
import authController from '../controllers/auth.controllers.js';
import { rateLimiter } from '../middlewares/auth.middlewares.js';

const router = express.Router();

// Apply strict rate limiting to auth routes (5 requests per 15 minutes)
const authRateLimiter =
  process.env.NODE_ENV === 'development'
    ? (req, res, next) => next()
    : rateLimiter(15 * 60 * 1000, 5);

/**
 * POST /api/auth/register
 * Register a new user
 * @body { email: string, password: string }
 * @returns { success: boolean, message: string }
 */
router.post('/register', authRateLimiter, authController.register);

/**
 * POST /api/auth/login
 * Login user and get JWT token
 * @body { email: string, password: string }
 * @returns { success: boolean, message: string, data: { token, user } }
 */
router.post('/login', authRateLimiter, authController.login);
router.post('/guest', authRateLimiter, authController.guest);

export default router;
