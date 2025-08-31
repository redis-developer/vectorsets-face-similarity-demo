// embed-clip.js
import { env, AutoProcessor, CLIPVisionModelWithProjection, RawImage } from "@xenova/transformers";
import fs from "fs";
import path from "path";
import readline from "readline";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

env.allowLocalModels = true;
env.allowRemoteModels = true;

const MODEL_ID = "Xenova/clip-vit-large-patch14"; // 768-dim image_embeds
let processor, model;

async function load() {
    if (!processor || !model) {
        processor = await AutoProcessor.from_pretrained(MODEL_ID);
        model = await CLIPVisionModelWithProjection.from_pretrained(MODEL_ID);
    }
}
async function embedImage(absPath) {
    await load();
    const img = await RawImage.read(absPath);
    const inputs = await processor(img);
    const out = await model(inputs);
    let v = Array.from(out.image_embeds.data); // length 768
    const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
    return v.map(x => x / norm);
}

const OUTPUT_DIR = "output";
const INPUT_NDJSON = path.join(__dirname, OUTPUT_DIR, "tmdb.ndjson");
const OUTPUT_NDJSON = path.join(__dirname, OUTPUT_DIR, "tmdb.embedded.ndjson");

async function main() {
    const rl = readline.createInterface({
        input: fs.createReadStream(INPUT_NDJSON, { encoding: "utf8" }),
        crlfDelay: Infinity
    });
    const out = fs.createWriteStream(OUTPUT_NDJSON, { flags: "w" });

    let i = 0, skipped = 0;
    for await (const line of rl) {
        if (!line.trim()) continue;
        const rec = JSON.parse(line);
        try {
            const emb = await embedImage(path.resolve(__dirname, OUTPUT_DIR, rec.imagePath));
            out.write(JSON.stringify({ ...rec, embeddings: emb }) + "\n");
            if (++i % 200 === 0) console.log(`Embedded ${i}…`);
        } catch (e) {
            skipped++;
            console.warn(`skip ${rec.id}: ${e.message}`);
        }
    }
    out.end();
    console.log(`Done. Embedded ${i}, skipped ${skipped}. -> ${OUTPUT_NDJSON}`);
}
main().catch(e => { console.error(e); process.exit(1); });