import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import HttpError from '../helpers/HttpError.js';

const tempDir = path.join(process.cwd(), 'temp');

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uniquePrefix = `${Date.now()}_${Math.round(Math.random() * 1e9)}`;
    const filename = `${uniquePrefix}_${file.originalname}`;
    cb(null, filename);
  },
});

const limits = {
  fileSize: 1024 * 1024 * 5,
};

const fileFilter = (req, file, cb) => {
  const extension = file.originalname.split('.').pop().toLowerCase();
  if (extension === 'exe') {
    return cb(HttpError(400, '.exe extension not allowed'));
  }

  cb(null, true);
};

const upload = multer({ storage, limits, fileFilter });

export default upload;
