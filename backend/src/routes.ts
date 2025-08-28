import express, { Request, Response } from "express";
import path from "node:path";

import { HTTP_STATUS_CODES } from "./utils/constants.js";
import { LoggerCls } from "./utils/logger.js";
import { existingElementSearch } from "./api/existing-element-search/index.js";
import { newElementSearch } from "./api/new-element-search/index.js";
import { addImageUploadRoute } from "./upload.js";
import { getSampleImages } from "./api/get-sample-images/index.js";

const router = express.Router();

addImageUploadRoute(router);

// static hosting for dataset images
const STATIC_DIR = path.join(process.cwd(), "static");
router.use("/static", express.static(STATIC_DIR));

router.post("/test", async (req: Request, res: Response) => {
  const result: any = {
    data: null,
    error: null,
  };
  const input = req.body;

  try {
    result.data = "Test API";
  } catch (err) {
    err = LoggerCls.getPureError(err);
    LoggerCls.error("/test API failed !", err);
    result.error = err;
    res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR);
  }

  res.send(result);
});

router.post("/existingElementSearch", async (req: Request, res: Response) => {
  const result: any = {
    data: null,
    error: null,
  };
  const input = req.body;
  try {
    result.data = await existingElementSearch(input);
  } catch (err) {
    err = LoggerCls.getPureError(err);
    LoggerCls.error("/existingElementSearch API failed !", err);
    result.error = err;
  }

  res.send(result);
});

router.post("/newElementSearch", async (req: Request, res: Response) => {
  const result: any = {
    data: null,
    error: null,
  };
  const input = req.body;

  try {
    result.data = await newElementSearch(input);
  } catch (err) {
    err = LoggerCls.getPureError(err);
    LoggerCls.error("/newElementSearch API failed !", err);
    result.error = err;
  }

  res.send(result);
});

router.post("/getSampleImages", async (req: Request, res: Response) => {
  const result: any = {
    data: null,
    error: null,
  };
  const input = req.body;

  try {
    result.data = await getSampleImages();
  } catch (err) {
    err = LoggerCls.getPureError(err);
    LoggerCls.error("/getSampleImages API failed !", err);
    result.error = err;
  }

  res.send(result);
});

export { router };
