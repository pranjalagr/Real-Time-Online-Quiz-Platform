import { ROOM_CODE } from '../models/constants.js';
import { ValidationError } from '../models/errors.js';
import roomRepository from '../repositories/room.repositories.js';

class CodeGenerator {
    
    /**
     * Generate a random room code
     * @returns {string} 8-character room code (lowercase letters and numbers)
     * @example
     * const code = codeGenerator.generateRoomCode();
     * console.log(code); // "abc12def"
     */
    generateRoomCode() {
        let code = '';
        const charset = ROOM_CODE.CHARSET;
        const length = ROOM_CODE.LENGTH;
        
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * charset.length);
            code += charset[randomIndex];
        }
        
        return code;
    }

    /**
     * Generate a unique room code (checks database to ensure uniqueness)
     * @param {number} maxRetries - Maximum attempts to generate unique code (default 10)
     * @returns {Promise<string>} Unique room code
     * @throws {Error} If unable to generate unique code after max retries
     * @example
     * const uniqueCode = await codeGenerator.generateUniqueRoomCode();
     */
    async generateUniqueRoomCode(maxRetries = 10) {
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            const code = this.generateRoomCode();
            
            try {
                // Try to fetch room with this code
                await roomRepository.getRoomByCode(code);
                // If we reach here, room exists, so try again
                continue;
            } catch (err) {
                if (err.code === 'ROOM_NOT_FOUND' || err.code === 'NOT_FOUND') {
                    return code;
                }
                throw err;
            }
        }
        
        throw new Error(
            `Failed to generate unique room code after ${maxRetries} attempts. Database might be at capacity.`
        );
    }

    /**
     * Validate room code format
     * @param {string} code - Room code to validate
     * @returns {boolean} True if valid format
     * @throws {ValidationError} If code format is invalid
     * @example
     * codeGenerator.validateCodeFormat("abc12def"); // true
     * codeGenerator.validateCodeFormat("ABC12DEF"); // throws error (uppercase not allowed)
     */
    validateCodeFormat(code) {
        if (!code || typeof code !== 'string') {
            throw new ValidationError('Room code must be a string');
        }
        
        if (code.length !== ROOM_CODE.LENGTH) {
            throw new ValidationError(`Room code must be exactly ${ROOM_CODE.LENGTH} characters`);
        }
        
        if (!ROOM_CODE.PATTERN.test(code)) {
            throw new ValidationError(
                `Room code must contain only lowercase letters and numbers. Pattern: ${ROOM_CODE.PATTERN}`
            );
        }
        
        return true;
    }

    /**
     * Generate multiple unique codes
     * @param {number} count - Number of codes to generate
     * @returns {Promise<Array<string>>} Array of unique room codes
     * @throws {Error} If unable to generate required number of codes
     * @example
     * const codes = await codeGenerator.generateMultipleCodes(5);
     * console.log(codes); // ["abc12def", "ghi34jkl", "mno56pqr", "stu78vwx", "yza01bcd"]
     */
    async generateMultipleCodes(count) {
        if (!Number.isInteger(count) || count <= 0) {
            throw new ValidationError('Count must be a positive integer');
        }
        
        if (count > 100) {
            throw new ValidationError('Cannot generate more than 100 codes at once');
        }
        
        const codes = [];
        const maxAttemptsPerCode = 5;
        
        for (let i = 0; i < count; i++) {
            try {
                const code = await this.generateUniqueRoomCode(maxAttemptsPerCode);
                codes.push(code);
            } catch (err) {
                throw new Error(
                    `Failed to generate ${count} unique codes. Generated ${codes.length} before failure.`
                );
            }
        }
        
        return codes;
    }

    /**
     * Check if code exists in database
     * @param {string} code - Code to check
     * @returns {Promise<boolean>} True if code exists
     * @example
     * const exists = await codeGenerator.codeExists("abc12def");
     */
    async codeExists(code) {
        this.validateCodeFormat(code);
        
        try {
            await roomRepository.getRoomByCode(code);
            return true;
        } catch (err) {
            if (err.code === 'ROOM_NOT_FOUND' || err.code === 'NOT_FOUND') {
                return false;
            }
            throw err;
        }
    }

    /**
     * Get room by code
     * @param {string} code - Room code
     * @returns {Promise<object>} Room object
     * @throws {ValidationError} If code format invalid
     * @throws {RoomNotFoundError} If room doesn't exist
     * @example
     * const room = await codeGenerator.getRoomByCode("abc12def");
     */
    async getRoomByCode(code) {
        this.validateCodeFormat(code);
        return await roomRepository.getRoomByCode(code);
    }

    /**
     * Generate human-readable code (more user-friendly)
     * Alternative to default alphanumeric codes
     * @returns {string} 6-character code with consonants and numbers
     * @example
     * const code = codeGenerator.generateHumanReadableCode();
     * console.log(code); // "bcd5fgh" (easier to pronounce)
     */
    generateHumanReadableCode() {
        // Consonants easier to pronounce
        const consonants = 'bcdfghjkmnpqrstvwxyz';
        const vowels = 'aeiou';
        const numbers = '23456789'; // Avoid 0, 1 for confusion with O, I
        
        let code = '';
        
        // Alternate consonant-vowel-consonant pattern
        code += consonants[Math.floor(Math.random() * consonants.length)];
        code += vowels[Math.floor(Math.random() * vowels.length)];
        code += consonants[Math.floor(Math.random() * consonants.length)];
        code += numbers[Math.floor(Math.random() * numbers.length)];
        code += consonants[Math.floor(Math.random() * consonants.length)];
        code += numbers[Math.floor(Math.random() * numbers.length)];
        
        return code;
    }

    /**
     * Generate numeric-only code
     * Alternative format
     * @returns {string} 6-digit numeric code
     * @example
     * const code = codeGenerator.generateNumericCode();
     * console.log(code); // "123456"
     */
    generateNumericCode() {
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += Math.floor(Math.random() * 10).toString();
        }
        return code;
    }
}

export default new CodeGenerator();
