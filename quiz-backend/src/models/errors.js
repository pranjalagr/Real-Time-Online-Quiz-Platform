/**
 * Base Error Class
 * All custom errors extend this class
 */
class AppError extends Error {
    /**
     * @param {string} message - Error message
     * @param {number} statusCode - HTTP status code
     * @param {string} code - Error code for identification
     */
    constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.timestamp = new Date().toISOString();
        
        // Capture stack trace
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Validation Error
 * Thrown when input validation fails
 */
class ValidationError extends AppError {
    constructor(message) {
        super(message, 400, 'VALIDATION_ERROR');
        this.name = 'ValidationError';
    }
}

/**
 * Room Not Found Error
 * Thrown when requested room doesn't exist
 */
class RoomNotFoundError extends AppError {
    /**
     * @param {string|number} roomIdentifier - Room ID or room code
     */
    constructor(roomIdentifier) {
        super(
            `Room not found: ${roomIdentifier}`,
            404,
            'ROOM_NOT_FOUND'
        );
        this.name = 'RoomNotFoundError';
        this.roomIdentifier = roomIdentifier;
    }
}

/**
 * User Not Found Error
 * Thrown when requested user doesn't exist
 */
class UserNotFoundError extends AppError {
    /**
     * @param {number} userId - User ID
     */
    constructor(userId) {
        super(
            `User not found: ${userId}`,
            404,
            'USER_NOT_FOUND'
        );
        this.name = 'UserNotFoundError';
        this.userId = userId;
    }
}

/**
 * Quiz Not Found Error
 * Thrown when requested quiz doesn't exist
 */
class QuizNotFoundError extends AppError {
    /**
     * @param {number} quizId - Quiz ID
     */
    constructor(quizId) {
        super(
            `Quiz not found: ${quizId}`,
            404,
            'QUIZ_NOT_FOUND'
        );
        this.name = 'QuizNotFoundError';
        this.quizId = quizId;
    }
}

/**
 * Question Not Found Error
 * Thrown when requested question doesn't exist
 */
class QuestionNotFoundError extends AppError {
    /**
     * @param {number} questionId - Question ID
     */
    constructor(questionId) {
        super(
            `Question not found: ${questionId}`,
            404,
            'QUESTION_NOT_FOUND'
        );
        this.name = 'QuestionNotFoundError';
        this.questionId = questionId;
    }
}

/**
 * Team Not Found Error
 * Thrown when requested team doesn't exist
 */
class TeamNotFoundError extends AppError {
    /**
     * @param {number} teamId - Team ID
     */
    constructor(teamId) {
        super(
            `Team not found: ${teamId}`,
            404,
            'TEAM_NOT_FOUND'
        );
        this.name = 'TeamNotFoundError';
        this.teamId = teamId;
    }
}

/**
 * Duplicate User In Room Error
 * Thrown when user is already in the room
 */
class DuplicateUserInRoomError extends AppError {
    /**
     * @param {number} userId - User ID
     * @param {number} roomId - Room ID
     */
    constructor(userId, roomId) {
        super(
            `User ${userId} is already in room ${roomId}`,
            409,
            'DUPLICATE_USER_IN_ROOM'
        );
        this.name = 'DuplicateUserInRoomError';
        this.userId = userId;
        this.roomId = roomId;
    }
}

/**
 * User Already Answered Error
 * Thrown when user/team tries to submit answer to same question twice
 */
class UserAlreadyAnsweredError extends AppError {
    /**
     * @param {number} userId - User ID
     * @param {number} questionId - Question ID
     */
    constructor(userId, questionId) {
        super(
            `User/Team already submitted answer for question ${questionId}`,
            409,
            'USER_ALREADY_ANSWERED'
        );
        this.name = 'UserAlreadyAnsweredError';
        this.userId = userId;
        this.questionId = questionId;
    }
}

/**
 * Incorrect State Error
 * Thrown when operation is attempted in incorrect room/quiz state
 */
class IncorrectStateError extends AppError {
    /**
     * @param {string} currentState - Current state
     * @param {string} requiredState - Required state for operation
     * @param {string} operation - Operation being attempted
     */
    constructor(currentState, requiredState, operation) {
        super(
            `Cannot ${operation}. Room is in ${currentState} state, but ${requiredState} state is required`,
            409,
            'INCORRECT_STATE'
        );
        this.name = 'IncorrectStateError';
        this.currentState = currentState;
        this.requiredState = requiredState;
        this.operation = operation;
    }
}

/**
 * Unauthorized Error
 * Thrown when user lacks required permissions
 */
class UnauthorizedError extends AppError {
    /**
     * @param {string} message - Error message
     * @param {string} reason - Reason for unauthorized (e.g., 'NOT_HOST', 'NOT_IN_ROOM')
     */
    constructor(message, reason = 'UNAUTHORIZED') {
        super(
            message,
            403,
            reason
        );
        this.name = 'UnauthorizedError';
        this.reason = reason;
    }
}

/**
 * User Not In Room Error
 * Thrown when user is not in the specified room
 */
class UserNotInRoomError extends AppError {
    /**
     * @param {number} userId - User ID
     * @param {number} roomId - Room ID
     */
    constructor(userId, roomId) {
        super(
            `User ${userId} is not in room ${roomId}`,
            403,
            'USER_NOT_IN_ROOM'
        );
        this.name = 'UserNotInRoomError';
        this.userId = userId;
        this.roomId = roomId;
    }
}

/**
 * User Not Host Error
 * Thrown when non-host tries to perform host-only operation
 */
class UserNotHostError extends AppError {
    /**
     * @param {number} userId - User ID
     * @param {number} roomId - Room ID
     */
    constructor(userId, roomId) {
        super(
            `User ${userId} is not the host of room ${roomId}`,
            403,
            'USER_NOT_HOST'
        );
        this.name = 'UserNotHostError';
        this.userId = userId;
        this.roomId = roomId;
    }
}

/**
 * Invalid Mode Error
 * Thrown when operation doesn't match room mode (solo vs team)
 */
class InvalidModeError extends AppError {
    /**
     * @param {string} expectedMode - Expected mode (SOLO or TEAM)
     * @param {string} actualMode - Actual room mode
     */
    constructor(expectedMode, actualMode) {
        super(
            `Operation requires ${expectedMode} mode, but room is in ${actualMode} mode`,
            409,
            'INVALID_MODE'
        );
        this.name = 'InvalidModeError';
        this.expectedMode = expectedMode;
        this.actualMode = actualMode;
    }
}

/**
 * Quiz Expired Error
 * Thrown when quiz time limit exceeded
 */
class QuizExpiredError extends AppError {
    /**
     * @param {number} quizId - Quiz ID
     */
    constructor(quizId) {
        super(
            `Quiz ${quizId} has expired`,
            410,
            'QUIZ_EXPIRED'
        );
        this.name = 'QuizExpiredError';
        this.quizId = quizId;
    }
}

/**
 * Database Error
 * Thrown when database operation fails
 */
class DatabaseError extends AppError {
    /**
     * @param {string} message - Error message
     * @param {string} operationType - Type of operation (INSERT, UPDATE, DELETE, SELECT)
     * @param {Error} originalError - Original database error
     */
    constructor(message, operationType = 'UNKNOWN', originalError = null) {
        super(
            message,
            500,
            'DATABASE_ERROR'
        );
        this.name = 'DatabaseError';
        this.operationType = operationType;
        this.originalError = originalError;
    }
}

/**
 * Connection Error
 * Thrown when database connection fails
 */
class ConnectionError extends AppError {
    /**
     * @param {string} message - Error message
     * @param {Error} originalError - Original error
     */
    constructor(message = 'Database connection failed', originalError = null) {
        super(
            message,
            500,
            'CONNECTION_ERROR'
        );
        this.name = 'ConnectionError';
        this.originalError = originalError;
    }
}

/**
 * Conflict Error
 * Thrown when operation conflicts with existing data
 */
class ConflictError extends AppError {
    /**
     * @param {string} message - Error message
     * @param {string} resourceType - Type of resource (e.g., 'room_code', 'team_name')
     */
    constructor(message, resourceType = 'RESOURCE') {
        super(
            message,
            409,
            'CONFLICT'
        );
        this.name = 'ConflictError';
        this.resourceType = resourceType;
    }
}

/**
 * Bad Request Error
 * Thrown for general bad request errors
 */
class BadRequestError extends AppError {
    /**
     * @param {string} message - Error message
     */
    constructor(message) {
        super(
            message,
            400,
            'BAD_REQUEST'
        );
        this.name = 'BadRequestError';
    }
}

/**
 * Not Found Error (Generic)
 * Thrown when resource not found
 */
class NotFoundError extends AppError {
    /**
     * @param {string} resourceType - Type of resource
     * @param {string|number} identifier - Resource identifier
     */
    constructor(resourceType, identifier) {
        super(
            `${resourceType} not found: ${identifier}`,
            404,
            'NOT_FOUND'
        );
        this.name = 'NotFoundError';
        this.resourceType = resourceType;
        this.identifier = identifier;
    }
}

/**
 * Internal Server Error
 * Thrown for unexpected errors
 */
class InternalServerError extends AppError {
    /**
     * @param {string} message - Error message
     * @param {Error} originalError - Original error for logging
     */
    constructor(message = 'Internal server error', originalError = null) {
        super(
            message,
            500,
            'INTERNAL_SERVER_ERROR'
        );
        this.name = 'InternalServerError';
        this.originalError = originalError;
    }
}

export {
    AppError,
    ValidationError,
    RoomNotFoundError,
    UserNotFoundError,
    QuizNotFoundError,
    QuestionNotFoundError,
    TeamNotFoundError,
    DuplicateUserInRoomError,
    UserAlreadyAnsweredError,
    IncorrectStateError,
    UnauthorizedError,
    UserNotInRoomError,
    UserNotHostError,
    InvalidModeError,
    QuizExpiredError,
    DatabaseError,
    ConnectionError,
    ConflictError,
    BadRequestError,
    NotFoundError,
    InternalServerError
};