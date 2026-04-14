import db from '../utils/database.js';
import { DatabaseError, NotFoundError, ValidationError } from '../models/errors.js';

class UserRepository {
    async createUser({ username, email = null, password_hash = null, user_type = 'REGISTERED' }) {
        try {
            const result = await db.query(
                `INSERT INTO users (username, email, password_hash, user_type)
                 VALUES ($1, $2, $3, $4)
                 RETURNING id, username, email, user_type, created_at`,
                [username, email, password_hash, user_type]
            );
            return result.rows[0];
        } catch (error) {
            if (error.code === '23505') {
                throw new ValidationError('Email already registered');
            }
            throw new DatabaseError(`Failed to create user: ${error.message}`, 'CREATE_USER', error);
        }
    }

    async getUserByEmail(email) {
        try {
            const result = await db.query(
                `SELECT id, username, email, password_hash, user_type, created_at
                 FROM users
                 WHERE email = $1`,
                [email]
            );
            return result.rows[0] || null;
        } catch (error) {
            throw new DatabaseError(`Failed to get user by email: ${error.message}`, 'GET_USER', error);
        }
    }

    async getUserByUsername(username) {
        try {
            const result = await db.query(
                `SELECT id, username, email, password_hash, user_type, created_at
                 FROM users
                 WHERE username = $1`,
                [username]
            );
            return result.rows[0] || null;
        } catch (error) {
            throw new DatabaseError(`Failed to get user by username: ${error.message}`, 'GET_USER', error);
        }
    }

    async getUserById(userId) {
        try {
            const result = await db.query(
                `SELECT id, username, email, password_hash, user_type, created_at
                 FROM users
                 WHERE id = $1`,
                [userId]
            );
            return result.rows[0] || null;
        } catch (error) {
            throw new DatabaseError(`Failed to get user by id: ${error.message}`, 'GET_USER', error);
        }
    }

    async updateUser(userId, updateData) {
        const fields = [];
        const values = [];
        let index = 1;

        if (updateData.username !== undefined) {
            fields.push(`username = $${index++}`);
            values.push(updateData.username);
        }
        if (updateData.email !== undefined) {
            fields.push(`email = $${index++}`);
            values.push(updateData.email);
        }

        if (fields.length === 0) {
            throw new ValidationError('No fields to update');
        }

        values.push(userId);

        try {
            const result = await db.query(
                `UPDATE users
                 SET ${fields.join(', ')}
                 WHERE id = $${index}
                 RETURNING id, username, email, user_type, created_at`,
                values
            );

            if (result.rows.length === 0) {
                throw new NotFoundError('User', userId);
            }

            return result.rows[0];
        } catch (error) {
            if (error instanceof NotFoundError || error instanceof ValidationError) {
                throw error;
            }
            if (error.code === '23505') {
                throw new ValidationError('Email already registered');
            }
            throw new DatabaseError(`Failed to update user: ${error.message}`, 'UPDATE_USER', error);
        }
    }

    async updatePassword(userId, passwordHash) {
        try {
            const result = await db.query(
                `UPDATE users
                 SET password_hash = $1
                 WHERE id = $2
                 RETURNING id`,
                [passwordHash, userId]
            );

            if (result.rows.length === 0) {
                throw new NotFoundError('User', userId);
            }

            return true;
        } catch (error) {
            if (error instanceof NotFoundError) {
                throw error;
            }
            throw new DatabaseError(`Failed to update password: ${error.message}`, 'UPDATE_PASSWORD', error);
        }
    }

    async deleteUser(userId) {
        try {
            const result = await db.query(
                'DELETE FROM users WHERE id = $1 RETURNING id',
                [userId]
            );
            return result.rows.length > 0;
        } catch (error) {
            throw new DatabaseError(`Failed to delete user: ${error.message}`, 'DELETE_USER', error);
        }
    }
}

export default new UserRepository();
