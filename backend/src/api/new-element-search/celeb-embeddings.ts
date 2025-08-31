import fetch from "node-fetch";
import FormData from "form-data";
import fs from "fs";
import path from "path";

import { getConfig } from "../../config.js";
import { resolveRemoteImagePath } from "../common/index.js";

const getCelebEmbedding = async (imagePath: string): Promise<number[]> => {
  const config = getConfig();
  const form = new FormData();

  // Try to resolve to local path first
  const resolvedPath = resolveRemoteImagePath(imagePath);

  // Check if the resolved path exists as a local file
  //if (fs.existsSync(resolvedPath)) {
  // Use local file directly with fs.readFileSync
  const buffer = fs.readFileSync(resolvedPath);
  const filename = path.basename(resolvedPath);
  const contentType = "image/jpeg"; // Default content type for local files

  form.append("file", buffer, {
    filename: filename,
    contentType: contentType,
  });
  // } else {
  //   // Fall back to original getImageData for remote URLs or non-existent local paths
  //   const imageData = await getImageData(imagePath);
  //   form.append("file", imageData.buffer, {
  //     filename: imageData.filename,
  //     contentType: imageData.contentType,
  //   });
  // }

  const res = await fetch(config.EMBED_PYTHON_URL, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error(await res.text());
  const json = await res.json();
  return json.embedding as number[]; // length 768
};

export { getCelebEmbedding };
