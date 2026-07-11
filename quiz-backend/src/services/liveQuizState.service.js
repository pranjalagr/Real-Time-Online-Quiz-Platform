import { randomUUID } from 'node:crypto';
import { connection, setJson, getJson, addSubmissionJob, submissionProcessingQueue } from './redis.js';
import db from '../utils/database.js';
import { ValidationError } from '../models/errors.js';

const LIVE_STATE_TTL_SECONDS = 24 * 60 * 60;
const SUBMISSION_LOCK_TTL_MS = 15 * 1000;

/**
 * Commit a queued submission into live Redis state.
 *
 * This script runs only after the job has been added to the queue successfully.
 * It increments the submission counter, updates the leaderboard score, and
 * releases the lock in one Redis round trip.
 */
const commitSubmissionScript = `
local lockValue = redis.call('GET', KEYS[3])
if not lockValue then
  return cjson.encode({ ok = false, reason = 'LOCK_MISSING' })
end

if lockValue ~= ARGV[1] then
  return cjson.encode({ ok = false, reason = 'LOCK_OWNER_MISMATCH' })
end

local entityKey = ARGV[2]
local scoreDelta = tonumber(ARGV[3]) or 0

local newCount = redis.call('HINCRBY', KEYS[1], entityKey, 1)
local newScore = tonumber(redis.call('ZSCORE', KEYS[2], entityKey) or '0')

if scoreDelta ~= 0 then
  newScore = tonumber(redis.call('ZINCRBY', KEYS[2], scoreDelta, entityKey))
end

redis.call('DEL', KEYS[3])
redis.call('SREM', KEYS[4], entityKey)

return cjson.encode({
  ok = true,
  submissionCount = newCount,
  score = newScore,
  scoreDelta = scoreDelta
})
`;

/**
 * Release a live submission lock if the queue push or Redis commit fails.
 *
 * The token check protects us from deleting another request's lock.
 */
const releaseSubmissionLockScript = `
local lockValue = redis.call('GET', KEYS[1])
if not lockValue then
  return cjson.encode({ ok = true, released = false, reason = 'LOCK_ALREADY_GONE' })
end

if lockValue ~= ARGV[1] then
  return cjson.encode({ ok = false, reason = 'LOCK_OWNER_MISMATCH' })
end

redis.call('DEL', KEYS[1])
redis.call('SREM', KEYS[2], ARGV[2])

return cjson.encode({ ok = true, released = true })
`;

class LiveQuizStateService {
    submissionWorkerStarted = false;

    roomMetaKey(roomId) {
        return `room:${roomId}:live_meta`;
    }

    leaderboardKey(roomId) {
        return `room:${roomId}:leaderboard`;
    }

    leaderboardLabelsKey(roomId) {
        return `room:${roomId}:leaderboard_labels`;
    }

    submissionCountKey(roomId) {
        return `room:${roomId}:submission_counts`;
    }

    submissionLockSetKey(roomId) {
        return `room:${roomId}:submission_lock_entities`;
    }

    submissionLockKey(roomId, entityKey) {
        return `room:${roomId}:submission_lock:${entityKey}`;
    }

    questionMetaKey(quizId, questionId) {
        return `quiz:${quizId}:question:${questionId}`;
    }

    entityKey(roomMode, userId, teamId = null) {
        if (roomMode === 'TEAM') {
            if (!teamId) {
                throw new ValidationError('teamId is required for TEAM submissions');
            }

            return `team:${teamId}`;
        }

        if (!userId) {
            throw new ValidationError('userId is required for SOLO submissions');
        }

        return `user:${userId}`;
    }

