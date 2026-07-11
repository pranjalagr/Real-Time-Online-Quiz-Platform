import { createAdapter } from '@socket.io/redis-adapter';
import { connection } from '../services/redis.js';

let pubClient = null;
let subClient = null;
let initialized = false;

/**
 * Attach the Socket.IO Redis adapter.
 *
 * Flow:
 * 1. `server.js` calls `initSockets()`.
 * 2. `initSockets()` calls this function once for the Socket.IO instance.
 * 3. The adapter uses Redis Pub/Sub to forward Socket.IO packets to the other servers.
 * 4. Any `io.to(room).emit(...)` call now reaches clients connected to every server.
 */
export async function attachSocketRedisAdapter(io) {
    if (initialized) {
        io.adapter(createAdapter(pubClient, subClient));
        return;
    }

    // Socket.IO needs its own Redis clients for pub/sub traffic.
    // We duplicate the shared Redis connection so the adapter can talk
    // without interfering with queue or cache commands.
    pubClient = connection.duplicate();
    subClient = connection.duplicate();

    io.adapter(createAdapter(pubClient, subClient));
    initialized = true;
}

/**
 * Close the Redis clients used only by the Socket.IO adapter.
 * `server.js` calls this during shutdown after closing the HTTP and Socket.IO servers.
 */
export async function closeSocketRedisAdapter() {
    const closeTasks = [];

    if (pubClient) {
        closeTasks.push(pubClient.quit());
        pubClient = null;
    }

    if (subClient) {
        closeTasks.push(subClient.quit());
        subClient = null;
    }

    initialized = false;

    await Promise.allSettled(closeTasks);
}
