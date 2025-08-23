// "node app.js" -> will generate celebs.ndjson file and images folder

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { setTimeout as sleep } from "timers/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CONFIG
const DATASET = "tonyassi/celebrity-1000-embeddings";
const CONFIG = "default";
const SPLIT = "train";
const PAGE = 100; // API max
const OUT_DIR = path.join(__dirname, "images");
const OUT_NDJSON = path.join(__dirname, "celebs.ndjson");

// Rate limiting config
const BASE_DELAY = 200; // ms between requests
const MAX_RETRIES = 5;
const BACKOFF_MULTIPLIER = 2;

const ensureDir = (p) => fs.existsSync(p) || fs.mkdirSync(p, { recursive: true });
const sanitize = (s) => String(s ?? "").replace(/[^\w\-]+/g, "_").replace(/^_+|_+$/g, "");

// --- API helpers -------------------------------------------------------------

async function fetchWithRetry(url, options = {}, retries = MAX_RETRIES) {
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const response = await fetch(url, options);

            if (response.status === 429) {
                // Rate limited - exponential backoff
                const delay = BASE_DELAY * Math.pow(BACKOFF_MULTIPLIER, attempt);
                console.log(`Rate limited (attempt ${attempt + 1}/${retries + 1}). Waiting ${delay}ms...`);
                await sleep(delay);
                continue;
            }

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${await response.text()}`);
            }

            return response;
        } catch (error) {
            if (attempt === retries) {
                throw error;
            }

            const delay = BASE_DELAY * Math.pow(BACKOFF_MULTIPLIER, attempt);
            console.log(`Request failed (attempt ${attempt + 1}/${retries + 1}). Retrying in ${delay}ms...`);
            await sleep(delay);
        }
    }
}

async function fetchLabelNames() {
    // Prefer /first-rows (its `features` reliably contain ClassLabel.names)
    const u = new URL("https://datasets-server.huggingface.co/first-rows");
    u.searchParams.set("dataset", DATASET);
    u.searchParams.set("config", CONFIG);
    u.searchParams.set("split", SPLIT);

    const r = await fetchWithRetry(u);
    const j = await r.json();

    // j.features is an array; find the label feature and read .type.names
    const labelFeat = (j.features || []).find((f) => f.name === "label");
    const names = labelFeat?.type?.names;
    if (!Array.isArray(names) || names.length === 0) {
        throw new Error("Could not obtain ClassLabel names from /first-rows");
    }
    return names; // ["Aaron Eckhart", "Adam Sandler", ...]
}

async function fetchRows(offset, length) {
    const u = new URL("https://datasets-server.huggingface.co/rows");
    u.searchParams.set("dataset", DATASET);
    u.searchParams.set("config", CONFIG);
    u.searchParams.set("split", SPLIT);
    u.searchParams.set("offset", String(offset));
    u.searchParams.set("length", String(length));

    const r = await fetchWithRetry(u);
    return r.json();
}

// --- I/O helpers -------------------------------------------------------------

async function downloadImage(src, dest, retries = 3) {
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const r = await fetchWithRetry(src);
            const buf = Buffer.from(await r.arrayBuffer());
            fs.writeFileSync(dest, buf);
            return;
        } catch (error) {
            if (attempt === retries) {
                throw error;
            }
            const delay = BASE_DELAY * Math.pow(BACKOFF_MULTIPLIER, attempt);
            console.log(`Image download failed (attempt ${attempt + 1}/${retries + 1}). Retrying in ${delay}ms...`);
            await sleep(delay);
        }
    }
}

function idToName(labelValue, names) {
    // If the API ever returns strings, pass them through; otherwise map int->name
    if (typeof labelValue === "number") return names[labelValue] ?? `class_${labelValue}`;
    // Some viewer payloads prefix "class 3" — strip if present
    const m = String(labelValue).match(/^class[_\s]*(\d+)$/i);
    if (m) {
        const i = Number(m[1]);
        if (!Number.isNaN(i) && names[i]) return names[i];
    }
    return String(labelValue);
}

// --- Main --------------------------------------------------------------------

async function main() {
    ensureDir(OUT_DIR);
    const out = fs.createWriteStream(OUT_NDJSON, { flags: "w" });

    // 1) Fetch label names once
    const LABEL_NAMES = await fetchLabelNames(); // ← critical fix (real names)   [oai_citation:2‡Hugging Face](https://huggingface.co/docs/dataset-viewer/quick_start?utm_source=chatgpt.com)

    // 2) Discover total and process
    const first = await fetchRows(0, PAGE);
    const total = first.num_rows_total ?? first.num_rows ?? first.rows?.length ?? 0;
    console.log(`Total rows: ${total}`);

    async function handleBatch(resp) {
        for (const r of resp.rows) {
            const idx = r.row_idx;
            const row = r.row;

            // Columns (per docs):
            //  - row.image: { src, height, width } (signed URL)      [oai_citation:3‡Hugging Face](https://huggingface.co/docs/dataset-viewer/rows)
            //  - row.label: ClassLabel index (int)
            //  - row.embeddings: number[] (len 768)
            const img = row.image;
            const emb = row.embeddings;
            const labelName = idToName(row.label, LABEL_NAMES);

            if (!img?.src || !Array.isArray(emb)) continue;

            const ext = path.extname(new URL(img.src).pathname) || ".jpg";
            const filename = `${String(idx).padStart(5, "0")}_${sanitize(labelName)}${ext}`;
            const absPath = path.join(OUT_DIR, filename);

            try {
                await downloadImage(img.src, absPath);
            } catch (e) {
                console.warn(`skip image ${idx}: ${e.message}`);
                continue;
            }

            out.write(
                JSON.stringify({
                    id: `row:${idx}`,
                    label: labelName,
                    imagePath: `images/${filename}`,
                    embeddings: emb,
                }) + "\n"
            );

            if (idx < 3) {
                console.log(`Row ${idx} →`, {
                    label: labelName,
                    imageSaved: `images/${filename}`,
                    embLen: emb?.length,
                });
            }
        }
    }

    // first page + rest
    await handleBatch(first);
    for (let offset = PAGE; offset < total; offset += PAGE) {
        const resp = await fetchRows(offset, PAGE);
        await handleBatch(resp);
        await sleep(BASE_DELAY); // be nice to the API
        if (offset % 1000 === 0) console.log(`Fetched ${offset}/${total}…`);
    }

    out.end();
    console.log(`Done. Images → ${OUT_DIR}, NDJSON → ${OUT_NDJSON}`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});