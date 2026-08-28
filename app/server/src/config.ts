import fs from 'node:fs';
import path from 'node:path';
import { config as dotenvConfig } from 'dotenv';
import type { Dataset } from './types.js';
import { DEFAULT_FRAME_ANCESTORS } from './utils/constants.js';

function findEnvFile(): string | undefined {
  let dir = process.cwd();
  while (true) {
    const candidate = path.join(dir, '.env');
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) return undefined;
    dir = parent;
  }
}

dotenvConfig({ path: findEnvFile() });

function getBasePath(): string {
  return (process.env.BASE_PATH || '').replace(/\/+$/, '');
}

const splitList = (value: string): string[] =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

function buildDataset(bp: string): Dataset {
  return {
    IMAGE_PREFIX:
      process.env.IMAGE_PREFIX ||
      'https://storage.googleapis.com/redis-vectorsets-face-images/faces/',
    VECTOR_SET: {
      KEY: 'vset:faces',
      DIM: 3072,
    },
  };
}

function getConfig() {
  const bp = getBasePath();
  const dataset = buildDataset(bp);
  return {
    ENV: process.env.NODE_ENV,
    ROOT_DIR: path.join(process.cwd()),
    BASE_PATH: bp,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
    PORT: process.env.PORT || '3000',
    UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',
    UPLOAD_MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    corsOrigins: splitList(process.env.CORS_ORIGINS || ''),
    frameAncestors: splitList(
      process.env.FRAME_ANCESTORS ?? DEFAULT_FRAME_ANCESTORS,
    ),

    DATASET: dataset,
  };
}

export { getConfig };
