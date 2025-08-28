import multer from "multer";
import crypto from "node:crypto";
import path from "node:path";
import fs from "node:fs";
import express, { Router, Request } from "express";

import { getConfig } from "./config.js";
import { LoggerCls } from "./utils/logger.js";

const addImageUploadRoute = (router: Router) => {
  const config = getConfig();

  // ensure uploads folder exists
  const UPLOAD_DIR = path.join(process.cwd(), config.UPLOAD_DIR);
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

  // configure multer storage
  const storage = multer.diskStorage({
    destination: (
      _req: Request,
      _file: Express.Multer.File,
      cb: (error: Error | null, destination: string) => void
    ) => cb(null, UPLOAD_DIR),
    filename: (
      _req: Request,
      file: Express.Multer.File,
      cb: (error: Error | null, filename: string) => void
    ) => {
      const id = crypto.randomBytes(8).toString("hex");
      const ext = path.extname(file.originalname || "");
      cb(null, `${id}${ext || ".bin"}`);
    },
  });

  const upload = multer({
    storage,
    limits: { fileSize: config.UPLOAD_MAX_FILE_SIZE },
    fileFilter: (
      _req: Request,
      file: Express.Multer.File,
      cb: multer.FileFilterCallback
    ) => {
      if (!file.mimetype.startsWith("image/")) {
        return cb(new Error("Only image files are allowed"));
      }
      cb(null, true);
    },
  });

  // static hosting for uploaded files
  router.use("/uploads", express.static(UPLOAD_DIR));

  router.post("/imageUpload", upload.single("file"), (req, res) => {
    const result: any = {
      data: null,
      error: null,
    };

    try {
      const f = req.file;
      if (!f) {
        throw Error("No file uploaded");
      }
      const id = path.parse(f.filename).name;
      const url = `/${config.UPLOAD_DIR}/${f.filename}`;
      const filename = f.originalname || f.filename;
      result.data = { id, url, filename };
    } catch (err) {
      err = LoggerCls.getPureError(err);
      LoggerCls.error("/imageUpload API failed !", err);
      result.error = err;
    }

    res.send(result);
  });
};

export { addImageUploadRoute };
