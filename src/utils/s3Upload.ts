import { S3Client, PutObjectCommand, ObjectCannedACL } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

const s3 = new S3Client({ region: process.env.AWS_REGION });

export const uploadToS3 = async (file: Express.Multer.File, folder: string) => {
    const fileExtension = path.extname(file.originalname);

    const newFileName = `${uuidv4()}${fileExtension}`;

    const uploadParams = {
        Bucket: process.env.S3_BUCKET_NAME!,
        Key: `${folder}/${newFileName}`,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'private' as ObjectCannedACL
    };

    const command = new PutObjectCommand(uploadParams);
    await s3.send(command);

    const urlCDN = process.env.CLOUD_FRONT_CDN;
    const awsUrl = `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com`
    const baseUrl = urlCDN ? urlCDN : awsUrl;

    return {
        url: `${baseUrl}/${uploadParams.Key}`,
        originalFilename: file.originalname
    };
};
