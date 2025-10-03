import { uploadToS3 } from "./s3Upload";
import { getPrismaClient } from "../config/db";

const prisma = getPrismaClient();

// 🚀 OTIMIZAÇÃO CRÍTICA: Upload assíncrono de imagens
export const processImagesAsync = async (
  files: Express.Multer.File[], 
  petId: string
): Promise<void> => {
  try {
    console.log(`[ASYNC] Iniciando upload de ${files.length} imagens para pet ${petId}`);
    
    // Upload paralelo para S3
    const uploadPromises = files.map(async (file) => {
      try {
        const uploadResult = await uploadToS3(file, "pets");
        return {
          url: uploadResult.url,
          titulo: uploadResult.originalFilename,
          pet_id: petId,
        };
      } catch (error) {
        console.error(`[ASYNC] Erro no upload da imagem ${file.originalname}:`, error);
        return null; // Continua com outras imagens
      }
    });

    const uploadResults = await Promise.all(uploadPromises);
    
    // Filtra uploads que falharam
    const successfulUploads = uploadResults.filter(result => result !== null);
    
    if (successfulUploads.length > 0) {
      // Inserção em lote no banco
      await prisma.imagens.createMany({
        data: successfulUploads,
      });
      
      console.log(`[ASYNC] ${successfulUploads.length}/${files.length} imagens processadas com sucesso para pet ${petId}`);
    } else {
      console.error(`[ASYNC] Todas as imagens falharam no upload para pet ${petId}`);
    }
    
  } catch (error) {
    console.error(`[ASYNC] Erro geral no processamento de imagens para pet ${petId}:`, error);
  }
};