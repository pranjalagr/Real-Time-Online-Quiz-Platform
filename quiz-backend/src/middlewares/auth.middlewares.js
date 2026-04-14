import jwt from 'jsonwebtoken';
import authService from '../services/auth.services.js';
import { UnauthorizedError, ValidationError } from '../models/errors.js';

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user to request
 * @param {object} req - Express request
 * @param {object} res - Express response
 * @param {function} next - Express next middleware
 */
async function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        // Check if authorization header exists
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'MISSING_AUTH_HEADER',
                    message: 'Authorization header is required'
                }
            });
        }
        
        // Check Bearer token format
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_TOKEN_FORMAT',
                    message: 'Invalid token format. Expected: Bearer <token>'
                }
            });
        }
        
        const token = parts[1];
        
        // Verify token
        try {
            const decoded = await authService.verifyToken(token);
            req.user = decoded;
            next();
        } catch (error) {
            if (error instanceof ValidationError || error instanceof UnauthorizedError) {
                return res.status(401).json({
                    success: false,
                    error: {
                        code: 'INVALID_TOKEN',
                        message: error.message
                    }
                });
            }
            throw error;
        }
        
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'AUTH_ERROR',
                message: 'Internal server error during authentication'
            }
        });
    }
}

/**
 * Optional Authentication Middleware
 * Verifies token if provided, but allows unauthenticated access
 * @param {object} req - Express request
 * @param {object} res - Express response
 * @param {function} next - Express next middleware
 */
async function optionalAuthMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        
        // If no auth header, continue without user
        if (!authHeader) {
            req.user = null;
            return next();
        }
        
        const parts = authHeader.split(' ');
        
        // If invalid format, continue without user
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            req.user = null;
            return next();
        }
        
        const token = parts[1];
        
        try {
            const decoded = await authService.verifyToken(token);
            req.user = decoded;
        } catch (error) {
            // Token invalid, continue without user
            req.user = null;
        }
        
        next();
        
    } catch (error) {
        console.error('Optional auth middleware error:', error);
        req.user = null;
        next();
    }
}

/**
 * Authorization Middleware
 * Checks if user has required role/permission
 * @param {string} role - Required role ('admin', 'host', 'player')
 * @returns {function} Express middleware function
 */
function requireRole(role) {
    return async (req, res, next) => {
        try {
            // Check if user is authenticated
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: {
                        code: 'MISSING_AUTH',
                        message: 'User authentication required'
                    }
                });
            }
            
            // Get user details
            const user = await authService.getUserById(req.user.id);
            
            // Check role (this assumes you have a role field in your users table)
            // Adjust this logic based on your actual role system
            if (user.role !== role) {
                return res.status(403).json({
                    success: false,
                    error: {
                        code: 'INSUFFICIENT_PERMISSIONS',
                        message: `This action requires '${role}' role`
                    }
                });
            }
            
            next();
            
        } catch (error) {
            console.error('Role authorization error:', error);
            
            if (error instanceof ValidationError) {
                return res.status(403).json({
                    success: false,
                    error: {
                        code: 'FORBIDDEN',
                        message: error.message
                    }
                });
            }
            
            return res.status(500).json({
                success: false,
                error: {
                    code: 'AUTH_ERROR',
                    message: 'Internal server error during authorization'
                }
            });
        }
    };
}

/**
 * Error Handler Middleware
 * Catches and formats all errors in a consistent way
 * @param {object} error - Error object
 * @param {object} req - Express request
 * @param {object} res - Express response
 * @param {function} next - Express next middleware
 */
function errorHandler(error, req, res, next) {
    console.error('Error:', error);
    
    // Custom AppError with statusCode
    if (error.statusCode) {
        return res.status(error.statusCode).json({
            success: false,
            error: {
                code: error.code || 'ERROR',
                message: error.message,
                timestamp: error.timestamp
            }
        });
    }
    
    // Validation errors
    if (error.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: error.message
            }
        });
    }
    
    // JWT errors
    if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            error: {
                code: 'INVALID_TOKEN',
                message: 'Invalid token'
            }
        });
    }
    
    if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            error: {
                code: 'TOKEN_EXPIRED',
                message: 'Token has expired'
            }
        });
    }
    
    // Database errors
    if (error.code === 'ECONNREFUSED') {
        return res.status(503).json({
            success: false,
            error: {
                code: 'DATABASE_ERROR',
                message: 'Database connection failed'
            }
        });
    }
    
    // Default internal server error
    return res.status(500).json({
        success: false,
        error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Something went wrong. Please try again later.'
        }
    });
}

/**
 * Request Logging Middleware
 * Logs all incoming requests
 * @param {object} req - Express request
 * @param {object} res - Express response
 * @param {function} next - Express next middleware
 */
function requestLogger(req, res, next) {
    const startTime = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const logMessage = `[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`;
        
        if (res.statusCode >= 500) {
            console.error(logMessage);
        } else if (res.statusCode >= 400) {
            console.warn(logMessage);
        } else {
            console.log(logMessage);
        }
    });
    
    next();
}

/**
 * Rate Limiting Middleware
 * Prevents abuse by limiting requests per IP
 * @param {number} windowMs - Time window in milliseconds (default: 15 minutes)
 * @param {number} maxRequests - Max requests per window (default: 100)
 * @returns {function} Express middleware function
 */
function rateLimiter(windowMs = 15 * 60 * 1000, maxRequests = 100) {
    const requests = new Map();
    
    return (req, res, next) => {
        const ip = req.ip || req.connection.remoteAddress;
        const now = Date.now();
        
        if (!requests.has(ip)) {
            requests.set(ip, { count: 1, resetTime: now + windowMs });
            return next();
        }
        
        const userRequests = requests.get(ip);
        
        if (now > userRequests.resetTime) {
            // Reset window
            requests.set(ip, { count: 1, resetTime: now + windowMs });
            return next();
        }
        
        if (userRequests.count >= maxRequests) {
            const retryAfter = Math.ceil((userRequests.resetTime - now) / 1000);
            return res.status(429).json({
                success: false,
                error: {
                    code: 'RATE_LIMIT_EXCEEDED',
                    message: `Too many requests. Please try again in ${retryAfter} seconds`,
                    retryAfter
                }
            });
        }
        
        userRequests.count++;
        res.set({
            'X-RateLimit-Limit': maxRequests,
            'X-RateLimit-Remaining': maxRequests - userRequests.count,
            'X-RateLimit-Reset': new Date(userRequests.resetTime).toISOString()
        });
        
        next();
    };
}

/**
 * Security Headers Middleware
 * Adds security headers to all responses
 * @param {object} req - Express request
 * @param {object} res - Express response
 * @param {function} next - Express next middleware
 */
function securityHeaders(req, res, next) {
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');
    
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Enable XSS protection
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Content Security Policy
    res.setHeader('Content-Security-Policy', "default-src 'self'");
    
    // Strict Transport Security
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    
    // Disable browser caching for sensitive data
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    next();
}

export {
    authMiddleware,
    optionalAuthMiddleware,
    requireRole,
    errorHandler,
    requestLogger,
    rateLimiter,
    securityHeaders
};
