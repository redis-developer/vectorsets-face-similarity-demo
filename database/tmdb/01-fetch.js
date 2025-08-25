import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { setTimeout as sleep } from "timers/promises";
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------- CLI args ----------
function argVal(flag, def) {
    const i = process.argv.indexOf(flag);
    return i === -1 ? def : process.argv[i + 1];
}
function argHas(flag) {
    return process.argv.includes(flag);
}

// Dataset config
const DATASET = "ashraq/tmdb-people-image";
const CONFIG = "default";
const SPLIT = "train";

// Paging + limits
const PAGE = Number(argVal("--page", "50"));            // 100 is max; lower reduces rate-limit risk
const LIMIT = Number(argVal("--limit", "10000"));        // total rows you want
const START_OFFSET = Number(argVal("--offset", "0"));   // where to start

// Filters
const FILTER_DEPT = argVal("--department", "Acting");   // e.g. Acting
const MIN_POP = argVal("--min-popularity", "");      // e.g. 100, 200

// Throttle / backoff
const BASE_SLEEP_MS = Number(argVal("--sleep", "1500")); // base sleep after each page
const MAX_RETRIES = Number(argVal("--retries", "12"));   // exponential backoff tries
const HF_TOKEN = process.env.HF_TOKEN || argVal("--hf-token", ""); // optional token

// Output
const OUTPUT_DIR = argVal("--out-root", "output");
const OUT_DIR = path.join(__dirname, OUTPUT_DIR, argVal("--out-dir", "tmdb_images"));
const OUT_NDJSON = path.join(__dirname, OUTPUT_DIR, argVal("--out-file", "tmdb.ndjson"));
const CHECKPOINT = path.join(__dirname, OUTPUT_DIR, ".tmdb_checkpoint.json");

// Helpers
const ensure = (p) => fs.existsSync(p) || fs.mkdirSync(p, { recursive: true });
ensure(path.dirname(OUT_NDJSON));
ensure(OUT_DIR);

function headers() {
    const h = {};
    if (HF_TOKEN) h.Authorization = `Bearer ${HF_TOKEN}`;
    return h;
}

function jitter(ms) {
    // add +/- 20% jitter
    const d = ms * (0.8 + Math.random() * 0.4);
    return Math.round(d);
}

async function fetchJSON(u, purpose = "request", attempt = 0) {
    while (true) {
        const res = await fetch(u, { headers: headers() });
        if (res.ok) return res.json();

        const status = res.status;
        const body = await res.text().catch(() => "");
        if (status === 429 || status >= 500) {
            // exponential backoff with max cap + extra cooldown every few hits
            const backoff = Math.min(60000, BASE_SLEEP_MS * 2 ** Math.min(attempt, 10)); // cap 60s
            const extra = attempt > 6 ? 60000 : 0; // 1-min cooldown after many retries
            const wait = jitter(backoff + extra);
            console.warn(`[${purpose}] ${status}. Backoff ${wait}ms (try ${attempt + 1})`);
            await sleep(wait);
            attempt++;
            continue;
        }
        throw new Error(`[${purpose}] ${status} ${body.slice(0, 200)}`);
    }
}

async function fetchArrayBuffer(u, purpose = "download", attempt = 0) {
    while (true) {
        const res = await fetch(u, { headers: headers() });
        if (res.ok) return new Uint8Array(await res.arrayBuffer());

        const status = res.status;
        const body = await res.text().catch(() => "");
        if (status === 429 || status >= 500) {
            const backoff = Math.min(60000, BASE_SLEEP_MS * 2 ** Math.min(attempt, 10));
            const extra = attempt > 6 ? 60000 : 0;
            const wait = jitter(backoff + extra);
            console.warn(`[${purpose}] ${status}. Backoff ${wait}ms (try ${attempt + 1})`);
            await sleep(wait);
            attempt++;
            continue;
        }
        throw new Error(`[${purpose}] ${status} ${body.slice(0, 200)}`);
    }
}

async function rows(offset, length) {
    const u = new URL("https://datasets-server.huggingface.co/rows");
    u.searchParams.set("dataset", DATASET);
    u.searchParams.set("config", CONFIG);
    u.searchParams.set("split", SPLIT);
    u.searchParams.set("offset", String(offset));
    u.searchParams.set("length", String(length));
    return fetchJSON(u, `rows@${offset}`);
}

