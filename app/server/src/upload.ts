import multer from 'multer';
import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import express, { Router, Request } from 'express';

import { getConfig } from './config.js';
import { logError, getPureError } from './utils/logger.js';

function addImageUploadRoute(router: Router) {
  const config = getConfig();

  // ensure uploads folder exists
  const UPLOAD_DIR = path.join(config.ROOT_DIR, config.UPLOAD_DIR);
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

  const storage = multer.diskStorage({
    destination: (
      req: Request,
      uploadedFile: Express.Multer.File,
      cb: (error: Error | null, destination: string) => void,
    ) => cb(null, UPLOAD_DIR),
    filename: (
      req: Request,
      file: Express.Multer.File,
      cb: (error: Error | null, filename: string) => void,
    ) => {
      const id = crypto.randomBytes(8).toString('hex');
      const ext = path.extname(file.originalname || '');
      cb(null, `${id}${ext || '.bin'}`);
    },
  });

  const upload = multer({
    storage,
    limits: { fileSize: config.UPLOAD_MAX_FILE_SIZE },
    fileFilter: (
      req: Request,
      file: Express.Multer.File,
      cb: multer.FileFilterCallback,
    ) => {
      if (!file.mimetype.startsWith('image/')) {
        return cb(new Error('Only image files are allowed'));
      }
      cb(null, true);
    },
  });

  router.post('/imageUpload', upload.single('file'), (req, res) => {
    const result: { data: unknown; error: unknown } = {
      data: null,
      error: null,
    };

    try {
      const f = req.file;
      if (!f) {
        throw new Error('No file uploaded');
      }
      const id = path.parse(f.filename).name;
      const url = `${config.BASE_PATH}/${config.UPLOAD_DIR}/${f.filename}`;
      const filename = f.originalname || f.filename;
      result.data = { id, url, filename };
    } catch (err) {
      const pureErr = getPureError(err);
      logError('/imageUpload API failed !', pureErr);
      result.error = pureErr;
    }

    res.send(result);
  });
}

export { addImageUploadRoute };
