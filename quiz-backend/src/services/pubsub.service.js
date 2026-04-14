import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

class PubSubService {
    constructor() {
        // Publisher client
        this.publisher = new Redis({
            host: process.env.REDIS_HOST || '127.0.0.1',
            port: process.env.REDIS_PORT || 6379,
            password: process.env.REDIS_PASSWORD || undefined,
            db: process.env.REDIS_DB || 0,
            retryStrategy: (times) => Math.min(times * 50, 2000),
            enableReadyCheck: false,
            enableOfflineQueue: false
        });

        // Subscriber client
        this.subscriber = new Redis({
            host: process.env.REDIS_HOST || '127.0.0.1',
            port: process.env.REDIS_PORT || 6379,
            password: process.env.REDIS_PASSWORD || undefined,
            db: process.env.REDIS_DB || 0,
            retryStrategy: (times) => Math.min(times * 50, 2000),
            enableReadyCheck: false,
            enableOfflineQueue: false
        });

        // Store subscriptions
        this.subscriptions = new Map();

        // Connection event handlers
        this.publisher.on('connect', () => {
            console.log('Pub/Sub Publisher connected to Redis');
        });

        this.publisher.on('error', (err) => {
            console.error('Pub/Sub Publisher error:', err);
        });

        this.subscriber.on('connect', () => {
            console.log('Pub/Sub Subscriber connected to Redis');
        });

        this.subscriber.on('error', (err) => {
            console.error('Pub/Sub Subscriber error:', err);
        });

        // Message handler
        this.subscriber.on('message', (channel, message) => {
            try {
                const data = JSON.parse(message);
                const callbacks = this.subscriptions.get(channel);
                
                if (callbacks && Array.isArray(callbacks)) {
                    callbacks.forEach(callback => {
                        try {
                            callback(data);
                        } catch (error) {
                            console.error(`Error in callback for channel ${channel}:`, error);
                        }
                    });
                }
            } catch (error) {
                console.error(`Error parsing message from channel ${channel}:`, error);
            }
        });

        // Pattern subscription handler
        this.subscriber.on('pmessage', (pattern, channel, message) => {
            try {
                const data = JSON.parse(message);
                const callbacks = this.subscriptions.get(pattern);
                
                if (callbacks && Array.isArray(callbacks)) {
                    callbacks.forEach(callback => {
                        try {
                            callback(data, channel);
                        } catch (error) {
                            console.error(`Error in callback for pattern ${pattern}:`, error);
                        }
                    });
                }
            } catch (error) {
                console.error(`Error parsing message from pattern ${pattern}:`, error);
            }
        });
    }

    /**
     * Publish message to channel
     * @param {string} channel - Channel name
     * @param {object} data - Data to publish
     * @returns {Promise<number>} Number of subscribers that received the message
     */
    async publish(channel, data) {
        if (!channel || !data) {
            throw new Error('Channel and data are required');
        }

        try {
            const message = JSON.stringify(data);
            const numSubscribers = await this.publisher.publish(channel, message);
            
            return numSubscribers;
        } catch (error) {
            console.error(`Failed to publish to channel ${channel}:`, error);
            throw error;
        }
    }

    /**
     * Subscribe to channel
     * @param {string} channel - Channel name
     * @param {function} callback - Callback function to execute on message
     * @returns {function} Unsubscribe function
     */
    subscribe(channel, callback) {
        if (!channel || !callback) {
            throw new Error('Channel and callback are required');
        }

        if (typeof callback !== 'function') {
            throw new Error('Callback must be a function');
        }

        try {
            // Store callback
            if (!this.subscriptions.has(channel)) {
                this.subscriptions.set(channel, []);
                // Subscribe to channel on Redis
                this.subscriber.subscribe(channel, (err) => {
                    if (err) {
                        console.error(`Failed to subscribe to channel ${channel}:`, err);
                    }
                });
            }

            const callbacks = this.subscriptions.get(channel);
            callbacks.push(callback);

            // Return unsubscribe function
            return () => this.unsubscribe(channel, callback);
        } catch (error) {
            console.error(`Failed to subscribe to channel ${channel}:`, error);
            throw error;
        }
    }

    /**
     * Unsubscribe from channel
     * @param {string} channel - Channel name
     * @param {function} callback - Callback to remove (if not provided, removes all)
     * @returns {Promise<boolean>} Success
     */
    unsubscribe(channel, callback = null) {
        if (!channel) {
            throw new Error('Channel is required');
        }

        try {
            const callbacks = this.subscriptions.get(channel);
            
            if (!callbacks || callbacks.length === 0) {
                return true;
            }

            if (callback) {
                // Remove specific callback
                const index = callbacks.indexOf(callback);
                if (index > -1) {
                    callbacks.splice(index, 1);
                }
            } else {
                // Remove all callbacks for channel
                callbacks.length = 0;
            }

            // If no more callbacks, unsubscribe from Redis
            if (callbacks.length === 0) {
                this.subscriptions.delete(channel);
                this.subscriber.unsubscribe(channel, (err) => {
                    if (err) {
                        console.error(`Failed to unsubscribe from channel ${channel}:`, err);
                    }
                });
            }

            return true;
        } catch (error) {
            console.error(`Failed to unsubscribe from channel ${channel}:`, error);
            throw error;
        }
    }