    /**
     * Clear every cached live-state key for the room.
     * This runs when the quiz ends or the room restarts.
     */
    async clearRoomLiveState(roomId) {
        const meta = await getJson(this.roomMetaKey(roomId));
        const labelKeys = await connection.hkeys(this.leaderboardLabelsKey(roomId));
        const countKeys = await connection.hkeys(this.submissionCountKey(roomId));
        const lockEntities = await connection.smembers(this.submissionLockSetKey(roomId));

        const keys = new Set([
            this.roomMetaKey(roomId),
            this.leaderboardKey(roomId),
            this.leaderboardLabelsKey(roomId),
            this.submissionCountKey(roomId),
            this.submissionLockSetKey(roomId)
        ]);

        for (const entityKey of [...labelKeys, ...countKeys, ...lockEntities]) {
            keys.add(this.submissionLockKey(roomId, entityKey));
        }

        if (meta?.quizId && Array.isArray(meta.questionIds)) {
            for (const questionId of meta.questionIds) {
                keys.add(this.questionMetaKey(meta.quizId, questionId));
            }
        }

        if (keys.size > 0) {
            await connection.del(...keys);
        }
    }

    /**
     * Prime Redis with the live quiz data we need for fast answer handling.
     * Question order, correct option, leaderboard entries, and counters all live here.
     */
    async primeRoomLiveState({ roomId, quizId, roomMode, questions = [], users = [], teams = [] }) {
        if (!roomId || !quizId || !roomMode) {
            throw new ValidationError('roomId, quizId and roomMode are required');
        }

        await this.clearRoomLiveState(roomId);

        const questionIds = questions.map((question) => Number(question.id));
        await setJson(this.roomMetaKey(roomId), {
            roomId: Number(roomId),
            quizId: Number(quizId),
            roomMode,
            questionIds,
            startedAt: new Date().toISOString()
        }, LIVE_STATE_TTL_SECONDS);

        const pipeline = connection.multi();

        for (const question of questions) {
            const questionKey = this.questionMetaKey(quizId, question.id);
            pipeline.hset(questionKey, {
                quizId: String(quizId),
                roomId: String(roomId),
                questionId: String(question.id),
                order: String(question.question_order),
                correctOption: String(question.correct_option)
            });
            pipeline.expire(questionKey, LIVE_STATE_TTL_SECONDS);
        }

        if (roomMode === 'TEAM') {
            for (const team of teams) {
                const entityKey = `team:${team.id}`;
                pipeline.zadd(this.leaderboardKey(roomId), 0, entityKey);
                pipeline.hset(this.leaderboardLabelsKey(roomId), entityKey, team.team_name);
                pipeline.hset(this.submissionCountKey(roomId), entityKey, 0);
            }
        } else {
            for (const user of users) {
                if (user.role !== 'player') {
                    continue;
                }

                const entityKey = `user:${user.user_id}`;
                pipeline.zadd(this.leaderboardKey(roomId), 0, entityKey);
                pipeline.hset(this.leaderboardLabelsKey(roomId), entityKey, user.username);
                pipeline.hset(this.submissionCountKey(roomId), entityKey, 0);
            }
        }

        pipeline.expire(this.leaderboardKey(roomId), LIVE_STATE_TTL_SECONDS);
        pipeline.expire(this.leaderboardLabelsKey(roomId), LIVE_STATE_TTL_SECONDS);
        pipeline.expire(this.submissionCountKey(roomId), LIVE_STATE_TTL_SECONDS);
        pipeline.expire(this.submissionLockSetKey(roomId), LIVE_STATE_TTL_SECONDS);

        await pipeline.exec();
    }

    /**
     * Read the cached question metadata.
     * The live submission flow uses this instead of going back to Postgres.
     */
    async getQuestionMeta(quizId, questionId) {
        const meta = await connection.hgetall(this.questionMetaKey(quizId, questionId));
        if (!meta || Object.keys(meta).length === 0) {
            return null;
        }

        return {
            quizId: Number(meta.quizId),
            roomId: Number(meta.roomId),
            questionId: Number(meta.questionId),
            order: Number(meta.order),
            correctOption: Number(meta.correctOption)
        };
    }

