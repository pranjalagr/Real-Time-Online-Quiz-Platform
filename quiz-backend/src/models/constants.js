/**
 * Room States
 * Defines the lifecycle states of a room
 */
const ROOM_STATES = {
    CREATED: 'CREATED',      // Room created, waiting for players
    LOBBY: 'LOBBY',          // Players joined, quiz not started
    LIVE: 'LIVE',            // Quiz is currently active
    ENDED: 'ENDED'           // Quiz completed
};

/**
 * Room Modes
 * Defines how the quiz is played
 */
const ROOM_MODES = {
    SOLO: 'SOLO',            // Individual players compete separately
    TEAM: 'TEAM'             // Teams compete together
};

/**
 * User Roles in Room
 * Defines the role of a user in a room
 */
const USER_ROLES = {
    HOST: 'host',            // Room creator/moderator
    PLAYER: 'player'         // Regular participant
};

/**
 * User Types
 * Defines authentication status of user
 */
const USER_TYPES = {
    REGISTERED: 'REGISTERED', // User logged in with credentials
    GUEST: 'GUEST'            // Anonymous user with just username
};

/**
 * Question States (if needed for future features)
 */
const QUESTION_STATES = {
    PENDING: 'PENDING',       // Not yet presented
    ACTIVE: 'ACTIVE',         // Currently being answered
    CLOSED: 'CLOSED',         // No longer accepting answers
    REVIEWED: 'REVIEWED'      // Answers reviewed
};

/**
 * Submission Status
 * Tracks submission state
 */
const SUBMISSION_STATUS = {
    SUBMITTED: 'SUBMITTED',   // Answer submitted
    CORRECT: 'CORRECT',       // Answer was correct
    INCORRECT: 'INCORRECT'    // Answer was incorrect
};

/**
 * Leaderboard Sort Options
 */
const LEADERBOARD_SORT = {
    BY_SCORE_DESC: 'score_desc',   // Highest score first
    BY_SCORE_ASC: 'score_asc',     // Lowest score first
    BY_NAME_ASC: 'name_asc',       // Name A-Z
    BY_NAME_DESC: 'name_desc'      // Name Z-A
};

/**
 * Pagination Defaults
 */
const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
    MIN_LIMIT: 1
};

/**
 * Time Limits (in seconds)
 */
const TIME_LIMITS = {
    MIN_QUIZ_TIME: 10,           // 10 seconds minimum
    MAX_QUIZ_TIME: 86400,        // 24 hours maximum
    DEFAULT_QUESTION_TIME: 30,   // 30 seconds per question
    SESSION_TIMEOUT: 3600        // 1 hour session timeout
};

/**
 * Room Validation Constants
 */
const ROOM_CODE = {
    LENGTH: 8,                        // Room code must be 8 characters
    CHARSET: 'abcdefghijklmnopqrstuvwxyz0123456789',  // Valid characters
    PATTERN: /^[a-z0-9]{8}$/         // Regex pattern
};

/**
 * Team Constraints
 */
const TEAM = {
    MIN_SIZE: 1,               // Minimum members in team
    MAX_SIZE: 10,              // Maximum members in team
    NAME_MIN_LENGTH: 1,
    NAME_MAX_LENGTH: 100
};

/**
 * Username Constraints
 */
const USERNAME = {
    MIN_LENGTH: 3,
    MAX_LENGTH: 50,
    PATTERN: /^[a-zA-Z0-9_-]+$/ // Letters, numbers, underscore, hyphen
};

/**
 * Email Constraints
 */
const EMAIL = {
    MAX_LENGTH: 100,
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
};

/**
 * Question Constraints
 */
const QUESTION = {
    TEXT_MIN_LENGTH: 5,
    TEXT_MAX_LENGTH: 1000,
    OPTION_MAX_LENGTH: 500,
    OPTIONS_COUNT: 4,           // Must have exactly 4 options
    VALID_CORRECT_OPTIONS: [1, 2, 3, 4]
};

/**
 * Quiz Constraints
 */
const QUIZ = {
    TOPIC_MIN_LENGTH: 3,
    TOPIC_MAX_LENGTH: 200,
    MIN_QUESTIONS: 1,
    MAX_QUESTIONS: 100
};

/**
 * HTTP Status Codes (for reference)
 */
const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    GONE: 410,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503
};

/**
 * Error Messages
 */
const ERROR_MESSAGES = {
    ROOM_NOT_FOUND: 'Room not found',
    USER_NOT_FOUND: 'User not found',
    QUIZ_NOT_FOUND: 'Quiz not found',
    INVALID_CREDENTIALS: 'Invalid credentials',
    UNAUTHORIZED_ACCESS: 'Unauthorized access',
    DATABASE_ERROR: 'Database error occurred',
    INVALID_INPUT: 'Invalid input provided',
    OPERATION_FAILED: 'Operation failed',
    SESSION_EXPIRED: 'Session expired',
    QUIZ_EXPIRED: 'Quiz time expired'
};

/**
 * Success Messages
 */
const SUCCESS_MESSAGES = {
    ROOM_CREATED: 'Room created successfully',
    QUIZ_STARTED: 'Quiz started successfully',
    ANSWER_SUBMITTED: 'Answer submitted successfully',
    USER_JOINED: 'User joined room successfully',
    USER_LEFT: 'User left room successfully',
    QUIZ_ENDED: 'Quiz ended successfully',
    LEADERBOARD_RETRIEVED: 'Leaderboard retrieved successfully'
};

/**
 * WebSocket Events (if using sockets)
 */
const SOCKET_EVENTS = {
    // Client events
    JOIN_ROOM: 'join_room',
    LEAVE_ROOM: 'leave_room',
    START_QUIZ: 'start_quiz',
    SUBMIT_ANSWER: 'submit_answer',
    END_QUIZ: 'end_quiz',
    
    // Server events
    ROOM_UPDATED: 'room_updated',
    QUIZ_STARTED: 'quiz_started',
    NEXT_QUESTION: 'next_question',
    ANSWER_ACCEPTED: 'answer_accepted',
    QUIZ_ENDED: 'quiz_ended',
    LEADERBOARD_UPDATED: 'leaderboard_updated',
    USER_JOINED: 'user_joined',
    USER_LEFT: 'user_left'
};

export {
    ROOM_STATES,
    ROOM_MODES,
    USER_ROLES,
    USER_TYPES,
    QUESTION_STATES,
    SUBMISSION_STATUS,
    LEADERBOARD_SORT,
    PAGINATION,
    TIME_LIMITS,
    ROOM_CODE,
    TEAM,
    USERNAME,
    EMAIL,
    QUESTION,
    QUIZ,
    HTTP_STATUS,
    ERROR_MESSAGES,
    SUCCESS_MESSAGES,
    SOCKET_EVENTS
};