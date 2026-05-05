/**
 * 01-fetch-hq.js — Download original-resolution TMDB profile images.
 *
 * Strategy:
 *   1. Page through the HuggingFace dataset (ashraq/tmdb-people-image) for metadata + imdb_id
 *   2. For each person, call TMDB "Find by IMDb ID" to get profile_path
 *   3. Download the image from TMDB CDN at "original" resolution
 *   4. Fall back to the HF dataset image if TMDB lookup fails
 *   5. Write an NDJSON manifest with all metadata
 *
 * Usage:
 *   TMDB_API_KEY=xxx node 01-fetch-hq.js [options]
 *
 * Options:
 *   --limit <n>             Total images to download (default: 10000)
 *   --offset <n>            HF row offset to start from (default: 0)
 *   --page <n>              HF rows per page (default: 50, max 100)
 *   --department <str>      Filter by department (default: "Acting")
 *   --min-popularity <n>    Minimum popularity score (default: none)
 *   --sleep <ms>            Base sleep between HF pages (default: 1500)
 *   --tmdb-sleep <ms>       Sleep between TMDB API calls (default: 30)
 *   --out-root <dir>        Output root directory (default: "output")
 *   --hf-token <token>      HuggingFace auth token (or set HF_TOKEN env)
 *   --skip-tmdb             Skip TMDB lookup, only download HF images (for testing)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { setTimeout as sleep } from 'timers/promises';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ──────────── CLI args ────────────

function argVal(flag, def) {
  const i = process.argv.indexOf(flag);
  return i === -1 ? def : process.argv[i + 1];
}

// HuggingFace dataset
const DATASET = 'ashraq/tmdb-people-image';
const CONFIG = 'default';
const SPLIT = 'train';

// Paging + limits
const PAGE = Number(argVal('--page', '100'));
const LIMIT = Number(argVal('--limit', '10000'));
const START_OFFSET = Number(argVal('--offset', '0'));
const CONCURRENCY = Number(argVal('--concurrency', '5'));

// Filters
const FILTER_DEPT = argVal('--department', 'Acting');
const MIN_POP = argVal('--min-popularity', '');

// Throttle
const HF_SLEEP_MS = Number(argVal('--sleep', '500'));
const TMDB_SLEEP_MS = Number(argVal('--tmdb-sleep', '30'));
const SKIP_TMDB = process.argv.includes('--skip-tmdb');

// Auth
const HF_TOKEN = process.env.HF_TOKEN || argVal('--hf-token', '');
const TMDB_API_KEY = process.env.TMDB_API_KEY || argVal('--tmdb-key', '');
const TMDB_READ_TOKEN = process.env.TMDB_API_READ_ACCESS_TOKEN || '';

// Output
const OUTPUT_ROOT = path.join(__dirname, argVal('--out-root', 'output'));
const OUT_IMAGES = path.join(OUTPUT_ROOT, 'images-hq');
const OUT_NDJSON = path.join(OUTPUT_ROOT, 'tmdb-hq.ndjson');
const CHECKPOINT = path.join(OUTPUT_ROOT, '.fetch-hq-checkpoint.json');

// TMDB CDN
const TMDB_API_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/original';

// ──────────── Helpers ────────────

const ensure = (p) => fs.existsSync(p) || fs.mkdirSync(p, { recursive: true });
ensure(OUTPUT_ROOT);
ensure(OUT_IMAGES);

function jitter(ms) {
  return Math.round(ms * (0.8 + Math.random() * 0.4));
}

function hfHeaders() {
  const h = {};
  if (HF_TOKEN) h.Authorization = `Bearer ${HF_TOKEN}`;
  return h;
}

function tmdbHeaders() {
  if (TMDB_READ_TOKEN) return { Authorization: `Bearer ${TMDB_READ_TOKEN}` };
  return {};
}

// ──────────── Fetch with retry ────────────

async function fetchWithRetry(url, headers, purpose = 'request', maxRetries = 10) {
  let attempt = 0;
  while (true) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60_000);
      const res = await fetch(url, { headers, signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) return res;

      const status = res.status;
      const body = await res.text().catch(() => '');

      if (status === 404) return null;

      if (status === 429 || status >= 500) {
        if (attempt >= maxRetries) {
          console.warn(`[${purpose}] Gave up after ${maxRetries} retries (last: ${status})`);
          return null;
        }
        const backoff = Math.min(60000, 1000 * 2 ** Math.min(attempt, 10));
        const wait = jitter(backoff);
        console.warn(`[${purpose}] ${status}. Backoff ${wait}ms (try ${attempt + 1})`);
        await sleep(wait);
        attempt++;
        continue;
      }

      if (status === 401) {
        console.error(`[${purpose}] 401 Unauthorized — check your API key`);
        return null;
      }

      console.warn(`[${purpose}] ${status}: ${body.slice(0, 120)}`);
      return null;
    } catch (err) {
      if (attempt >= maxRetries) {
        console.warn(`[${purpose}] Network error after ${maxRetries} retries: ${err.message}`);
        return null;
      }
      const wait = jitter(Math.min(30000, 1000 * 2 ** Math.min(attempt, 8)));
      console.warn(`[${purpose}] Network error: ${err.message}. Retry in ${wait}ms`);
      await sleep(wait);
      attempt++;
    }
  }
}

async function safeJson(res, purpose, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await res.json();
    } catch (err) {
      if (i === maxRetries - 1) {
        console.warn(`[${purpose}] Body read failed after ${maxRetries} tries: ${err.message}`);
        return null;
      }
      console.warn(`[${purpose}] Body read error: ${err.message}. Retrying...`);
      await sleep(jitter(1000 * 2 ** i));
    }
  }
  return null;
}

async function safeArrayBuffer(res, purpose, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await res.arrayBuffer();
    } catch (err) {
      if (i === maxRetries - 1) {
        console.warn(`[${purpose}] Body read failed after ${maxRetries} tries: ${err.message}`);
        return null;
      }
      console.warn(`[${purpose}] Body read error: ${err.message}. Retrying...`);
      await sleep(jitter(1000 * 2 ** i));
    }
  }
  return null;
}

// ──────────── HuggingFace helpers ────────────

async function hfRows(offset, length) {
  const u = new URL('https://datasets-server.huggingface.co/rows');
  u.searchParams.set('dataset', DATASET);
  u.searchParams.set('config', CONFIG);
  u.searchParams.set('split', SPLIT);
  u.searchParams.set('offset', String(offset));
  u.searchParams.set('length', String(length));

  const purpose = `hf-rows@${offset}`;
  for (let bodyAttempt = 0; bodyAttempt < 3; bodyAttempt++) {
    const res = await fetchWithRetry(u.toString(), hfHeaders(), purpose);
    if (!res) return null;

    const data = await safeJson(res, purpose);
    if (data) return data;

    console.warn(`[${purpose}] Retrying full request after body-read failure (${bodyAttempt + 1}/3)`);
    await sleep(jitter(2000));
  }
  return null;
}

function passFilters(row) {
  if (FILTER_DEPT && String(row.known_for_department || '') !== FILTER_DEPT) return false;
  if (MIN_POP !== '' && Number(row.popularity ?? -Infinity) < Number(MIN_POP)) return false;
  return true;
}

// ──────────── TMDB helpers ────────────

async function tmdbFindByImdbId(imdbId) {
  if (!imdbId || SKIP_TMDB || (!TMDB_API_KEY && !TMDB_READ_TOKEN)) return null;

  const params = `external_source=imdb_id${!TMDB_READ_TOKEN && TMDB_API_KEY ? `&api_key=${TMDB_API_KEY}` : ''}`;
  const url = `${TMDB_API_BASE}/find/${imdbId}?${params}`;
  const res = await fetchWithRetry(url, tmdbHeaders(), `tmdb-find:${imdbId}`, 3);
  if (!res) return null;

  const data = await safeJson(res, `tmdb-find:${imdbId}`);
  if (!data) return null;
  const person = data.person_results?.[0];
  return person?.profile_path || null;
}

async function downloadImage(url, dest, purpose) {
  const res = await fetchWithRetry(url, {}, purpose, 3);
  if (!res) return false;

  const ab = await safeArrayBuffer(res, purpose);
  if (!ab) return false;
  const buf = new Uint8Array(ab);
  if (buf.length < 1000) {
    console.warn(`[${purpose}] Suspiciously small image (${buf.length} bytes), skipping`);
    return false;
  }
  fs.writeFileSync(dest, buf);
  return true;
}

// ──────────── Checkpoint ────────────

function loadCheckpoint() {
  try {
    return JSON.parse(fs.readFileSync(CHECKPOINT, 'utf8'));
  } catch {
    return { hfOffset: START_OFFSET, written: 0 };
  }
}

function saveCheckpoint(state) {
  fs.writeFileSync(CHECKPOINT, JSON.stringify(state));
}

// ──────────── Stats ────────────

const stats = {
  tmdbOk: 0,
  tmdbMiss: 0,
  skipped: 0,
  total: 0,
};

function printStats() {
  console.log(
    `\n📊 Stats: ${stats.total} processed | ` +
    `${stats.tmdbOk} TMDB original | ` +
    `${stats.tmdbMiss} TMDB not found | ${stats.skipped} skipped`,
  );
}

// ──────────── Main ────────────

async function main() {
  if (!TMDB_API_KEY && !TMDB_READ_TOKEN && !SKIP_TMDB) {
    console.error('❌ TMDB_API_KEY or TMDB_API_READ_ACCESS_TOKEN is required.');
    console.error('   Get a free key at: https://www.themoviedb.org/settings/api');
    console.error('   Or use --skip-tmdb to download HF images only (421x632).');
    process.exit(1);
  }

  console.log('🎬 TMDB HQ Image Fetcher');
  console.log(`   Limit: ${LIMIT} | Offset: ${START_OFFSET} | Page: ${PAGE} | Concurrency: ${CONCURRENCY}`);
  console.log(`   Department: "${FILTER_DEPT}" | Min popularity: "${MIN_POP || 'any'}"`);
  console.log(`   TMDB API: ${SKIP_TMDB ? 'SKIPPED' : 'enabled'} | HF token: ${HF_TOKEN ? 'yes' : 'no'}`);
  console.log(`   Output: ${OUT_IMAGES}`);
  console.log('');

  // Resume from checkpoint
  const cp = loadCheckpoint();
  let hfOffset = Math.max(START_OFFSET, cp.hfOffset || START_OFFSET);
  let written = cp.written || 0;

  if (written >= LIMIT) {
    console.log(`✅ Already done (${written}/${LIMIT}). Delete checkpoint to re-run.`);
    return;
  }

  // Load existing IDs to avoid duplicates on resume (IDs are like "tmdb:123")
  const existingIds = new Set();
  if (written > 0 && fs.existsSync(OUT_NDJSON)) {
    for (const line of fs.readFileSync(OUT_NDJSON, 'utf8').trim().split('\n')) {
      try { existingIds.add(JSON.parse(line).id); } catch {}
    }
  }

  const ndjsonStream = fs.createWriteStream(OUT_NDJSON, {
    flags: written > 0 ? 'a' : 'w',
  });

  // Discover total rows from HF
  const firstPage = await hfRows(0, 1);
  const totalHfRows = firstPage.num_rows_total ?? firstPage.num_rows ?? 0;
  console.log(`📦 HF dataset total rows: ${totalHfRows}`);
  console.log(`   Resuming from offset=${hfOffset}, written=${written}\n`);

  // Process pages
  let consecutivePageErrors = 0;
  while (written < LIMIT && hfOffset < totalHfRows) {
    try {
      const resp = await hfRows(hfOffset, PAGE);
      if (!resp || !resp.rows) {
        console.warn(`\n⚠️  Skipping page at offset ${hfOffset} (fetch returned null)`);
        hfOffset += PAGE;
        consecutivePageErrors++;
        if (consecutivePageErrors >= 10) {
          console.error('❌ Too many consecutive page errors, saving and exiting');
          break;
        }
        saveCheckpoint({ hfOffset, written });
        await sleep(jitter(5000));
        continue;
      }
      consecutivePageErrors = 0;
      const rows = resp.rows;

      // Filter eligible rows first, skip cached ones synchronously
      const toDownload = [];
      for (const rr of rows) {
        if (written >= LIMIT) break;
        const idx = rr.row_idx;
        const row = rr.row;
        if (!passFilters(row)) continue;

        const name = row.name || `row_${idx}`;
        const safeName = name.replace(/[^\w\-]+/g, '_');
        const filename = `${String(idx).padStart(6, '0')}_${safeName}.jpg`;
        const absPath = path.join(OUT_IMAGES, filename);

        if (fs.existsSync(absPath)) {
          if (!existingIds.has(`tmdb:${idx}`)) {
            const rec = buildRecord(idx, row, filename, 'cached');
            ndjsonStream.write(JSON.stringify(rec) + '\n');
            existingIds.add(`tmdb:${idx}`);
          }
          written++;
          stats.total++;
          if (written % 500 === 0) logProgress(written);
          continue;
        }

        toDownload.push({ idx, row, name, safeName, filename, absPath });
      }

      // Process downloads in concurrent batches
      for (let b = 0; b < toDownload.length && written < LIMIT; b += CONCURRENCY) {
        const batch = toDownload.slice(b, b + CONCURRENCY);
        const results = await Promise.allSettled(batch.map(async (item) => {
          const { idx, row, name, safeName, filename, absPath } = item;
          let downloaded = false;
          let source = 'unknown';

          if (!SKIP_TMDB && (TMDB_API_KEY || TMDB_READ_TOKEN) && row.imdb_id) {
            const profilePath = await tmdbFindByImdbId(row.imdb_id);
            if (profilePath) {
              const tmdbUrl = `${TMDB_IMAGE_BASE}${profilePath}`;
              downloaded = await downloadImage(tmdbUrl, absPath, `tmdb-img:${safeName}`);
              if (downloaded) source = 'tmdb-original';
            }
          }
          return { idx, row, name, filename, downloaded, source };
        }));

        for (const r of results) {
          if (written >= LIMIT) break;
          if (r.status === 'rejected') {
            console.warn(`\n⚠️  Batch row error: ${r.reason?.message}`);
            stats.skipped++;
            stats.total++;
            continue;
          }
          const { idx, row, filename, downloaded, source } = r.value;
          if (downloaded) {
            stats.tmdbOk++;
            if (!existingIds.has(`tmdb:${idx}`)) {
              const rec = buildRecord(idx, row, filename, source);
              ndjsonStream.write(JSON.stringify(rec) + '\n');
              existingIds.add(`tmdb:${idx}`);
            }
            written++;
          } else {
            stats.tmdbMiss++;
            stats.skipped++;
          }
          stats.total++;
        }

        if (written % 100 < CONCURRENCY) logProgress(written);
        await sleep(TMDB_SLEEP_MS);
      }
    } catch (pageErr) {
      console.warn(`\n⚠️  Page error at offset ${hfOffset}: ${pageErr.message}`);
      consecutivePageErrors++;
      if (consecutivePageErrors >= 10) {
        console.error('❌ Too many consecutive page errors, saving and exiting');
        break;
      }
      await sleep(jitter(5000));
    }

    hfOffset += PAGE;
    saveCheckpoint({ hfOffset, written });
    await sleep(jitter(HF_SLEEP_MS));
  }

  ndjsonStream.end();

  printStats();
  console.log(`\n✅ Done. ${written} images in ${OUT_IMAGES}`);
  console.log(`📝 NDJSON manifest: ${OUT_NDJSON}`);
  console.log(`💾 Checkpoint: ${CHECKPOINT} (delete to start fresh)`);
}

function buildRecord(idx, row, filename, source) {
  return {
    id: `tmdb:${idx}`,
    label: row.name || null,
    imdb_id: row.imdb_id || null,
    department: row.known_for_department || null,
    place_of_birth: row.place_of_birth || null,
    popularity: row.popularity ?? null,
    imagePath: `images/${filename}`,
    imageSource: source,
  };
}

function logProgress(written) {
  const pct = ((written / LIMIT) * 100).toFixed(1);
  process.stdout.write(
    `\r  📥 ${written}/${LIMIT} (${pct}%) | ` +
    `TMDB: ${stats.tmdbOk} | Skip: ${stats.skipped}   `,
  );
}

main().catch((e) => {
  console.error('💥 Fatal error:', e);
  process.exit(1);
});