    /**
     * Return the current leaderboard straight from Redis.
     * This is the fast path for the socket layer and HTTP fallback reads.
     */
    async getLiveLeaderboard(roomId) {
        const memberScores = await connection.zrevrange(this.leaderboardKey(roomId), 0, -1, 'WITHSCORES');
        if (!memberScores || memberScores.length === 0) {
            return [];
        }

        const labels = await connection.hgetall(this.leaderboardLabelsKey(roomId));
        const counts = await connection.hgetall(this.submissionCountKey(roomId));

        const leaderboard = [];
        for (let i = 0; i < memberScores.length; i += 2) {
            const entityKey = memberScores[i];
            const score = Number(memberScores[i + 1] || 0);

            leaderboard.push({
                rank: (i / 2) + 1,
                entityKey,
                displayName: labels[entityKey] || entityKey,
                score,
                submissionCount: Number(counts[entityKey] || 0)
            });
        }

        return leaderboard;
    }

    /**
     * Handle one answer submission in Redis.
     *
     * Flow:
     * 1. Lock the current user or team.
     * 2. Check the next expected question number.
     * 3. Compare the submitted option with the cached correct option.
     * 4. Push the submission job to the queue.
     * 5. After queue success, update the Redis submission counter and leaderboard.
     * 6. Release the lock.
     */
    async submitAnswer({ roomId, quizId, roomMode, userId, teamId = null, questionId, selectedOption }) {
        if (!roomId || !quizId || !roomMode || !questionId) {
            throw new ValidationError('roomId, quizId, roomMode and questionId are required');
        }

        const entityKey = this.entityKey(roomMode, userId, teamId);
        const lockKey = this.submissionLockKey(roomId, entityKey);
        const lockEntitiesKey = this.submissionLockSetKey(roomId);
        const lockToken = randomUUID();
        const acquired = await connection.set(lockKey, lockToken, 'NX', 'PX', SUBMISSION_LOCK_TTL_MS);

        if (acquired !== 'OK') {
            throw new ValidationError('A submission is already being processed for this user or team');
        }

        try {
            const questionMeta = await this.getQuestionMeta(quizId, questionId);
            if (!questionMeta) {
                throw new ValidationError('Question metadata is not cached in Redis');
            }

            const currentCount = Number(await connection.hget(this.submissionCountKey(roomId), entityKey) || 0);
            const expectedOrder = currentCount + 1;

            if (questionMeta.order !== expectedOrder) {
                throw new ValidationError('Answer out of order or already submitted');
            }

            const normalizedSelectedOption = Number(selectedOption);
            const scoreDelta = normalizedSelectedOption === questionMeta.correctOption ? 1 : 0;
            const isCorrect = scoreDelta === 1;

            const job = await addSubmissionJob({
                type: 'SUBMISSION_ANSWER',
                roomId: Number(roomId),
                quizId: Number(quizId),
                roomMode,
                userId: userId ? Number(userId) : null,
                teamId: teamId ? Number(teamId) : null,
                entityKey,
                questionId: Number(questionId),
                questionOrder: questionMeta.order,
                selectedOption: normalizedSelectedOption,
                correctOption: questionMeta.correctOption,
                scoreDelta,
                isCorrect,
                submissionCountBefore: currentCount
            });

            const commitRaw = await connection.eval(
                commitSubmissionScript,
                4,
                this.submissionCountKey(roomId),
                this.leaderboardKey(roomId),
                lockKey,
                lockEntitiesKey,
                lockToken,
                entityKey,
                String(scoreDelta)
            );
            const commitResult = typeof commitRaw === 'string' ? JSON.parse(commitRaw) : commitRaw;
            if (!commitResult?.ok) {
                throw new ValidationError(commitResult?.reason === 'LOCK_OWNER_MISMATCH'
                    ? 'Submission lock was lost before Redis state could be updated'
                    : 'Failed to update live Redis state');
            }

            return {
                submissionState: 'QUEUED',
                queueJobId: job.id,
                roomId: Number(roomId),
                quizId: Number(quizId),
                questionId: Number(questionId),
                entityKey,
                selectedOption: normalizedSelectedOption,
                correctOption: questionMeta.correctOption,
                isCorrect,
                scoreDelta,
                expectedQuestionOrder: questionMeta.order,
                submissionCount: commitResult.submissionCount,
                leaderboardScore: commitResult.score
            };
        } catch (error) {
            await this.releaseSubmissionLock({
                roomId,
                entityKey,
                lockToken
            });
            throw error;
        }
    }

