import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { env } from '../utils/env';

const uploadDir = path.resolve(process.cwd(), env.UPLOAD_DIR);

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const rawExt = path.extname(file.originalname).toLowerCase();
    const safeExt = ALLOWED_EXTENSIONS.includes(rawExt) ? rawExt : '.jpg';
    cb(null, `${crypto.randomUUID()}${safeExt}`);
  },
});

export const upload = multer({
  storage,
  limits: {
    fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024,
    files: 5,
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    // Prevent path traversal and null bytes in original filename
    if (file.originalname.includes('\0') || file.originalname.includes('..')) {
      return cb(new Error('Nama file tidak valid atau berpotensi membahayakan.'));
    }

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return cb(new Error('Ekstensi file tidak diizinkan. Hanya format JPG, JPEG, PNG, dan WebP yang diperbolehkan.'));
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(new Error('Tipe MIME file tidak diizinkan. Hanya gambar JPEG, PNG, dan WebP yang diperbolehkan.'));
    }

    cb(null, true);
  },
});
