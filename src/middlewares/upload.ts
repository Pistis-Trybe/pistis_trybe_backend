import multer from "multer";
import config from "../configurations";

const storage = multer.memoryStorage();

const imageAndVideoFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = [
    "image/jpeg", "image/png", "image/webp", "image/gif",
    "video/mp4", "video/quicktime", "video/webm", "video/avi",
  ];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Unsupported file type. Only images and videos are allowed."));
  }
};


export const uploadSingle = multer({
  storage,
  limits: { fileSize: config.UPLOAD_MAX_FILE_SIZE_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/quicktime"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type"));
    }
  },
}).single("file");

export const uploadMultiple = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/quicktime"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type"));
    }
  },
}).array("files", 5);
