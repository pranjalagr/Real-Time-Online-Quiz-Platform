import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import http from "http";
import { initSockets } from "./socket/index.js";
import db from "./utils/database.js";

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";

// Create HTTP server for WebSocket support
const server = http.createServer(app);

// Initialize WebSocket (Socket.io)
let io = null;

// ============================================
// INITIALIZATION FUNCTION
// ============================================
async function initialize() {
    try {
        console.log("");
        console.log("==========================================");
        console.log("  QUIZ BACKEND SERVER INITIALIZATION");
        console.log("==========================================");
        console.log("");

        // 1. Check Database Connection
        console.log("[1/3] Initializing Database Connection...");
        try {
            const isHealthy = await db.healthCheck();
            if (!isHealthy) {
                throw new Error("Database health check failed");
            }
            console.log("      SUCCESS: Database is healthy");
        } catch (error) {
            console.error("      FAILED: Database connection error");
            throw error;
        }

        // 2. Initialize WebSocket
        console.log("[2/3] Initializing WebSocket Server...");
        try {
            io = initSockets(server);
            console.log("      SUCCESS: WebSocket initialized");
        } catch (error) {
            console.error("      FAILED: WebSocket initialization error");
            throw error;
        }

        // 3. Start HTTP Server
        console.log("[3/3] Starting HTTP Server...");
        try {
            await new Promise((resolve, reject) => {
                server.listen(PORT, () => {
                    console.log("      SUCCESS: HTTP server started");
                    resolve();
                }).on("error", reject);
            });
        } catch (error) {
            console.error("      FAILED: HTTP server start error");
            throw error;
        }

        // Server started successfully
        console.log("");
        console.log("==========================================");
        console.log("  SERVER RUNNING");
        console.log("==========================================");
        console.log("");
        console.log("Port:        " + PORT);
        console.log("Environment: " + NODE_ENV);
        console.log("Status:      ONLINE");
        console.log("");
        console.log("Health Check: http://localhost:" + PORT + "/health");
        console.log("API Status:   http://localhost:" + PORT + "/api/status");
        console.log("");
        console.log("==========================================");
        console.log("");

    } catch (error) {
        console.error("");
        console.error("==========================================");
        console.error("  INITIALIZATION FAILED");
        console.error("==========================================");
        console.error("");
        console.error("Error: " + error.message);
        console.error("");
        console.error("==========================================");
        console.error("");
        process.exit(1);
    }
}

// ============================================
// GRACEFUL SHUTDOWN FUNCTION
// ============================================
async function shutdown() {
    try {
        console.log("");
        console.log("==========================================");
        console.log("  SERVER SHUTDOWN INITIATED");
        console.log("==========================================");
        console.log("");

        // 1. Stop accepting new connections
        console.log("[1/4] Closing HTTP server...");
        await new Promise((resolve) => {
            server.close(() => {
                console.log("      SUCCESS: HTTP server closed");
                resolve();
            });
        });

        // 2. Close all Socket.io connections
        if (io) {
            console.log("[2/4] Closing WebSocket connections...");
            io.close();
            console.log("      SUCCESS: WebSocket connections closed");
        } else {
            console.log("[2/4] WebSocket not initialized, skipping...");
        }

        // 3. Wait for database connections to be idle
        console.log("[3/4] Waiting for database to become idle...");
        try {
            const isIdle = await db.waitForIdle(5000);
            if (isIdle) {
                console.log("      SUCCESS: Database is idle");
            } else {
                console.log("      WARNING: Some database connections still active");
            }
        } catch (error) {
            console.log("      WARNING: Could not verify database idle state");
        }

        // 4. Close database connection
        console.log("[4/4] Closing database connection...");
        try {
            await db.shutdown();
            console.log("      SUCCESS: Database connection closed");
        } catch (error) {
            console.log("      WARNING: Error closing database, forcing shutdown...");
        }

        console.log("");
        console.log("==========================================");
        console.log("  SERVER SHUTDOWN COMPLETE");
        console.log("==========================================");
        console.log("");
        process.exit(0);

    } catch (error) {
        console.error("");
        console.error("==========================================");
        console.error("  SHUTDOWN ERROR");
        console.error("==========================================");
        console.error("");
        console.error("Error: " + error.message);
        console.error("");
        console.error("==========================================");
        console.error("");
        process.exit(1);
    }
}

// ============================================
// PROCESS SIGNAL HANDLERS
// ============================================

// Graceful shutdown on SIGINT (Ctrl+C)
process.on("SIGINT", async () => {
    console.log("");
    console.log("SIGINT received - initiating graceful shutdown");
    await shutdown();
});

// Graceful shutdown on SIGTERM
process.on("SIGTERM", async () => {
    console.log("");
    console.log("SIGTERM received - initiating graceful shutdown");
    await shutdown();
});

// ============================================
// UNHANDLED ERROR HANDLERS
// ============================================

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
    console.error("");
    console.error("==========================================");
    console.error("  UNCAUGHT EXCEPTION");
    console.error("==========================================");
    console.error("");
    console.error("Error: " + error.message);
    console.error("Stack: " + error.stack);
    console.error("");
    console.error("==========================================");
    console.error("");
    console.error("Server will shut down in 5 seconds...");
    console.error("");
    
    setTimeout(() => {
        shutdown();
    }, 5000);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
    console.error("");
    console.error("==========================================");
    console.error("  UNHANDLED REJECTION");
    console.error("==========================================");
    console.error("");
    console.error("Promise: " + (promise ? promise.toString() : "Unknown"));
    console.error("Reason: " + (reason ? reason.toString() : "Unknown"));
    console.error("");
    if (reason && reason.stack) {
        console.error("Stack: " + reason.stack);
    }
    console.error("");
    console.error("==========================================");
    console.error("");
    console.error("Server will shut down in 5 seconds...");
    console.error("");
    
    setTimeout(() => {
        shutdown();
    }, 5000);
});

// ============================================
// START SERVER
// ============================================
initialize();

export { server, io };