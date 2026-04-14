import { ValidationError } from '../models/errors.js';
import { ROOM_MODES, ROOM_STATES, USER_ROLES, USER_TYPES } from '../models/constants.js';

class RoomValidator {
    
    /**
     * Validate room code format
     * @param {string} roomCode - Room code to validate
     * @returns {boolean} True if valid
     * @throws {ValidationError} If room code is invalid
     */
    validateRoomCode(roomCode) {
        if (!roomCode || typeof roomCode !== 'string') {
            throw new ValidationError('Room code must be a string');
        }
        
        if (roomCode.length !== 8) {
            throw new ValidationError('Room code must be exactly 8 characters');
        }
        
        if (!/^[a-z0-9]+$/.test(roomCode)) {
            throw new ValidationError('Room code must contain only lowercase letters and numbers');
        }
        
        return true;
    }

    /**
     * Validate room mode
     * @param {string} roomMode - Room mode to validate ('SOLO' or 'TEAM')
     * @returns {boolean} True if valid
     * @throws {ValidationError} If room mode is invalid
     */
    validateRoomMode(roomMode) {
        if (!roomMode || typeof roomMode !== 'string') {
            throw new ValidationError('Room mode must be a string');
        }
        
        const validModes = Object.values(ROOM_MODES);
        
        if (!validModes.includes(roomMode)) {
            throw new ValidationError(`Room mode must be one of: ${validModes.join(', ')}`);
        }
        
        return true;
    }

    /**
     * Validate room state
     * @param {string} roomState - Room state to validate
     * @returns {boolean} True if valid
     * @throws {ValidationError} If room state is invalid
     */
    validateRoomState(roomState) {
        if (!roomState || typeof roomState !== 'string') {
            throw new ValidationError('Room state must be a string');
        }
        
        const validStates = Object.values(ROOM_STATES);
        
        if (!validStates.includes(roomState)) {
            throw new ValidationError(`Room state must be one of: ${validStates.join(', ')}`);
        }
        
        return true;
    }

    /**
     * Validate user role
     * @param {string} role - User role to validate ('host' or 'player')
     * @returns {boolean} True if valid
     * @throws {ValidationError} If role is invalid
     */
    validateUserRole(role) {
        if (!role || typeof role !== 'string') {
            throw new ValidationError('User role must be a string');
        }
        
        const validRoles = Object.values(USER_ROLES);
        
        if (!validRoles.includes(role)) {
            throw new ValidationError(`User role must be one of: ${validRoles.join(', ')}`);
        }
        
        return true;
    }

    /**
     * Validate user ID
     * @param {number} userId - User ID to validate
     * @returns {boolean} True if valid
     * @throws {ValidationError} If user ID is invalid
     */
    validateUserId(userId) {
        if (userId === undefined || userId === null) {
            throw new ValidationError('User ID is required');
        }
        
        if (!Number.isInteger(userId) || userId <= 0) {
            throw new ValidationError('User ID must be a positive integer');
        }
        
        return true;
    }

    /**
     * Validate room ID
     * @param {number} roomId - Room ID to validate
     * @returns {boolean} True if valid
     * @throws {ValidationError} If room ID is invalid
     */
    validateRoomId(roomId) {
        if (roomId === undefined || roomId === null) {
            throw new ValidationError('Room ID is required');
        }
        
        if (!Number.isInteger(roomId) || roomId <= 0) {
            throw new ValidationError('Room ID must be a positive integer');
        }
        
        return true;
    }

    /**
     * Validate team ID
     * @param {number} teamId - Team ID to validate
     * @returns {boolean} True if valid
     * @throws {ValidationError} If team ID is invalid
     */
    validateTeamId(teamId) {
        if (teamId === undefined || teamId === null) {
            throw new ValidationError('Team ID is required');
        }
        if (!Number.isInteger(teamId) || teamId <= 0) {
            throw new ValidationError('Team ID must be a positive integer');
        }
        
        return true;
    }

    /**
     * Validate team name
     * @param {string} teamName - Team name to validate
     * @returns {boolean} True if valid
     * @throws {ValidationError} If team name is invalid
     */
    validateTeamName(teamName) {
        if (!teamName || typeof teamName !== 'string') {
            throw new ValidationError('Team name must be a non-empty string');
        }
        if (teamName.trim().length === 0) {
            throw new ValidationError('Team name cannot be empty or only whitespace');
        }
        
        if (teamName.length > 100) {
            throw new ValidationError('Team name must not exceed 100 characters');
        }
        
        return true;
    }

    /**
     * Validate quiz ID
     * @param {number} quizId - Quiz ID to validate
     * @returns {boolean} True if valid
     * @throws {ValidationError} If quiz ID is invalid
     */
    validateQuizId(quizId) {
        if (quizId === undefined || quizId === null) {
            throw new ValidationError('Quiz ID is required');
        }
        if (!Number.isInteger(quizId) || quizId <= 0) {
            throw new ValidationError('Quiz ID must be a positive integer');
        }
        
        return true;
    }

