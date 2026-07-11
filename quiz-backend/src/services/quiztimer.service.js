import { connection } from './redis.js';
import { ValidationError } from '../models/errors.js';

const QUIZ_TIMER_ZSET_KEY = 'quiz:timers:due';

const claimDueQuizEndScript = `
local key = KEYS[1]
local now = tonumber(ARGV[1])

local items = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
if (#items == 0) then
  return nil
end

local member = items[1]
local score = tonumber(items[2])

if score > now then
  return nil
end

local removed = redis.call('ZREM', key, member)
if removed == 0 then
  return nil
end

return cjson.encode({
  member = member,
  score = score
})
`;

class QuizTimerService {
  getTimerMember(roomId, quizId) {
    return JSON.stringify({
      roomId: Number(roomId),
      quizId: Number(quizId)
    });
  }

  async scheduleQuizEnd(roomId, quizId, totalDuration) {
    if (!roomId || !quizId || !totalDuration) {
      throw new ValidationError('roomId, quizId and totalDuration are required');
    }

    const expiresAtMs = Date.now() + (Number(totalDuration) * 1000);
    const member = this.getTimerMember(roomId, quizId);

    await connection.zadd(QUIZ_TIMER_ZSET_KEY, expiresAtMs, member);

    return {
      roomId: Number(roomId),
      quizId: Number(quizId),
      expiresAt: new Date(expiresAtMs).toISOString()
    };
  }

  async cancelQuizEnd(roomId, quizId) {
    if (!roomId || !quizId) {
      throw new ValidationError('roomId and quizId are required');
    }

    const member = this.getTimerMember(roomId, quizId);
    const removed = await connection.zrem(QUIZ_TIMER_ZSET_KEY, member);
    return removed > 0;
  }

  async claimDueQuizEnd(now = Date.now()) {
    const rawResult = await connection.eval(claimDueQuizEndScript, 1, QUIZ_TIMER_ZSET_KEY, String(now));
    if (!rawResult) {
      return null;
    }

    const parsed = typeof rawResult === 'string' ? JSON.parse(rawResult) : rawResult;
    const member = typeof parsed.member === 'string' ? JSON.parse(parsed.member) : parsed.member;

    return {
      roomId: Number(member.roomId),
      quizId: Number(member.quizId),
      dueAt: Number(parsed.score)
    };
  }
}

export default new QuizTimerService();
