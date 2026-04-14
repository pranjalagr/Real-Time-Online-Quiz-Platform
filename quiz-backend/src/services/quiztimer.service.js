import { addQuizTimerJob, quizTimerQueue } from './redis.js';
import roomRepository from '../repositories/room.repositories.js';
import pubSubService from './pubsub.service.js';
import { ValidationError } from '../models/errors.js';

class QuizTimerService {
    async registerQuizTimer(roomId, quizId, totalDuration) {
        if (!roomId || !quizId || !totalDuration) {
            throw new ValidationError('roomId, quizId and totalDuration are required');
        }

        const expiresAt = new Date(Date.now() + Number(totalDuration) * 1000).toISOString();
        const job = await addQuizTimerJob({
            type: 'QUIZ_END',
            roomId: Number(roomId),
            quizId: Number(quizId),
            expiresAt
        }, {
            delay: Number(totalDuration) * 1000,
            jobId: `quiz-${quizId}-end`
        });

        await pubSubService.publish(`room:${roomId}:quiz`, {
            event: 'quiz_timer_started',
            roomId: Number(roomId),
            quizId: Number(quizId),
            expiresAt
        });

        return {
            jobId: job.id,
            expiresAt
        };
    }

    async cancelQuizTimer(quizId) {
        const job = await quizTimerQueue.getJob(`quiz-${quizId}-end`);
        if (!job) {
            return false;
        }

        await job.remove();
        return true;
    }
}

quizTimerQueue.process(async (job) => {
    if (job.data.type === 'QUIZ_END') {
        await roomRepository.updateRoomState(job.data.roomId, 'ENDED');
        await pubSubService.publish(`room:${job.data.roomId}:quiz`, {
            event: 'quiz_auto_ended',
            roomId: job.data.roomId,
            quizId: job.data.quizId
        });
    }
    return true;
});

export default new QuizTimerService();