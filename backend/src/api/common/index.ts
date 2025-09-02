import type { IImageDoc } from "../../types.js";

import fs from "fs";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

const convertVectorSetSearchResultsToObjectArr = (results?: any[]) => {
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
  const returnResults = [];
  if (results?.length) {
    for (let i = 0; i < results.length; i += 3) {
      const elementId = results[i];
      const roundedScore = Number(results[i + 1]).toFixed(4);
      const attrs = JSON.parse(results[i + 2]);

      returnResults.push({
        elementId: elementId,
        score: roundedScore,
        ...attrs,
      });
    }
  }
  return returnResults;
};

const formatImageResults = (results: any[], imagePrefix: string) => {
  const formattedResults: IImageDoc[] = [];

  if (results && results.length > 0) {
    for (let res of results) {
      formattedResults.push({
        id: res.elementId,
        src: `${imagePrefix}${res.imagePath}`,
        label: res.label,
        score: res.score,
        meta: res,
      });
    }
  }
  return formattedResults;
};

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

const resolveRemoteImagePath = (imagePath: string): string => {
  // Handle localhost URLs by removing /api prefix
  let processedImagePath = imagePath;
  if (imagePath.startsWith("http:")) {
    const url = new URL(imagePath);
    if (url.pathname.startsWith("/api")) {
      processedImagePath = url.pathname.substring(4); // Remove /api prefix
    }
  }

  // Add backend path prefix for relative paths
  if (processedImagePath.startsWith("/")) {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const backendRoot = path.resolve(__dirname, "../../.."); // Go up from api/common/ to backend/
    processedImagePath = path.join(backendRoot, processedImagePath);
  }

  return processedImagePath;
};

export {
  formatImageResults,
  convertVectorSetSearchResultsToObjectArr,
  resolveRemoteImagePath,
};