    /**
     * Release a lock when queue add or Redis commit fails.
     * The token keeps us from deleting another in-flight submission.
     */
    async releaseSubmissionLock({ roomId, entityKey, lockToken }) {
        if (!roomId || !entityKey || !lockToken) {
            throw new ValidationError('roomId, entityKey and lockToken are required');
        }

        const rawResult = await connection.eval(
            releaseSubmissionLockScript,
            2,
            this.submissionLockKey(roomId, entityKey),
            this.submissionLockSetKey(roomId),
            lockToken,
            entityKey
        );

        return typeof rawResult === 'string' ? JSON.parse(rawResult) : rawResult;
    }

    /**
     * Start the submission worker in this process.
     * The worker only writes to Postgres and does not touch Redis state.
     */
    startSubmissionWorker() {
        if (this.submissionWorkerStarted) {
            return;
        }

        this.submissionWorkerStarted = true;
        submissionProcessingQueue.process((job) => this.processSubmissionJob(job));
        submissionProcessingQueue.on('failed', (job, error) => {
            const submissionId = job?.id || 'unknown';
            console.error('Submission worker job failed:', submissionId, error?.message || error);
        });

        console.log('Submission worker listening on queue: submission-processing');
    }

    /**
     * Persist one queued submission to Postgres.
     * Redis state has already been updated by the socket path before this runs.
     */
    async processSubmissionJob(job) {
        if (!job || job.data?.type !== 'SUBMISSION_ANSWER') {
            return null;
        }

        const {
            roomId,
            quizId,
            roomMode,
            userId,
            teamId = null,
            questionId,
            selectedOption,
            scoreDelta
        } = job.data;

        let submissionRow = null;

        await db.transaction(async (client) => {
            const insertResult = await client.query(
                `INSERT INTO submissions (user_id, team_id, quiz_id, questions_id, selected_option)
                 VALUES ($1, $2, $3, $4, $5)
                 ON CONFLICT DO NOTHING
                 RETURNING id, user_id, team_id, quiz_id, questions_id, selected_option, submitted_at`,
                [userId, teamId, quizId, questionId, Number(selectedOption)]
            );

            const inserted = insertResult.rows.length > 0;
            submissionRow = insertResult.rows[0] || null;

            if (inserted && Number(scoreDelta) > 0) {
                if (roomMode === 'TEAM') {
                    await client.query(
                        `UPDATE leaderboard
                         SET score = score + $1, last_updated = NOW()
                         WHERE room_id = $2 AND team_id = $3`,
                        [Number(scoreDelta), roomId, teamId]
                    );
                } else {
                    await client.query(
                        `UPDATE leaderboard
                         SET score = score + $1, last_updated = NOW()
                         WHERE room_id = $2 AND user_id = $3`,
                        [Number(scoreDelta), roomId, userId]
                    );
                }
            }
        });

        return {
            submissionId: submissionRow?.id || null,
            roomId: Number(roomId),
            quizId: Number(quizId),
            questionId: Number(questionId),
            isCorrect: Number(scoreDelta) > 0,
            scoreDelta: Number(scoreDelta)
        };
    }
}

const liveQuizStateService = new LiveQuizStateService();

export function startSubmissionWorker() {
    liveQuizStateService.startSubmissionWorker();
}

export default liveQuizStateService;
