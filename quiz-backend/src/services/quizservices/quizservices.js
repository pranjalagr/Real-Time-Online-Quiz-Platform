import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import dotenv from 'dotenv';
import { ValidationError } from '../../models/errors.js';

dotenv.config();

class QuizServices {
    constructor() {
        this.s3Client = new S3Client({
            region:'ap-south-1',
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
            }
        });

        this.bucket = process.env.AWS_S3_BUCKET;
    }

    getBucket() {
        if (!this.bucket) {
            throw new ValidationError('AWS_S3_BUCKET not configured');
        }
        return this.bucket;
    }

    async generatePresignedUrl(key, contentType = 'application/pdf') {
        if (!key) {
            throw new ValidationError('S3 key is required');
        }

        const command = new PutObjectCommand({
            Bucket: this.getBucket(),
            Key: key,
            ContentType: contentType
        });

        const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
        return {
            uploadUrl,
            key,
            expiresIn: 3600
        };
    }

    async getObjectBuffer(key) {
        if (!key) {
            throw new ValidationError('S3 key is required');
        }

        const command = new GetObjectCommand({
            Bucket: this.getBucket(),
            Key: key
        });

        const response = await this.s3Client.send(command);
        const chunks = [];
        for await (const chunk of response.Body) {
            chunks.push(chunk);
        }
        return Buffer.concat(chunks);
    }
}

export default new QuizServices();
