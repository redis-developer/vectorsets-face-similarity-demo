import {
  AutoProcessor,
  CLIPVisionModelWithProjection,
  RawImage,
  env,
} from "@xenova/transformers";
import { resolveRemoteImagePath } from "../common/index.js";

// Configure transformers.js
env.allowLocalModels = true;
env.allowRemoteModels = true;

// Use a CLIP vision model that outputs 768-dim image embeddings (ViT-L/14)
const MODEL_ID = "Xenova/clip-vit-large-patch14"; // transformers.js ONNX weights for CLIP-L/14
let processor: any;
let vision: any;

async function loadClipVision() {
  if (!processor || !vision) {
    processor = await AutoProcessor.from_pretrained(MODEL_ID);
    vision = await CLIPVisionModelWithProjection.from_pretrained(MODEL_ID);
  }
}

export async function getImageEmbeddings(imagePath: string): Promise<number[]> {
  await loadClipVision();

  const resolvedImagePath = resolveRemoteImagePath(imagePath);

  // Load image directly from path (works for both local files and processed localhost URLs)
  const image = await RawImage.read(resolvedImagePath);

  // Preprocess + forward pass
  const inputs = await processor(image);
  const output = await vision(inputs);

  // output.image_embeds is a Float32Array of length 768 for ViT-L/14
  let emb = Array.from(output.image_embeds.data) as number[]; // [768]

  // (Recommended) L2-normalize for cosine similarity
  const norm = Math.sqrt(emb.reduce((s, v) => s + v * v, 0)) || 1;
  emb = emb.map((v) => v / norm);

  return emb;
}
