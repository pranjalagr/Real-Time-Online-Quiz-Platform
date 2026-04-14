import Queue from 'bull';
import IORedis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisConfig = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT || 6379),
  retryStrategy: (times) => Math.min(times * 50, 2000),
  enableReadyCheck: false,
  enableOfflineQueue: true,
};

const connection = new IORedis(redisConfig);

const pdfProcessingQueue = new Queue('pdf-processing', { redis: redisConfig });
const leaderboardUpdateQueue = new Queue('leaderboard-update', { redis: redisConfig });
const quizTimerQueue = new Queue('quiz-timer', { redis: redisConfig });

async function addPdfProcessingJob(pdfData, options = {}) {
  return pdfProcessingQueue.add(pdfData, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: false,
    removeOnFail: false,
    ...options
  });
}

async function addLeaderboardJob(data, options = {}) {
  return leaderboardUpdateQueue.add(data, {
    attempts: 2,
    backoff: {
      type: 'fixed',
      delay: 1000
    },
    removeOnComplete: true,
    ...options
  });
}

async function addQuizTimerJob(data, options = {}) {
  return quizTimerQueue.add(data, {
    removeOnComplete: false,
    removeOnFail: false,
    ...options
  });
}

async function setJson(key, value, ttlSeconds = null) {
  const payload = JSON.stringify(value);
  if (ttlSeconds) {
    await connection.set(key, payload, 'EX', ttlSeconds);
    return;
  }
  await connection.set(key, payload);
}

async function getJson(key) {
  const raw = await connection.get(key);
  return raw ? JSON.parse(raw) : null;
}

async function deleteKey(key) {
  await connection.del(key);
}

export {
  connection,
  pdfProcessingQueue,
  leaderboardUpdateQueue,
  quizTimerQueue,
  addPdfProcessingJob,
  addLeaderboardJob,
  addQuizTimerJob,
  setJson,
  getJson,
  deleteKey
};
