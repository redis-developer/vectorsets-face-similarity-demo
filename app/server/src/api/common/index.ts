import type { ImageDoc } from '../../types.js';

import fs from 'fs';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

import { isBlocked } from '../../blocklist.js';
import { getConfig } from '../../config.js';

function convertVectorSetSearchResultsToObjectArr(
  results?: unknown[],
): Record<string, unknown>[] {
  /**
 results  = [
    'e12403',
    '1',
    '{"label":"Megan Rapinoe","imagePath":"images/12402_Megan_Rapinoe.jpg","charCount":13}',
    'e12412',
    '0.9574365168809891',
    '{"label":"Megan Rapinoe","imagePath":"images/12411_Megan_Rapinoe.jpg","charCount":13}',
  ]

  output will be
  [
    {
      elementId: 'e12403',
      score: '1',
      label: 'Megan Rapinoe',
      imagePath: 'images/12402_Megan_Rapinoe.jpg',
      charCount: 13
    },
  ]
 */
  const returnResults: Record<string, unknown>[] = [];
  if (results?.length) {
    for (let i = 0; i < results.length; i += 3) {
      const elementId = results[i];
      const roundedScore = Number(results[i + 1]).toFixed(4);
      const attrs = JSON.parse(String(results[i + 2])) as Record<
        string,
        unknown
      >;

      returnResults.push({
        elementId: elementId,
        score: roundedScore,
        ...attrs,
      });
    }
  }
  return returnResults;
}

function formatImageResults(
  results: Record<string, unknown>[],
  imagePrefix: string,
) {
  const formattedResults: ImageDoc[] = [];

  if (results && results.length > 0) {
    for (const res of results) {
      if (isBlocked(res.label as string | undefined)) {
        continue;
      }
      formattedResults.push({
        id: String(res.elementId),
        src: `${imagePrefix}${res.imagePath}`,
        label: res.label as string | undefined,
        score: res.score as number | undefined,
        meta: res,
      });
    }
  }
  return formattedResults;
}

// const getImageData = async (
//   imagePath: string
// ): Promise<{ buffer: Buffer; filename: string; contentType: string }> => {
//   let buffer: Buffer;
//   let filename: string;
//   let contentType: string;

//   // Check if imagePath is a URL
//   if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
//     // Fetch the image from URL
//     const imageResponse = await fetch(imagePath);
//     if (!imageResponse.ok) {
//       throw new Error(`Failed to fetch image from URL: ${imagePath}`);
//     }
//     buffer = await imageResponse.buffer();
//     filename = imagePath.split("/").pop() || "image.jpg";
//     contentType = imageResponse.headers.get("content-type") || "image/jpeg";
//   } else {
//     // Read local file
//     buffer = fs.readFileSync(imagePath);
//     filename = imagePath.split("/").pop() || "image.jpg";
//     contentType = "image/jpeg"; // Default content type for local files
//   }

//   return {
//     buffer,
//     filename,
//     contentType,
//   };
// };

function resolveRemoteImagePath(imagePath: string): string {
  const config = getConfig();
  let processedImagePath = imagePath;

  if (imagePath.startsWith('http:') || imagePath.startsWith('https:')) {
    const url = new URL(imagePath);
    processedImagePath = url.pathname;
  }

  // Strip BASE_PATH prefix so the path resolves to the actual file on disk
  if (
    config.BASE_PATH &&
    processedImagePath.startsWith(config.BASE_PATH)
  ) {
    processedImagePath = processedImagePath.substring(
      config.BASE_PATH.length,
    );
  }

  if (processedImagePath.startsWith('/')) {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const serverRoot = path.resolve(__dirname, '../../..');
    processedImagePath = path.join(serverRoot, processedImagePath);
  }

  return processedImagePath;
}

export {
  formatImageResults,
  convertVectorSetSearchResultsToObjectArr,
  resolveRemoteImagePath,
};
