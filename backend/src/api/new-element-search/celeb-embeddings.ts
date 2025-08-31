import fetch from "node-fetch";
import FormData from "form-data";

import { getConfig } from "../../config.js";
import { getImageData } from "../common/index.js";

const getCelebEmbedding = async (imagePath: string): Promise<number[]> => {
  const config = getConfig();
  const form = new FormData();

  const imageData = await getImageData(imagePath);
  form.append("file", imageData.buffer, {
    filename: imageData.filename,
    contentType: imageData.contentType,
  });

  const res = await fetch(config.EMBED_PYTHON_URL, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error(await res.text());
  const json = await res.json();
  return json.embedding as number[]; // length 768
};

export { getCelebEmbedding };
