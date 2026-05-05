import { GoogleGenAI } from '@google/genai';
import fs from 'node:fs';
import path from 'node:path';

import { getConfig } from '../../config.js';
import { GEMINI_MODEL, GEMINI_EMBEDDING_DIMS } from '../../utils/constants.js';
import { resolveRemoteImagePath } from '../common/index.js';

let ai: GoogleGenAI | null = null;

const getAI = (): GoogleGenAI => {
  if (!ai) {
    const config = getConfig();
    if (!config.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set');
    }
    ai = new GoogleGenAI({ apiKey: config.GEMINI_API_KEY });
  }
  return ai;
};

const getImageEmbedding = async (imagePath: string): Promise<number[]> => {
  const resolved = resolveRemoteImagePath(imagePath);
  const absPath = path.resolve(resolved);
  const imageBuffer = fs.readFileSync(absPath);
  const base64Image = imageBuffer.toString('base64');

  const mimeType = absPath.endsWith('.png') ? 'image/png' : 'image/jpeg';

  const client = getAI();
  const response = await client.models.embedContent({
    model: GEMINI_MODEL,
    contents: [
      {
        parts: [{ inlineData: { mimeType, data: base64Image } }],
      },
    ],
    config: {
      outputDimensionality: GEMINI_EMBEDDING_DIMS,
    },
  });

  const embedding = response.embeddings?.[0]?.values;
  if (!embedding || embedding.length === 0) {
    throw new Error('Gemini returned empty embedding');
  }

  return embedding;
};

export { getImageEmbedding };
