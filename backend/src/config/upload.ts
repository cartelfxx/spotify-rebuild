import multer from 'multer';
import path from 'path';
import fs from 'fs';


const uploadsDir = path.join(__dirname, '../../uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}


const audioStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tracksDir = path.join(uploadsDir, 'tracks');
    if (!fs.existsSync(tracksDir)) {
      fs.mkdirSync(tracksDir, { recursive: true });
    }
    cb(null, tracksDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});


const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const imagesDir = path.join(uploadsDir, 'images');
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }
    cb(null, imagesDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});


export const audioUpload = multer({
  storage: audioStorage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  },
});

export const imageUpload = multer({
  storage: imageStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});


export const getFileUrl = (filename: string, type: 'audio' | 'image'): string => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
  return `${baseUrl}/uploads/${type}/${filename}`;
};


export const deleteFile = (filename: string, type: 'audio' | 'image'): void => {
  const filePath = path.join(uploadsDir, type, filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}; 