    /**
     * Validate question ID
     * @param {number} questionId - Question ID to validate
     * @returns {boolean} True if valid
     * @throws {ValidationError} If question ID is invalid
     */
    validateQuestionId(questionId) {
        if (questionId === undefined || questionId === null) {
            throw new ValidationError('Question ID is required');
        }
        
        if (!Number.isInteger(questionId) || questionId <= 0) {
            throw new ValidationError('Question ID must be a positive integer');
        }
        
        return true;
    }

    /**
     * Validate quiz topic/title
     * @param {string} quizTopic - Quiz topic to validate
     * @returns {boolean} True if valid
     * @throws {ValidationError} If quiz topic is invalid
     */
    validateQuizTopic(quizTopic) {
        if (!quizTopic || typeof quizTopic !== 'string') {
            throw new ValidationError('Quiz topic must be a non-empty string');
        }
        
        if (quizTopic.trim().length === 0) {
            throw new ValidationError('Quiz topic cannot be empty or only whitespace');
        }
        
        if (quizTopic.length > 200) {
            throw new ValidationError('Quiz topic must not exceed 200 characters');
        }
        
        return true;
    }

    /**
     * Validate time limit (in seconds)
     * @param {number} timeLimit - Time limit in seconds
     * @returns {boolean} True if valid
     * @throws {ValidationError} If time limit is invalid
     */
    validateTimeLimit(timeLimit) {
        if (timeLimit === undefined || timeLimit === null) {
            throw new ValidationError('Time limit is required');
        }
        
        if (!Number.isInteger(timeLimit)) {
            throw new ValidationError('Time limit must be an integer');
        }
        
        if (timeLimit <= 0) {
            throw new ValidationError('Time limit must be greater than 0');
        }
        
        if (timeLimit > 86400) {  // 24 hours in seconds
            throw new ValidationError('Time limit cannot exceed 24 hours (86400 seconds)');
        }
        
        return true;
    }

    /**
     * Validate selected option (1-4)
     * @param {number} option - Selected option to validate
     * @returns {boolean} True if valid
     * @throws {ValidationError} If option is invalid
     */
    validateSelectedOption(option) {
        if (option === undefined || option === null) {
            throw new ValidationError('Selected option is required');
        }
        
        if (!Number.isInteger(option)) {
            throw new ValidationError('Selected option must be an integer');
        }
        
        if (option < 1 || option > 4) {
            throw new ValidationError('Selected option must be between 1 and 4');
        }
        
        return true;
    }

    /**
     * Validate question text
     * @param {string} questionText - Question text to validate
     * @returns {boolean} True if valid
     * @throws {ValidationError} If question text is invalid
     */
    validateQuestionText(questionText) {
        if (!questionText || typeof questionText !== 'string') {
            throw new ValidationError('Question text must be a non-empty string');
        }
        
        if (questionText.trim().length === 0) {
            throw new ValidationError('Question text cannot be empty or only whitespace');
        }
        
        if (questionText.length > 1000) {
            throw new ValidationError('Question text must not exceed 1000 characters');
        }
        
        return true;
    }

    /**
     * Validate question options array
     * @param {Array<string>} options - Array of options to validate
     * @returns {boolean} True if valid
     * @throws {ValidationError} If options are invalid
     */
    validateQuestionOptions(options) {
        if (!Array.isArray(options)) {
            throw new ValidationError('Options must be an array');
        }
        
        if (options.length !== 4) {
            throw new ValidationError('Question must have exactly 4 options');
        }
        
        for (let i = 0; i < options.length; i++) {
            if (typeof options[i] !== 'string' || options[i].trim().length === 0) {
                throw new ValidationError(`Option ${i + 1} must be a non-empty string`);
            }
            
            if (options[i].length > 500) {
                throw new ValidationError(`Option ${i + 1} must not exceed 500 characters`);
            }
        }
        
        return true;
    }

    /**
     * Validate correct option index
     * @param {number} correctOption - Correct option index (1-4)
     * @returns {boolean} True if valid
     * @throws {ValidationError} If correct option is invalid
     */
    validateCorrectOption(correctOption) {
        if (correctOption === undefined || correctOption === null) {
            throw new ValidationError('Correct option is required');
        }
        
        if (!Number.isInteger(correctOption)) {
            throw new ValidationError('Correct option must be an integer');
        }
        
        if (correctOption < 1 || correctOption > 4) {
            throw new ValidationError('Correct option must be between 1 and 4');
        }
        
        return true;
    }

    /**
     * Validate question order
     * @param {number} questionOrder - Question order/sequence
     * @returns {boolean} True if valid
     * @throws {ValidationError} If question order is invalid
     */
    validateQuestionOrder(questionOrder) {
        if (questionOrder === undefined || questionOrder === null) {
            throw new ValidationError('Question order is required');
        }
        
        if (!Number.isInteger(questionOrder)) {
            throw new ValidationError('Question order must be an integer');
        }
        
        if (questionOrder < 1) {
            throw new ValidationError('Question order must be at least 1');
        }
        
        return true;
    }