async function download(src, dest) {
    const buf = await fetchArrayBuffer(src, `img@${path.basename(dest)}`);
    fs.writeFileSync(dest, buf);
}

function passFilters(row) {
    if (FILTER_DEPT && String(row.known_for_department || "") !== FILTER_DEPT) return false;
    if (MIN_POP !== "" && Number(row.popularity ?? -Infinity) < Number(MIN_POP)) return false;
    return true;
}

function loadCheckpoint() {
    try {
        return JSON.parse(fs.readFileSync(CHECKPOINT, "utf8"));
    } catch {
        return { offset: START_OFFSET, written: 0 };
    }
}

function saveCheckpoint(state) {
    fs.writeFileSync(CHECKPOINT, JSON.stringify(state));
}

async function main() {
    const out = fs.createWriteStream(OUT_NDJSON, { flags: fs.existsSync(OUT_NDJSON) ? "a" : "w" });

    // discover total
    const first = await rows(0, PAGE);
    const total = first.num_rows_total ?? first.num_rows ?? 0;
    console.log(`TMDB total rows: ${total}`);
    console.log(
        `Start offset=${START_OFFSET}, limit=${LIMIT}, page=${PAGE}, sleep≈${BASE_SLEEP_MS}ms, dept="${FILTER_DEPT}", minPopularity="${MIN_POP}", token=${HF_TOKEN ? "yes" : "no"}`
    );

    // resume support
    const state = loadCheckpoint();
    let offset = Math.max(START_OFFSET, state.offset || START_OFFSET);
    let written = state.written || 0;
    if (written >= LIMIT) {
        console.log(`Nothing to do (already wrote ${written}/${LIMIT}).`);
        out.end();
        return;
    }

    // Prime page if resuming from 0 and we haven't processed it yet
    if (offset === 0) {
        await handlePage(first, out, written);
        offset = PAGE;
        written = progress.written;
        saveCheckpoint({ offset, written });
        await sleep(jitter(BASE_SLEEP_MS));
    }

    for (; written < LIMIT && offset < total; offset += PAGE) {
        const resp = await rows(offset, PAGE);
        await handlePage(resp, out, written);
        written = progress.written;

        // checkpoint + polite sleep
        saveCheckpoint({ offset: offset + PAGE, written });
        if (offset % 1000 === 0) console.log(`Fetched offset ${offset}/${total}…`);
        await sleep(jitter(BASE_SLEEP_MS));
    }

    out.end();
    console.log(`✅ Done. Downloaded ${written}/${LIMIT} rows`);
    console.log(`📁 Images -> ${OUT_DIR}\n🧾 NDJSON -> ${OUT_NDJSON}`);
    console.log(`↪️ You can resume safely; checkpoint at ${CHECKPOINT}`);
}

// progress tracker shared with handlePage
const progress = { written: 0 };

async function handlePage(resp, out, alreadyWritten) {
    progress.written = alreadyWritten;
    for (const rr of resp.rows) {
        if (progress.written >= LIMIT) break;

        const idx = rr.row_idx;
        const row = rr.row;
        const img = row.image;
        if (!img?.src) continue;
        if (!passFilters(row)) continue;

        const safe = String(row.name ?? `row_${idx}`).replace(/[^\w\-]+/g, "_");
        const ext = path.extname(new URL(img.src).pathname) || ".jpg";
        const file = `${String(idx).padStart(6, "0")}_${safe}${ext}`;
        const abs = path.join(OUT_DIR, file);

        try {
            if (!fs.existsSync(abs)) {
                await download(img.src, abs);
            }
        } catch (e) {
            console.warn(`skip ${idx}: ${e.message}`);
            continue;
        }

        const rec = {
            id: `tmdb:${idx}`,
            name: row.name || null,
            imdb_id: row.imdb_id || null,
            department: row.known_for_department || null,
            place_of_birth: row.place_of_birth || null,
            popularity: row.popularity ?? null,
            imagePath: path.join(path.basename(OUT_DIR), file),
        };
        out.write(JSON.stringify(rec) + "\n");
        progress.written++;
        if (progress.written % 500 === 0) process.stdout.write(`Downloaded ${progress.written}…\n`);
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});