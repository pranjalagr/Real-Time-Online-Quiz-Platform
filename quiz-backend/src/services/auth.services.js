import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import userRepository from '../repositories/user.repositories.js';
import { ValidationError, DatabaseError, NotFoundError, UnauthorizedError } from '../models/errors.js';

dotenv.config();

class AuthService {
    async createUser(email, password, username = null) {
        if (!email || !password) {
            throw new ValidationError('Email and password are required');
        }

        if (password.length < 10) {
            throw new ValidationError('Password must be at least 10 characters long');
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new ValidationError('Invalid email format');
        }

        const finalUsername = username || email.split('@')[0];
        const existingUser = await userRepository.getUserByEmail(email);
        if (existingUser) {
            throw new ValidationError('Email already registered');
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const user = await userRepository.createUser({
            username: finalUsername,
            email,
            password_hash: passwordHash,
            user_type: 'REGISTERED'
        });

        return {
            userId: user.id,
            email: user.email,
            username: user.username
        };
    }

    async createGuestUser(username) {
        if (!username || username.trim().length < 2) {
            throw new ValidationError('Username is required');
        }

        const user = await userRepository.createUser({
            username: username.trim(),
            user_type: 'GUEST'
        });

        const token = this.signToken(user);
        return {
            token,
            user: {
                userId: user.id,
                username: user.username,
                userType: user.user_type
            }
        };
    }

    signToken(user) {
        return jwt.sign(
            {
                id: user.id,
                email: user.email,
                username: user.username,
                userType: user.user_type
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
    }

    async authenticateUser(email, password) {
        if (!email || !password) {
            throw new ValidationError('Email and password are required');
        }

        const user = await userRepository.getUserByEmail(email);
        if (!user || !user.password_hash) {
            throw new UnauthorizedError('Invalid credentials');
        }

        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            throw new UnauthorizedError('Invalid credentials');
        }

        return {
            token: this.signToken(user),
            user: {
                userId: user.id,
                email: user.email,
                username: user.username,
                userType: user.user_type
            }
        };
    }

    async verifyToken(token) {
        if (!token) {
            throw new ValidationError('Token is required');
        }

        try {
            return jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new UnauthorizedError('Token has expired');
            }
            throw new UnauthorizedError('Invalid token');
        }
    }

    async getUserById(userId) {
        const user = await userRepository.getUserById(userId);
        if (!user) {
            throw new NotFoundError('User', userId);
        }
        return {
            userId: user.id,
            email: user.email,
            username: user.username,
            userType: user.user_type,
            createdAt: user.created_at
        };
    }
}

export default new AuthService();
