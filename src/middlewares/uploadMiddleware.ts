import multer from "multer";
import { Request, Response, NextFunction } from "express";
import sharp from "sharp";

const IMAGE_SIZE_LIMIT = 5 * 1024 * 1024; // Reduzido para 5MB

const imageFileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Tipo de imagem inválida. Somente JPEG, JPG, PNG, e GIF são permitidos."));
  }
};

const multerStorage = multer.memoryStorage();

const imageUpload = multer({
  storage: multerStorage,
  limits: { fileSize: IMAGE_SIZE_LIMIT },
  fileFilter: imageFileFilter,
});

const optimizeImage = async (fileBuffer: Buffer) => {
  // 🚀 OTIMIZAÇÃO: Configuração mais leve do Sharp
  return await sharp(fileBuffer)
    .resize({ 
      width: 600, 
      height: 600, 
      fit: 'inside', 
      withoutEnlargement: true 
    })
    .jpeg({ 
      quality: 70,  // Reduzido para 70%
      progressive: false,  // Desabilitado para ser mais rápido
      mozjpeg: true  // Usa mozjpeg para melhor compressão
    })
    .toBuffer();
};

const preserveBody = (type: "image" | "images") => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const originalBody = { ...req.body };

    if (type === "image") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      imageUpload.single("image")(req, res, async (err: any) => {
        if (err) {
          return res.status(400).json({ message: "Erro ao realizar upload", error: err.message });
        }

        if (req.file) {
          req.file.buffer = await optimizeImage(req.file.buffer);
        }

        req.body = { ...originalBody, ...req.body };
        next();
      });
    } else if (type === "images") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      imageUpload.array("images", 5)(req, res, async (err: any) => {
        if (err) {
          return res.status(400).json({ message: "Erro ao realizar upload", error: err.message });
        }

        if (req.files && Array.isArray(req.files)) {
          // 🚀 OTIMIZAÇÃO: Processamento paralelo das imagens
          const optimizationPromises = req.files.map(async (file) => {
            file.buffer = await optimizeImage(file.buffer);
            return file;
          });
          
          await Promise.all(optimizationPromises);
        }

        req.body = { ...originalBody, ...req.body };
        next();
      });
    } else {
      return res
        .status(400)
        .json({ message: "Erro ao realizar upload", error: "Tipo de upload inválido" });
    }
  };
};

export { preserveBody };