    /**
     * Subscribe to channel pattern (wildcard subscriptions)
     * @param {string} pattern - Channel pattern (e.g., "room:*:quiz")
     * @param {function} callback - Callback function to execute on message
     * @returns {function} Unsubscribe function
     */
    psubscribe(pattern, callback) {
        if (!pattern || !callback) {
            throw new Error('Pattern and callback are required');
        }

        if (typeof callback !== 'function') {
            throw new Error('Callback must be a function');
        }

        try {
            // Store callback
            if (!this.subscriptions.has(pattern)) {
                this.subscriptions.set(pattern, []);
                // Subscribe to pattern on Redis
                this.subscriber.psubscribe(pattern, (err) => {
                    if (err) {
                        console.error(`Failed to psubscribe to pattern ${pattern}:`, err);
                    }
                });
            }

            const callbacks = this.subscriptions.get(pattern);
            callbacks.push(callback);

            // Return unsubscribe function
            return () => this.punsubscribe(pattern, callback);
        } catch (error) {
            console.error(`Failed to psubscribe to pattern ${pattern}:`, error);
            throw error;
        }
    }

    /**
     * Unsubscribe from pattern
     * @param {string} pattern - Channel pattern
     * @param {function} callback - Callback to remove (if not provided, removes all)
     * @returns {boolean} Success
     */
    punsubscribe(pattern, callback = null) {
        if (!pattern) {
            throw new Error('Pattern is required');
        }

        try {
            const callbacks = this.subscriptions.get(pattern);
            
            if (!callbacks || callbacks.length === 0) {
                return true;
            }

            if (callback) {
                // Remove specific callback
                const index = callbacks.indexOf(callback);
                if (index > -1) {
                    callbacks.splice(index, 1);
                }
            } else {
                // Remove all callbacks for pattern
                callbacks.length = 0;
            }

            // If no more callbacks, unsubscribe from Redis
            if (callbacks.length === 0) {
                this.subscriptions.delete(pattern);
                this.subscriber.punsubscribe(pattern, (err) => {
                    if (err) {
                        console.error(`Failed to punsubscribe from pattern ${pattern}:`, err);
                    }
                });
            }

            return true;
        } catch (error) {
            console.error(`Failed to punsubscribe from pattern ${pattern}:`, error);
            throw error;
        }
    }

    /**
     * Get number of subscribers for a channel
     * @param {string} channel - Channel name
     * @returns {Promise<number>} Number of subscribers
     */
    async getSubscriberCount(channel) {
        if (!channel) {
            throw new Error('Channel is required');
        }

        try {
            const numSub = await this.publisher.pubsub('NUMSUB', channel);
            return numSub[1] || 0;
        } catch (error) {
            console.error(`Failed to get subscriber count for ${channel}:`, error);
            throw error;
        }
    }

    /**
     * Get all active channels
     * @returns {Promise<Array>} List of active channels
     */
    async getActiveChannels() {
        try {
            const channels = await this.publisher.pubsub('CHANNELS');
            return channels || [];
        } catch (error) {
            console.error('Failed to get active channels:', error);
            throw error;
        }
    }

    /**
     * Get all local subscriptions
     * @returns {Array} List of subscribed channels
     */
    getLocalSubscriptions() {
        return Array.from(this.subscriptions.keys());
    }

    /**
     * Publish one-time message (fire and forget)
     * @param {string} channel - Channel name
     * @param {object} data - Data to publish
     * @returns {Promise<void>}
     */
    async publishOnce(channel, data) {
        if (!channel || !data) {
            throw new Error('Channel and data are required');
        }

        try {
            const message = JSON.stringify(data);
            await this.publisher.publish(channel, message);
        } catch (error) {
            console.error(`Failed to publish once to channel ${channel}:`, error);
            throw error;
        }
    }

    /**
     * Close all connections
     * @returns {Promise<void>}
     */
    async close() {
        try {
            // Unsubscribe from all channels
            const channels = Array.from(this.subscriptions.keys());
            for (const channel of channels) {
                await this.unsubscribe(channel);
            }

            // Close connections
            await this.publisher.quit();
            await this.subscriber.quit();
            
            console.log('Pub/Sub service closed');
        } catch (error) {
            console.error('Failed to close Pub/Sub service:', error);
            throw error;
        }
    }
}

export default new PubSubService();