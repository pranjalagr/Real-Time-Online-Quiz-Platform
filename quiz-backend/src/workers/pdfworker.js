import dotenv from 'dotenv';
import { PDFParse } from 'pdf-parse';
import quizServices from '../services/quizservices/quizservices.js';
import llmService from '../services/llminput.js';
import pdfQuizGenerator from '../services/quizservices/generators/pdfquiz.js';
import { pdfProcessingQueue } from '../services/redis.js';

dotenv.config();

function chunkText(text, chunkSize = 3000, overlap = 300) {
    const chunks = [];
    let start = 0;

    while (start < text.length) {
        const end = Math.min(start + chunkSize, text.length);
        chunks.push(text.slice(start, end));
        if (end >= text.length) {
            break;
        }
        start = end - overlap;
    }

    return chunks.filter(Boolean);
}

async function generateQuestionsFromPdf(key, numQuestions, additionalPrompt = '') {
    const buffer = await quizServices.getObjectBuffer(key);
    const parser = new PDFParse({ data: buffer });
    const parsed = await parser.getText();
    await parser.destroy();
    const text = parsed.text?.trim();

    if (!text) {
        throw new Error('No text extracted from PDF');
    }

    const chunks = chunkText(text);
    const prompt = additionalPrompt?.trim()
        ? `Generate quiz questions using this instruction: ${additionalPrompt}`
        : 'Generate clear and balanced quiz questions from the PDF content';

    return llmService.generateQuestionsFromChunks(chunks, prompt, numQuestions);
}

pdfProcessingQueue.process(async (job) => {
    if (job.data.type !== 'PDF_GENERATION') {
        return null;
    }

    const questions = await generateQuestionsFromPdf(
        job.data.key,
        Number(job.data.numQuestions || 10),
        job.data.additionalPrompt || ''
    );

    await pdfQuizGenerator.saveGeneratedQuestions(job.data.quizId, questions, false);
    await pdfQuizGenerator.markJobCompleted(job.id, questions.length);

    return {
        quizId: job.data.quizId,
        questionsCount: questions.length
    };
});

pdfProcessingQueue.on('failed', async (job, error) => {
    if (job) {
        await pdfQuizGenerator.markJobFailed(job.id, error.message);
    }
});

console.log('PDF worker listening on queue: pdf-processing');
