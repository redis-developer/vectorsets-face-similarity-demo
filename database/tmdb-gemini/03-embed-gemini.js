/**
 * 03-embed-gemini.js — Embed face-cropped images with Gemini Embedding 2.
 *
 * Reads the NDJSON manifest from Phase 1 and face-cropped images from Phase 2,
 * calls the Gemini API to generate embeddings, and writes an embedded NDJSON.
 *
 * Setup:
 *   - Create .env with GEMINI_API_KEY (get from https://aistudio.google.com/)
 *   - npm install
 *
 * Usage:
 *   node 03-embed-gemini.js [options]
 *
 * Options:
 *   --ndjson <path>       Input NDJSON from Phase 1    (default: output/tmdb-hq.ndjson)
 *   --images <dir>        Cropped images from Phase 2  (default: output/images-cropped)
 *   --out <path>          Output embedded NDJSON        (default: output/tmdb.embedded.ndjson)
 *   --dims <n>            Embedding dimensions          (default: 3072)
 *   --limit <n>           Max images to embed           (default: all)
 *   --concurrency <n>     Parallel API requests         (default: 5)
 *   --dry-run             Log what would be done, don't call API
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';
import { setTimeout as sleep } from 'timers/promises';
import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ──────────── CLI args ────────────

function argVal(flag, def) {
  const i = process.argv.indexOf(flag);
  return i === -1 ? def : process.argv[i + 1];
}

const MODEL = 'gemini-embedding-2-preview';
const DIMS = Number(argVal('--dims', '3072'));
const LIMIT = Number(argVal('--limit', '0')); // 0 = all
const CONCURRENCY = Number(argVal('--concurrency', '5'));
const DRY_RUN = process.argv.includes('--dry-run');

const OUTPUT_ROOT = path.join(__dirname, 'output');
const INPUT_NDJSON = argVal('--ndjson', path.join(OUTPUT_ROOT, 'tmdb-hq.ndjson'));
const IMAGES_DIR = argVal('--images', path.join(OUTPUT_ROOT, 'images-cropped'));
const OUT_NDJSON = argVal('--out', path.join(OUTPUT_ROOT, 'tmdb.embedded.ndjson'));
const CHECKPOINT = path.join(OUTPUT_ROOT, '.embed-checkpoint.json');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// ──────────── Validation ────────────

if (!GEMINI_API_KEY && !DRY_RUN) {
  console.error('❌ GEMINI_API_KEY is required. Set it in .env or as an environment variable.');
  console.error('   Get a free key at: https://aistudio.google.com/');
  console.error('   Or use --dry-run to test without calling the API.');
  process.exit(1);
}

if (!fs.existsSync(INPUT_NDJSON)) {
  console.error(`❌ Input NDJSON not found: ${INPUT_NDJSON}`);
  console.error('   Run 01-fetch-hq.js first.');
  process.exit(1);
}

// ──────────── Gemini client ────────────

const ai = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

async function embedImage(imagePath) {
  const base64 = fs.readFileSync(imagePath, { encoding: 'base64' });
  const mimeType = imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';

  const response = await ai.models.embedContent({
    model: MODEL,
    contents: [
      {
        inlineData: {
          mimeType,
          data: base64,
        },
      },
    ],
    config: {
      outputDimensionality: DIMS,
    },
  });

  return response.embeddings[0].values;
}

async function embedWithRetry(imagePath, label, maxRetries = 5) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await embedImage(imagePath);
    } catch (err) {
      const msg = err.message || String(err);
      const isRateLimit = msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED');
      const isServer = msg.includes('500') || msg.includes('503') || msg.includes('UNAVAILABLE');

      if ((isRateLimit || isServer) && attempt < maxRetries) {
        const backoff = Math.min(60000, 1000 * 2 ** attempt) + Math.random() * 1000;
        console.warn(`  ⏳ [${label}] ${isRateLimit ? '429' : '5xx'}. Retry in ${(backoff / 1000).toFixed(1)}s (attempt ${attempt + 1})`);
        await sleep(backoff);
        continue;
      }

      throw err;
    }
  }
}

// ──────────── Checkpoint ────────────

function loadCheckpoint() {
  try {
    return new Set(JSON.parse(fs.readFileSync(CHECKPOINT, 'utf8')));
  } catch {
    return new Set();
  }
}

function saveCheckpoint(processed) {
  fs.writeFileSync(CHECKPOINT, JSON.stringify([...processed]));
}

// ──────────── Read NDJSON ────────────

async function readNdjson(filePath) {
  const records = [];
  const rl = readline.createInterface({
    input: fs.createReadStream(filePath, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });
  for await (const line of rl) {
    const t = line.trim();
    if (!t) continue;
    try {
      records.push(JSON.parse(t));
    } catch {}
  }
  return records;
}

// ──────────── Main ────────────

async function main() {
  console.log('🧠 Gemini Embedding Pipeline');
  console.log(`   Model: ${MODEL} | Dims: ${DIMS}`);
  console.log(`   Input NDJSON: ${INPUT_NDJSON}`);
  console.log(`   Images dir:   ${IMAGES_DIR}`);
  console.log(`   Output:       ${OUT_NDJSON}`);
  console.log(`   Concurrency:  ${CONCURRENCY} | Limit: ${LIMIT || 'all'}`);
  console.log(`   Dry run:      ${DRY_RUN}`);
  console.log();

  const rawRecords = await readNdjson(INPUT_NDJSON);
  const seenIds = new Set();
  const records = rawRecords.filter((r) => {
    if (seenIds.has(r.id)) return false;
    seenIds.add(r.id);
    return true;
  });
  if (rawRecords.length !== records.length) {
    console.log(`📋 Loaded ${rawRecords.length} records, deduped to ${records.length} unique`);
  } else {
    console.log(`📋 Loaded ${records.length} records from NDJSON`);
  }

  // Load checkpoint (already processed IDs)
  const processed = loadCheckpoint();
  if (processed.size > 0) {
    console.log(`♻️  Resuming: ${processed.size} already embedded\n`);
  }

  // Open output for append
  const outStream = fs.createWriteStream(OUT_NDJSON, {
    flags: processed.size > 0 ? 'a' : 'w',
  });

  const toProcess = records.filter((r) => !processed.has(r.id));
  const total = LIMIT > 0 ? Math.min(LIMIT, toProcess.length) : toProcess.length;
  const batch = toProcess.slice(0, total);

  console.log(`🚀 Embedding ${total} images (${records.length - toProcess.length} skipped as done)\n`);

  const stats = { ok: 0, fail: 0 };
  const t0 = Date.now();

  // Process in chunks for controlled concurrency
  for (let i = 0; i < batch.length; i += CONCURRENCY) {
    const chunk = batch.slice(i, i + CONCURRENCY);

    const promises = chunk.map(async (rec) => {
      // Resolve image path: try cropped first, fall back to hq
      const filename = path.basename(rec.imagePath);
      let imgPath = path.join(IMAGES_DIR, filename);

      if (!fs.existsSync(imgPath)) {
        // Fall back to images-hq if cropped doesn't exist
        const hqPath = path.join(OUTPUT_ROOT, 'images-hq', filename);
        if (fs.existsSync(hqPath)) {
          imgPath = hqPath;
        } else {
          console.warn(`  ⚠️  Image not found: ${filename} — skipping`);
          stats.fail++;
          return;
        }
      }

      if (DRY_RUN) {
        const sizeKB = (fs.statSync(imgPath).size / 1024).toFixed(0);
        console.log(`  [dry-run] Would embed: ${filename} (${sizeKB} KB)`);
        stats.ok++;
        return;
      }

      try {
        const embedding = await embedWithRetry(imgPath, rec.label || filename);

        const outRec = {
          ...rec,
          embedding,
        };
        outStream.write(JSON.stringify(outRec) + '\n');
        processed.add(rec.id);
        stats.ok++;
      } catch (err) {
        console.error(`  ❌ Failed: ${filename} — ${err.message}`);
        stats.fail++;
      }
    });

    await Promise.all(promises);

    // Checkpoint every chunk
    if (!DRY_RUN && (i + CONCURRENCY) % 50 === 0) {
      saveCheckpoint(processed);
    }

    // Progress
    const done = Math.min(i + CONCURRENCY, batch.length);
    if (done % 100 === 0 || done === batch.length) {
      const elapsed = (Date.now() - t0) / 1000;
      const rate = stats.ok / elapsed;
      const eta = rate > 0 ? (total - done) / rate : 0;
      process.stdout.write(
        `\r  📊 ${done}/${total} | ` +
        `${stats.ok} ok, ${stats.fail} fail | ` +
        `${rate.toFixed(1)} img/s | ETA ${eta.toFixed(0)}s   `,
      );
    }
  }

  outStream.end();
  if (!DRY_RUN) saveCheckpoint(processed);

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`\n\n✅ Done in ${elapsed}s`);
  console.log(`   Embedded: ${stats.ok} | Failed: ${stats.fail}`);
  console.log(`   Output:   ${OUT_NDJSON}`);
  console.log(`   Dims:     ${DIMS}`);

  if (stats.ok > 0 && !DRY_RUN) {
    // Quick sanity check: read last line only (file can be very large)
    const { execSync } = await import('node:child_process');
    const lastLine = execSync(`tail -1 "${OUT_NDJSON}"`, { encoding: 'utf8' }).trim();
    if (lastLine) {
      const last = JSON.parse(lastLine);
      console.log(`\n   🔍 Sanity check (last record):`);
      console.log(`      Label:     ${last.label}`);
      console.log(`      Embedding: ${last.embedding.length}-d [${last.embedding.slice(0, 3).map((v) => v.toFixed(6)).join(', ')} ...]`);
    }
  }
}

main().catch((e) => {
  console.error('💥 Fatal error:', e);
  process.exit(1);
});
