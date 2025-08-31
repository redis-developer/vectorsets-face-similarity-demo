import {
  AutoProcessor,
  CLIPVisionModelWithProjection,
  RawImage,
  env,
} from "@xenova/transformers";
import path from "path";
import { fileURLToPath } from "url";

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

function resolveImagePath(imagePath: string): string {
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
    const backendRoot = path.resolve(__dirname, "../../.."); // Go up from api/new-element-search/ to backend/
    processedImagePath = path.join(backendRoot, processedImagePath);
  }

  return processedImagePath;
}

export async function getImageEmbeddings(imagePath: string): Promise<number[]> {
  await loadClipVision();

  const resolvedImagePath = resolveImagePath(imagePath);

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
