import { S3Client, PutObjectCommand, ObjectCannedACL } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import path from "path";

// 🚀 Cliente S3 otimizado com timeout e configurações de performance
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  requestHandler: {
    requestTimeout: 10000, // 10 segundos timeout
    connectionTimeout: 5000, // 5 segundos para conectar
  },
  maxAttempts: 2, // Máximo 2 tentativas
});

export const uploadToS3 = async (file: Express.Multer.File, folder: string) => {
  const fileExtension = path.extname(file.originalname);
  const newFileName = `${uuidv4()}${fileExtension}`;

  const uploadParams = {
    Bucket: process.env.S3_BUCKET_NAME!,
    Key: `${folder}/${newFileName}`,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: "private" as ObjectCannedACL,
    // 🚀 Otimizações para upload mais rápido
    Metadata: {
      "original-name": file.originalname,
      "upload-time": new Date().toISOString(),
    },
  };

  const command = new PutObjectCommand(uploadParams);

  // 🚀 Upload com timeout e error handling otimizado
  try {
    await s3.send(command);
  } catch (error) {
    console.error(`Erro no upload S3 para ${newFileName}:`, error);
    throw new Error(`Falha no upload da imagem: ${file.originalname}`);
  }

  const urlCDN = process.env.CLOUD_FRONT_CDN;
  const awsUrl = `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com`;
  const baseUrl = urlCDN ? urlCDN : awsUrl;

  return {
    url: `${baseUrl}/${uploadParams.Key}`,
    originalFilename: file.originalname,
  };
};
