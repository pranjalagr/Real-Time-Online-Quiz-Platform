import dotenv from 'dotenv';
import { ValidationError } from '../models/errors.js';

dotenv.config();

class LLMService {
    
    constructor() {
        this.apiKey = process.env.LLM_API_KEY;
        this.apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
        this.model = 'llama-3.1-8b-instant';
        
        if (!this.apiKey) {
            throw new Error('LLM_API_KEY not configured');
        }
    }

    /**
     * Generate Questions by Topic
     * @param {string} topic - Quiz topic
     * @param {number} numQuestions - Number of questions to generate (default 10)
     * @returns {Promise<Array>} Array of generated questions
     */
    async generateQuestions(topic, numQuestions = 10) {
        if (!topic) {
            throw new ValidationError('Topic is required');
        }
        
        if (numQuestions < 1 || numQuestions > 50) {
            throw new ValidationError('Number of questions must be between 1 and 50');
        }

        const prompt = `You are a quiz generator. Generate exactly ${numQuestions} questions on the topic "${topic}". 
Each question must have exactly 4 options and exactly one option must be correct. 
The correct option must be represented by index (1, 2, 3, or 4). 
Return only valid JSON. Do not include explanations. Do not include markdown. Do not include any text outside the JSON.

Here is the JSON format to follow strictly:
{
    "questions": [
        {
            "question": "string",
            "options": ["string", "string", "string", "string"],
            "correctOption": number
        }
    ]
}`;

        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        { role: 'user', content: prompt }
                    ]
                })
            });

            if (!response.ok) {
                throw new Error(`LLM API returned status ${response.status}`);
            }

            const data = await response.json();
            
            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                throw new ValidationError('Invalid response from LLM API');
            }

            const text = data.choices[0].message.content;
            const parsed = JSON.parse(text);

            if (!parsed.questions || !Array.isArray(parsed.questions)) {
                throw new ValidationError('Invalid question format from LLM');
            }

            // Validate and transform questions
            const questions = parsed.questions.map((q, index) => {
                if (!q.question || !q.options || !q.correctOption) {
                    throw new ValidationError(`Question ${index + 1} is missing required fields`);
                }

                if (q.options.length !== 4) {
                    throw new ValidationError(`Question ${index + 1} must have exactly 4 options`);
                }

                if (q.correctOption < 1 || q.correctOption > 4) {
                    throw new ValidationError(`Question ${index + 1} has invalid correct option`);
                }

                return {
                    question: q.question,
                    options: q.options,
                    correctOption: q.correctOption
                };
            });

            return questions;
        } catch (error) {
            if (error instanceof ValidationError) {
                throw error;
            }
            if (error instanceof SyntaxError) {
                throw new ValidationError('LLM returned invalid JSON');
            }
            throw new ValidationError(`Failed to generate questions: ${error.message}`);
        }
    }

    /**
     * Generate Questions from PDF with Prompt
     * @param {Array<string>} chunks - Text chunks from PDF
     * @param {string} prompt - Additional prompt for question generation
     * @param {number} numQuestions - Number of questions to generate
     * @returns {Promise<Array>} Array of generated questions
     */
    async generateQuestionsFromChunks(chunks, prompt, numQuestions = 5) {
        if (!chunks || chunks.length === 0) {
            throw new ValidationError('PDF chunks are required');
        }
        
        if (!prompt) {
            throw new ValidationError('Prompt is required');
        }

        if (numQuestions < 1 || numQuestions > 20) {
            throw new ValidationError('Number of questions must be between 1 and 20');
        }

        const chunkText = chunks.join('\n\n');

        const generatePrompt = `You are a quiz generator. Based on the following text, generate exactly ${numQuestions} questions.
Additional instruction: ${prompt}

Text:
${chunkText}

Each question must have exactly 4 options and exactly one option must be correct.
The correct option must be represented by index (1, 2, 3, or 4).
Return only valid JSON. Do not include explanations. Do not include markdown. Do not include any text outside the JSON.

Here is the JSON format to follow strictly:
{
    "questions": [
        {
            "question": "string",
            "options": ["string", "string", "string", "string"],
            "correctOption": number
        }
    ]
}`;

        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        { role: 'user', content: generatePrompt }
                    ]
                })
            });

            if (!response.ok) {
                throw new Error(`LLM API returned status ${response.status}`);
            }

            const data = await response.json();
            
            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                throw new ValidationError('Invalid response from LLM API');
            }

            const text = data.choices[0].message.content;
            const parsed = JSON.parse(text);

            if (!parsed.questions || !Array.isArray(parsed.questions)) {
                throw new ValidationError('Invalid question format from LLM');
            }

            // Validate and transform questions
            const questions = parsed.questions.map((q, index) => {
                if (!q.question || !q.options || !q.correctOption) {
                    throw new ValidationError(`Question ${index + 1} is missing required fields`);
                }

                if (q.options.length !== 4) {
                    throw new ValidationError(`Question ${index + 1} must have exactly 4 options`);
                }

                if (q.correctOption < 1 || q.correctOption > 4) {
                    throw new ValidationError(`Question ${index + 1} has invalid correct option`);
                }

                return {
                    question: q.question,
                    options: q.options,
                    correctOption: q.correctOption
                };
            });

            return questions;
        } catch (error) {
            if (error instanceof ValidationError) {
                throw error;
            }
            if (error instanceof SyntaxError) {
                throw new ValidationError('LLM returned invalid JSON');
            }
            throw new ValidationError(`Failed to generate questions from chunks: ${error.message}`);
        }
    }

    /**
     * Legacy function for backward compatibility
     * @deprecated Use generateQuestions() instead
     */
    async callLLM(topic) {
        const questions = await this.generateQuestions(topic, 10);
        return {
            questions: questions
        };
    }
}

export default new LLMService();