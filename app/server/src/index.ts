import express from 'express';
import cors from 'cors';

import { router } from './routes.js';
import { logInfo, logError, getPureError } from './utils/logger.js';
import { RedisWrapperST } from './utils/redis.js';
import { getConfig } from './config.js';
import path from 'node:path';

const config = getConfig();
//#region Constants
const PORT = config.PORT;
const REDIS_URL = config.REDIS_URL;
const BASE_PATH = config.BASE_PATH;
//#endregion

const app = express();
app.use(cors());

app.use(express.json());

app.use(`${BASE_PATH}/api`, router);

app.use(
  `${BASE_PATH}/uploads`,
  express.static(path.join(config.ROOT_DIR, config.UPLOAD_DIR)),
);
app.use(
  `${BASE_PATH}/static`,
  express.static(path.join(config.ROOT_DIR, 'static')),
);
app.use(BASE_PATH || '/', express.static('../dist'));
app.listen(Number(PORT), async () => {
  logInfo(`Server running on port ${PORT}`);
  const redisWrapperST = RedisWrapperST.setInstance(REDIS_URL);
  await redisWrapperST.connect();
});

//#region error handling

const gracefulShutdown = async () => {
  try {
    const redisWrapperST = RedisWrapperST.getInstance();
    await redisWrapperST.disconnect();
    process.exit(0);
  } catch (error) {
    logError('Error during graceful shutdown:', getPureError(error));
    process.exit(1);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

process.on('unhandledRejection', (reason, promise) => {
  logError('Unhandled promise Rejection :', {
    promise: getPureError(promise),
    reason: getPureError(reason),
  });
});

process.on('uncaughtException', async (error) => {
  logError('Uncaught Exception:', getPureError(error));
  await gracefulShutdown();
});
//#endregion