    /**
     * Validate username
     * @param {string} username - Username to validate
     * @returns {boolean} True if valid
     * @throws {ValidationError} If username is invalid
     */
    validateUsername(username) {
        if (!username || typeof username !== 'string') {
            throw new ValidationError('Username must be a non-empty string');
        }
        
        if (username.trim().length === 0) {
            throw new ValidationError('Username cannot be empty or only whitespace');
        }
        
        if (username.length < 3 || username.length > 50) {
            throw new ValidationError('Username must be between 3 and 50 characters');
        }
        
        if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
            throw new ValidationError('Username can only contain letters, numbers, underscores, and hyphens');
        }
        
        return true;
    }

    /**
     * Validate email format
     * @param {string} email - Email to validate
     * @returns {boolean} True if valid
     * @throws {ValidationError} If email is invalid
     */
    validateEmail(email) {
        if (!email || typeof email !== 'string') {
            throw new ValidationError('Email must be a non-empty string');
        }
        
        // Basic email validation regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!emailRegex.test(email)) {
            throw new ValidationError('Invalid email format');
        }
        
        if (email.length > 100) {
            throw new ValidationError('Email must not exceed 100 characters');
        }
        
        return true;
    }

    /**
     * Validate user type
     * @param {string} userType - User type to validate (REGISTERED or GUEST)
     * @returns {boolean} True if valid
     * @throws {ValidationError} If user type is invalid
     */
    validateUserType(userType) {
        if (!userType || typeof userType !== 'string') {
            throw new ValidationError('User type must be a string');
        }
        
        const validTypes = Object.values(USER_TYPES);
        
        if (!validTypes.includes(userType)) {
            throw new ValidationError(`User type must be one of: ${validTypes.join(', ')}`);
        }
        
        return true;
    }

    /**
     * Validate create room input
     * @param {object} input - { hostId, roomMode }
     * @returns {boolean} True if valid
     * @throws {ValidationError} If any input is invalid
     */
    validateCreateRoomInput(input) {
        const { hostId, roomMode } = input;
        
        this.validateUserId(hostId);
        this.validateRoomMode(roomMode);
        
        return true;
    }

    /**
     * Validate join room input
     * @param {object} input - { playerId, roomCode }
     * @returns {boolean} True if valid
     * @throws {ValidationError} If any input is invalid
     */
    validateJoinRoomInput(input) {
        const { playerId, roomCode } = input;
        
        this.validateUserId(playerId);
        this.validateRoomCode(roomCode);
        
        return true;
    }

    /**
     * Validate start quiz input
     * @param {object} input - { roomId, userId, timeLimit, quizTopic }
     * @returns {boolean} True if valid
     * @throws {ValidationError} If any input is invalid
     */
    validateStartQuizInput(input) {
        const { roomId, userId, timeLimit} = input;
        this.validateRoomId(roomId);
        this.validateUserId(userId);
        this.validateTimeLimit(timeLimit);
        return true;
    }

    /**
     * Validate submit answer input
     * @param {object} input - { userId, roomId, questionId, selectedOption, quizId, teamId? }
     * @returns {boolean} True if valid
     * @throws {ValidationError} If any input is invalid
     */
    validateSubmitAnswerInput(input) {
        const { userId, roomId, questionId, selectedOption, quizId, teamId } = input;
        
        this.validateUserId(userId);
        this.validateRoomId(roomId);
        this.validateQuestionId(questionId);
        this.validateSelectedOption(selectedOption);
        this.validateQuizId(quizId);
        
        if (teamId !== undefined && teamId !== null) {
            this.validateTeamId(teamId);
        }
        
        return true;
    }

    /**
     * Validate create quiz input
     * @param {object} input - { roomId, quizTopic, durationSeconds }
     * @returns {boolean} True if valid
     * @throws {ValidationError} If any input is invalid
     */
    validateCreateQuizInput(input) {
        const { roomId, quizTopic, durationSeconds } = input;
        
        this.validateRoomId(roomId);
        this.validateQuizTopic(quizTopic);
        this.validateTimeLimit(durationSeconds);
        
        return true;
    }

    /**
     * Validate create team input
     * @param {object} input - { roomId, teamName }
     * @returns {boolean} True if valid
     * @throws {ValidationError} If any input is invalid
     */
    validateCreateTeamInput(input) {
        const { roomId, teamName } = input;
        
        this.validateRoomId(roomId);
        this.validateTeamName(teamName);
        
        return true;
    }

    /**
     * Validate add question input
     * @param {object} input - { quizId, questionText, options, correctOption, questionOrder }
     * @returns {boolean} True if valid
     * @throws {ValidationError} If any input is invalid
     */
    validateAddQuestionInput(input) {
        const { quizId, questionText, options, correctOption, questionOrder } = input;
        
        this.validateQuizId(quizId);
        this.validateQuestionText(questionText);
        this.validateQuestionOptions(options);
        this.validateCorrectOption(correctOption);
        this.validateQuestionOrder(questionOrder);
        
        return true;
    }
}

export default new RoomValidator();