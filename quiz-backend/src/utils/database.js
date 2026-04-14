import pool from '../db/index.js';
import { DatabaseError, ConnectionError } from '../models/errors.js';

class DatabaseTransaction {
    
    /**
     * Execute a single query against the shared pool.
     * @param {string} query - SQL query
     * @param {Array} params - Query parameters
     * @returns {Promise<object>} Query result
     */
    async query(query, params = []) {
        try {
            return await pool.query(query, params);
        } catch (err) {
            throw new DatabaseError(
                `Query failed: ${err.message}`,
                'QUERY',
                err
            );
        }
    }

    /**
     * Get a raw client from the pool.
     * Caller is responsible for releasing it.
     * @returns {Promise<object>} pg client
     */
    async getClient() {
        try {
            return await pool.connect();
        } catch (err) {
            throw new ConnectionError('Failed to get database client', err);
        }
    }
    
    /**
     * Execute callback within a database transaction
     * Automatically handles BEGIN, COMMIT, ROLLBACK
     * @param {function} callback - Async function that receives client as parameter
     * @returns {Promise<any>} Result from callback
     * @throws {DatabaseError} If transaction fails
     * @example
     * const result = await db.transaction(async (client) => {
     *     await client.query('INSERT INTO rooms...');
     *     await client.query('INSERT INTO room_users...');
     *     return { success: true };
     * });
     */
    async transaction(callback) {
        const client = await pool.connect();
        
        try {
            // Start transaction
            await client.query('BEGIN');
            
            // Execute callback with client
            const result = await callback(client);
            
            // Commit transaction
            await client.query('COMMIT');
            
            return result;
        } catch (err) {
            // Rollback on error
            try {
                await client.query('ROLLBACK');
            } catch (rollbackErr) {
                console.error('Error during rollback:', rollbackErr);
            }
            
            throw new DatabaseError(
                `Transaction failed: ${err.message}`,
                'TRANSACTION',
                err
            );
        } finally {
            // Always release client
            client.release();
        }
    }
    
    /**
     * Execute multiple queries as atomic operation
     * All queries succeed or all rollback
     * @param {Array<{query: string, params: Array}>} queries - Array of { query, params }
     * @returns {Promise<Array>} Results from each query
     * @throws {DatabaseError} If any query fails
     * @example
     * const results = await db.executeMultiple([
     *     { query: 'INSERT INTO rooms...', params: [1, 'abc', 'SOLO'] },
     *     { query: 'INSERT INTO room_users...', params: [1, 1, 'host'] }
     * ]);
     */
    async executeMultiple(queries) {
        if (!Array.isArray(queries) || queries.length === 0) {
            throw new DatabaseError('Queries must be non-empty array', 'VALIDATION');
        }
        
        const results = [];
        
        return await this.transaction(async (client) => {
            for (let i = 0; i < queries.length; i++) {
                const { query, params } = queries[i];
                
                if (!query || typeof query !== 'string') {
                    throw new DatabaseError(
                        `Query ${i} is invalid`,
                        'VALIDATION'
                    );
                }
                try {
                    const result = await client.query(query, params || []);
                    results.push(result.rows);
                } catch (err) {
                    throw new DatabaseError(
                        `Query ${i} failed: ${err.message}`,
                        'EXECUTE',
                        err
                    );
                }
            }
            return results;
        });
    }

