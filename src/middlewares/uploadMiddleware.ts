import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import sharp from 'sharp';

const IMAGE_SIZE_LIMIT = 5 * 1024 * 1024;
const DOCUMENT_SIZE_LIMIT = 10 * 1024 * 1024;

const imageFileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Tipo de imagem inválida. Somente JPEG, JPG, PNG, e GIF são permitidos.'));
    }
};

const documentFileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/zip',
        'application/x-zip-compressed',
        'application/x-rar-compressed',
        'application/vnd.rar',
        'image/jpeg', 
        'image/jpg', 
        'image/png', 
        'image/gif'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Tipo de documento inválido. Soment PDF, DOC, DOCX, ZIP, e RAR são permitidos.'));
    }
};
const multerStorage = multer.memoryStorage();

const imageUpload = multer({
    storage: multerStorage,
    limits: { fileSize: IMAGE_SIZE_LIMIT },
    fileFilter: imageFileFilter
});

const documentUpload = multer({
    storage: multerStorage,
    limits: { fileSize: DOCUMENT_SIZE_LIMIT },
    fileFilter: documentFileFilter
});

const optimizeImage = async (fileBuffer: Buffer) => {
    return await sharp(fileBuffer)
        .resize({ width: 800 })
        .jpeg({ quality: 80 })
        .toBuffer();
};

const preserveBody = (type: 'image' | 'images' | 'documents') => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const originalBody = { ...req.body };

        if (type === 'image') {
            imageUpload.single('image')(req, res, async (err: any) => {
                if (err) {
                    return res.status(400).json({ message: 'Erro ao realizar upload', error: err.message });
                }

                if (req.file) {
                    req.file.buffer = await optimizeImage(req.file.buffer);
                }

                req.body = { ...originalBody, ...req.body };
                next();
            });
        } else if (type === 'images') {
            imageUpload.array('images', 5)(req, res, async (err: any) => {
                if (err) {
                    return res.status(400).json({ message: 'Erro ao realizar upload', error: err.message });
                }

                if (req.files && Array.isArray(req.files)) {
                    for (let file of req.files) {
                        file.buffer = await optimizeImage(file.buffer);
                    }
                }

                req.body = { ...originalBody, ...req.body };
                next();
            });
        } else if (type === 'documents') {
            documentUpload.array('documents')(req, res, async (err: any) => {
                if (err) {
                    return res.status(400).json({ message: 'Erro ao realizar upload', error: err.message });
                }

                req.body = { ...originalBody, ...req.body };
                next();
            });
        } else {
            return res.status(400).json({ message: 'Erro ao realizar upload', error: 'Tipo de upload inválido' });
        }
    };
};

export { preserveBody };
