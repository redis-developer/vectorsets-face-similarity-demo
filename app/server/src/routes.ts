import express, { Request, Response } from 'express';

import { HTTP_STATUS_CODES } from './utils/constants.js';
import { logError, getPureError } from './utils/logger.js';
import { existingElementSearch } from './api/existing-element-search/index.js';
import { newElementSearch } from './api/new-element-search/index.js';
import { addImageUploadRoute } from './upload.js';
import { getSampleImages } from './api/get-sample-images/index.js';
import { getServerConfig } from './api/get-server-config/index.js';

interface RouteResult {
  data: unknown;
  error: unknown;
}

const router = express.Router();

addImageUploadRoute(router);

router.post('/test', async (req: Request, res: Response) => {
  const result: RouteResult = {
    data: null,
    error: null,
  };

  try {
    result.data = 'Test API';
  } catch (err) {
    const pureErr = getPureError(err);
    logError('/test API failed !', pureErr);
    result.error = pureErr;
    res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR);
  }

  res.send(result);
});

router.post('/existingElementSearch', async (req: Request, res: Response) => {
  const result: RouteResult = {
    data: null,
    error: null,
  };
  const input = req.body;
  try {
    result.data = await existingElementSearch(input);
  } catch (err) {
    const pureErr = getPureError(err);
    logError('/existingElementSearch API failed !', pureErr);
    result.error = pureErr;
  }

  res.send(result);
});

router.post('/newElementSearch', async (req: Request, res: Response) => {
  const result: RouteResult = {
    data: null,
    error: null,
  };
  const input = req.body;

  try {
    result.data = await newElementSearch(input);
  } catch (err) {
    const pureErr = getPureError(err);
    logError('/newElementSearch API failed !', pureErr);
    result.error = pureErr;
  }

  res.send(result);
});

router.post('/getSampleImages', async (req: Request, res: Response) => {
  const result: RouteResult = {
    data: null,
    error: null,
  };
  try {
    result.data = await getSampleImages();
  } catch (err) {
    const pureErr = getPureError(err);
    logError('/getSampleImages API failed !', pureErr);
    result.error = pureErr;
  }

  res.send(result);
});

router.post('/getServerConfig', async (req: Request, res: Response) => {
  const result: RouteResult = {
    data: null,
    error: null,
  };

  try {
    result.data = await getServerConfig();
  } catch (err) {
    const pureErr = getPureError(err);
    logError('/getServerConfig API failed !', pureErr);
    result.error = pureErr;
  }

  res.send(result);
});

export { router };
