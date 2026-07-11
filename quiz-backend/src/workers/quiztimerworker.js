import { Emitter } from '@socket.io/redis-emitter';
import roomService from '../services/room.service.js';
import quizTimerService from '../services/quiztimer.service.js';
import { connection } from '../services/redis.js';

const emitter = new Emitter(connection);

let running = true;
let draining = false;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function drainDueTimers() {
  if (draining) {
    return;
  }

  draining = true;

  try {
    while (running) {
      const dueTimer = await quizTimerService.claimDueQuizEnd();
      if (!dueTimer) {
        break;
      }

      try {
        const result = await roomService.endQuiz(dueTimer.roomId, null);
        emitter.to(`room:${result.roomId}`).emit('QUIZ_ENDED', {
          ...result,
          quizId: dueTimer.quizId,
          endedBy: 'timer'
        });
        console.log(
          `Quiz timer ended for room ${dueTimer.roomId}, quiz ${dueTimer.quizId}`
        );
      } catch (error) {
        console.error(
          `Failed to end quiz for room ${dueTimer.roomId}, quiz ${dueTimer.quizId}`,
          error
        );
      }
    }
  } finally {
    draining = false;
  }
}

async function startQuizTimerWorker() {
  console.log('Quiz timer worker listening on Redis sorted set: quiz:timers:due');

  while (running) {
    try {
      await drainDueTimers();
    } catch (error) {
      console.error('Quiz timer worker loop failed', error);
    }

    await sleep(1000);
  }
}

process.on('SIGINT', () => {
  running = false;
});

process.on('SIGTERM', () => {
  running = false;
});

startQuizTimerWorker().catch((error) => {
  console.error('Quiz timer worker crashed', error);
  process.exit(1);
});
