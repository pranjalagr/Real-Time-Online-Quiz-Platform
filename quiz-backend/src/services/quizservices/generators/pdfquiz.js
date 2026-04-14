import aws from '../quizservices.js';
import { addPdfProcessingJob, getJson, setJson } from '../../redis.js';
import pubSubService from '../../pubsub.service.js';
import quizRepository from '../../../repositories/quiz.repositories.js';
import questionRepository from '../../../repositories/question.repositories.js';
import roomRepository from '../../../repositories/room.repositories.js';
import { ValidationError, NotFoundError, UserNotHostError, IncorrectStateError } from '../../../models/errors.js';

class PDFQuizGenerator {
    uploadKey(quizId) {
        return `pdf:upload:${quizId}`;
    }

    jobMetaKey(jobId) {
        return `pdf:job:${jobId}`;
    }

    async generateUploadUrl(userId, roomId, durationSeconds, numQuestions) {
        if (!userId || !roomId || !durationSeconds || !numQuestions) {
            throw new ValidationError('userId, roomId, durationSeconds and numQuestions are required');
        }

        const room = await roomRepository.getRoomById(Number(roomId));
        if (!(await roomRepository.isUserHost(room.id, userId))) {
            throw new UserNotHostError(userId, room.id);
        }

        if (room.state !== 'LOBBY') {
            throw new IncorrectStateError(room.state, 'LOBBY', 'create pdf quiz');
        }

        const quiz = await quizRepository.createQuiz({
            room_id: room.id,
            duration_seconds: Number(durationSeconds)
        });

        const s3Key = `quizzes/${quiz.id}/source.pdf`;
        const upload = await aws.generatePresignedUrl(s3Key, 'application/pdf');

        await setJson(this.uploadKey(quiz.id), {
            quizId: quiz.id,
            roomId: room.id,
            userId,
            key: s3Key,
            numQuestions: Number(numQuestions),
            durationSeconds: Number(durationSeconds),
            uploaded: false
        }, 24 * 60 * 60);

        return {
            quizId: quiz.id,
            roomId: room.id,
            uploadUrl: upload.uploadUrl,
            key: s3Key,
            expiresIn: upload.expiresIn
        };
    }

    async queueUploadedPdf({ quizId, userId, additionalPrompt = '' }) {
        if (!quizId || !userId) {
            throw new ValidationError('quizId and userId are required');
        }

        const uploadMeta = await getJson(this.uploadKey(Number(quizId)));
        if (!uploadMeta) {
            throw new NotFoundError('PDF upload session', quizId);
        }

        if (Number(uploadMeta.userId) !== Number(userId)) {
            throw new UserNotHostError(userId, uploadMeta.roomId);
        }

        const job = await addPdfProcessingJob({
            type: 'PDF_GENERATION',
            quizId: Number(quizId),
            roomId: Number(uploadMeta.roomId),
            userId: Number(userId),
            key: uploadMeta.key,
            numQuestions: Number(uploadMeta.numQuestions),
            additionalPrompt
        });

        await setJson(this.jobMetaKey(job.id), {
            jobId: job.id,
            quizId: Number(quizId),
            roomId: Number(uploadMeta.roomId),
            status: 'QUEUED',
            key: uploadMeta.key,
            numQuestions: Number(uploadMeta.numQuestions),
            additionalPrompt
        }, 24 * 60 * 60);

        await pubSubService.publish(`quiz:${quizId}:processing`, {
            event: 'pdf_processing_queued',
            quizId: Number(quizId),
            roomId: Number(uploadMeta.roomId),
            jobId: job.id,
            status: 'QUEUED'
        });

        return {
            quizId: Number(quizId),
            roomId: Number(uploadMeta.roomId),
            jobId: job.id,
            status: 'QUEUED'
        };
    }

    async saveGeneratedQuestions(quizId, questions, append = false) {
        if (!questions || questions.length === 0) {
            throw new ValidationError('Questions are required');
        }

        await quizRepository.getQuizById(Number(quizId));
        const existing = await questionRepository.getQuestionsByQuizId(Number(quizId));
        let order = append ? existing.length + 1 : 1;

        if (!append && existing.length > 0) {
            await questionRepository.deleteQuestionsByQuizId(Number(quizId));
        }

        const saved = [];
        for (const question of questions) {
            saved.push(await questionRepository.createQuestion({
                quiz_id: Number(quizId),
                question_text: question.question,
                options: question.options,
                correct_option: question.correctOption,
                question_order: order++
            }));
        }

        return saved;
    }

    async markJobCompleted(jobId, questionsCount) {
        const jobMeta = await getJson(this.jobMetaKey(jobId));
        if (!jobMeta) {
            return;
        }

        await setJson(this.jobMetaKey(jobId), {
            ...jobMeta,
            status: 'COMPLETED',
            questionsCount
        }, 24 * 60 * 60);

        await pubSubService.publish(`quiz:${jobMeta.quizId}:processing`, {
            event: 'pdf_processing_completed',
            quizId: jobMeta.quizId,
            roomId: jobMeta.roomId,
            jobId,
            status: 'COMPLETED',
            questionsCount
        });
    }

    async markJobFailed(jobId, message) {
        const jobMeta = await getJson(this.jobMetaKey(jobId));
        if (!jobMeta) {
            return;
        }

        await setJson(this.jobMetaKey(jobId), {
            ...jobMeta,
            status: 'FAILED',
            error: message
        }, 24 * 60 * 60);

        await pubSubService.publish(`quiz:${jobMeta.quizId}:processing`, {
            event: 'pdf_processing_failed',
            quizId: jobMeta.quizId,
            roomId: jobMeta.roomId,
            jobId,
            status: 'FAILED',
            error: message
        });
    }

    async getJobStatus(jobId) {
        if (!jobId) {
            throw new ValidationError('jobId is required');
        }

        const status = await getJson(this.jobMetaKey(jobId));
        if (!status) {
            throw new NotFoundError('PDF job', jobId);
        }

        return status;
    }
}

export default new PDFQuizGenerator();