    /**
     * Execute single query with retry logic
     * Useful for handling transient connection errors
     * @param {string} query - SQL query
     * @param {Array} params - Query parameters
     * @param {number} maxRetries - Maximum retry attempts (default 3)
     * @param {number} delayMs - Delay between retries in milliseconds (default 100)
     * @returns {Promise<object>} Query result
     * @throws {DatabaseError} If all retries fail
     * @example
     * const result = await db.queryWithRetry(
     *     'SELECT * FROM rooms WHERE id = $1',
     *     [1],
     *     3,
     *     100
     * );
     */
    async queryWithRetry(query, params = [], maxRetries = 3, delayMs = 100) {
        let lastError;
        
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                return await pool.query(query, params);
            } catch (err) {
                lastError = err;
                
                // Don't retry on validation errors
                if (err.code === '23505' || err.code === '23503' || err.code === '23502') {
                    throw new DatabaseError(
                        `Query failed with constraint error: ${err.message}`,
                        'CONSTRAINT',
                        err
                    );
                }
                
                // Retry on connection errors
                if (attempt < maxRetries - 1) {
                    console.warn(`Query retry attempt ${attempt + 1}/${maxRetries}, waiting ${delayMs}ms...`);
                    await this.sleep(delayMs);
                    delayMs = Math.min(delayMs * 2, 5000); // Exponential backoff, max 5s
                }
            }
        }
        
        throw new DatabaseError(
            `Query failed after ${maxRetries} attempts: ${lastError.message}`,
            'MAX_RETRIES',
            lastError
        );
    }

    /**
     * Batch insert with chunking for large datasets
     * Prevents query size limits
     * @param {string} query - INSERT query template (should have numbered placeholders)
     * @param {Array<Array>} dataChunks - Array of parameter arrays
     * @param {number} chunkSize - Number of inserts per query (default 100)
     * @returns {Promise<number>} Total rows inserted
     * @throws {DatabaseError} If insertion fails
     * @example
     * const query = 'INSERT INTO questions (quiz_id, text, options, correct) VALUES ($1, $2, $3, $4)';
     * const data = [
     *     [1, 'Q1', [...], 1],
     *     [1, 'Q2', [...], 2],
     *     [1, 'Q3', [...], 3]
     * ];
     * const inserted = await db.batchInsert(query, data, 100);
     */
    async batchInsert(query, dataChunks, chunkSize = 100) {
        if (!Array.isArray(dataChunks) || dataChunks.length === 0) {
            throw new DatabaseError('DataChunks must be non-empty array', 'VALIDATION');
        }
        
        if (chunkSize <= 0 || chunkSize > 1000) {
            throw new DatabaseError('ChunkSize must be between 1 and 1000', 'VALIDATION');
        }
        
        let totalInserted = 0;
        
        // Process in chunks
        for (let i = 0; i < dataChunks.length; i += chunkSize) {
            const chunk = dataChunks.slice(i, i + chunkSize);
            
            try {
                await this.transaction(async (client) => {
                    for (const params of chunk) {
                        await client.query(query, params);
                    }
                });
                
                totalInserted += chunk.length;
            } catch (err) {
                throw new DatabaseError(
                    `Batch insert failed at chunk ${Math.floor(i / chunkSize)}: ${err.message}`,
                    'BATCH_INSERT',
                    err
                );
            }
        }
        
        return totalInserted;
    }

    /**
     * Check database connection health
     * @returns {Promise<boolean>} True if connection healthy
     * @example
     * const isHealthy = await db.healthCheck();
     */
    async healthCheck() {
        try {
            const result = await pool.query('SELECT 1');
            return result.rowCount === 1;
        } catch (err) {
            console.error('Health check failed:', err);
            return false;
        }
    }

    /**
     * Get current pool statistics
     * @returns {object} Pool stats { totalCount, idleCount, waitingCount }
     * @example
     * const stats = db.getPoolStats();
     * console.log(stats); // { totalCount: 20, idleCount: 15, waitingCount: 0 }
     */
    getPoolStats() {
        return {
            totalCount: pool.totalCount,
            idleCount: pool.idleCount,
            waitingCount: pool.waitingCount
        };
    }

    /**
     * Wait for all connections to be idle
     * Useful before graceful shutdown
     * @param {number} timeoutMs - Maximum wait time (default 5000ms)
     * @returns {Promise<boolean>} True if all idle before timeout
     * @example
     * await db.waitForIdle(5000);
     */
    async waitForIdle(timeoutMs = 5000) {
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeoutMs) {
            if (this.getPoolStats().waitingCount === 0) {
                return true;
            }
            await this.sleep(100);
        }
        
        return false;
    }

    /**
     * Execute query with timeout
     * @param {string} query - SQL query
     * @param {Array} params - Query parameters
     * @param {number} timeoutMs - Timeout in milliseconds (default 30000)
     * @returns {Promise<object>} Query result
     * @throws {DatabaseError} If query exceeds timeout
     * @example
     * const result = await db.queryWithTimeout(
     *     'SELECT * FROM users',
     *     [],
     *     5000
     * );
     */
    async queryWithTimeout(query, params = [], timeoutMs = 30000) {
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
                reject(new DatabaseError(
                    `Query timeout after ${timeoutMs}ms`,
                    'TIMEOUT'
                ));
            }, timeoutMs);
        });
        
        const queryPromise = pool.query(query, params);
        
        return Promise.race([queryPromise, timeoutPromise]);
    }

    /**
     * Safely close all connections and shutdown
     * @returns {Promise<void>}
     * @example
     * await db.shutdown();
     */
    async shutdown() {
        try {
            console.log('Waiting for idle connections...');
            await this.waitForIdle(5000);
            
            console.log('Ending pool...');
            await pool.end();
            
            console.log('Database connections closed');
        } catch (err) {
            throw new ConnectionError('Error during shutdown', err);
        }
    }

    /**
     * Helper: Sleep for specified milliseconds
     * @param {number} ms - Milliseconds to sleep
     * @returns {Promise<void>}
     * @private
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Escape string for SQL (basic protection)
     * Note: Use parameterized queries instead of this when possible
     * @param {string} str - String to escape
     * @returns {string} Escaped string
     * @deprecated Use parameterized queries instead
     */
    escapeString(str) {
        if (typeof str !== 'string') {
            return str;
        }
        return str.replace(/'/g, "''");
    }

    /**
     * Get query execution stats (for monitoring)
     * @returns {object} Stats object
     * @example
     * const stats = db.getQueryStats();
     */
    getQueryStats() {
        return {
            pool: this.getPoolStats(),
            timestamp: new Date().toISOString()
        };
    }
}

export default new DatabaseTransaction();
