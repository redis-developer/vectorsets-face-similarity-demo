/**
 * 06-export-from-dump.js — Stream vset:faces from local Redis (dump.rdb) to a target Redis.
 *
 * Reads vectors via VRANGE + VEMB + VGETATTR from a source (default: local docker Redis)
 * and sends VADD commands to the target (default: REDIS_URL from repo .env).
 *
 * Usage:
 *   docker compose up -d redis   # source must be running with dump.rdb
 *   node 06-export-from-dump.js [options]
 *
 * Options:
 *   --source <url>   Source Redis URL     (default: redis://localhost:6379)
 *   --target <url>   Target Redis URL     (default: REDIS_URL env / repo .env)
 *   --vset <name>    VectorSet key        (default: vset:faces)
 *   --batch <n>      VRANGE page size     (default: 50)
 *   --limit <n>      Max elements to copy (default: unlimited)
 *   --flush          DEL target vset before loading
 *   --dry-run        Count elements only, no writes
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createClient } from 'redis';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

function argVal(flag, def) {
  const i = process.argv.indexOf(flag);
  return i === -1 ? def : process.argv[i + 1];
}

const SOURCE_URL = argVal('--source', 'redis://localhost:6379');
const TARGET_URL =
  process.env.REDIS_URL || argVal('--target', 'redis://localhost:6379');
const VSET = argVal('--vset', 'vset:faces');
const BATCH = Number(argVal('--batch', '50'));
const LIMIT = process.argv.includes('--limit')
  ? Number(argVal('--limit', '0'))
  : null;
const FLUSH = process.argv.includes('--flush');
const DRY_RUN = process.argv.includes('--dry-run');
const ERROR_LOG = path.join(__dirname, 'output', 'stream-errors.log');

function maskUrl(url) {
  return url.replace(/:([^:@/]+)@/, ':***@');
}

async function iterateElements(source, vsetKey, batchSize) {
  const all = [];
  let start = '-';

  while (true) {
    const page = await source.sendCommand([
      'VRANGE',
      vsetKey,
      start,
      '+',
      String(batchSize),
    ]);
    if (!Array.isArray(page) || page.length === 0) break;

    for (const id of page) {
      all.push(String(id));
      if (LIMIT !== null && all.length >= LIMIT) return all;
    }

    if (page.length < batchSize) break;
    start = `(${page[page.length - 1]}`;
  }

  return all;
}

async function copyElement(source, target, vsetKey, elementId) {
  const [embedding, attrsRaw] = await Promise.all([
    source.sendCommand(['VEMB', vsetKey, elementId]),
    source.sendCommand(['VGETATTR', vsetKey, elementId]),
  ]);

  if (!Array.isArray(embedding) || embedding.length === 0) {
    throw new Error(`missing embedding for ${elementId}`);
  }

  const attrs =
    typeof attrsRaw === 'string' && attrsRaw.length > 0 ? attrsRaw : '{}';

  await target.sendCommand([
    'VADD',
    vsetKey,
    'VALUES',
    String(embedding.length),
    ...embedding.map(String),
    elementId,
    'SETATTR',
    attrs,
  ]);
}

async function main() {
  console.log('Stream vset:faces from local dump to target Redis');
  console.log(`   Source:  ${SOURCE_URL}`);
  console.log(`   Target:  ${maskUrl(TARGET_URL)}`);
  console.log(`   VSet:    ${VSET}`);
  console.log(`   Batch:   ${BATCH}`);
  console.log(`   Flush:   ${FLUSH}`);
  console.log(`   Dry run: ${DRY_RUN}`);
  if (LIMIT !== null) console.log(`   Limit:   ${LIMIT}`);
  console.log('');

  const source = createClient({ url: SOURCE_URL });
  await source.connect();
  console.log('   Connected to source');

  if (!DRY_RUN) {
    const target = createClient({ url: TARGET_URL });
    await target.connect();
    console.log('   Connected to target');
    await runCopy(source, target);
    return;
  }

  const vcard = await source.sendCommand(['VCARD', VSET]);
  console.log(`   Source VCARD: ${vcard}`);
  const elementIds = await iterateElements(source, VSET, BATCH);
  console.log(`   Found ${elementIds.length} elements to copy`);
  await source.quit();
}

async function runCopy(source, target) {
  const vcard = await source.sendCommand(['VCARD', VSET]);
  console.log(`   Source VCARD: ${vcard}\n`);

  if (FLUSH) {
    await target.sendCommand(['DEL', VSET]);
    console.log(`   Flushed target key: ${VSET}\n`);
  }

  console.log('   Scanning element IDs…');
  const elementIds = await iterateElements(source, VSET, BATCH);
  console.log(`   Found ${elementIds.length} elements to copy\n`);

  fs.mkdirSync(path.dirname(ERROR_LOG), { recursive: true });
  if (fs.existsSync(ERROR_LOG)) fs.unlinkSync(ERROR_LOG);

  let ok = 0;
  let fail = 0;
  const t0 = Date.now();

  for (let i = 0; i < elementIds.length; i++) {
    const id = elementIds[i];
    try {
      await copyElement(source, target, VSET, id);
      ok++;
    } catch (err) {
      fail++;
      const message = err instanceof Error ? err.message : String(err);
      fs.appendFileSync(ERROR_LOG, `[${i + 1}] ${id}: ${message}\n`);
      if (fail <= 5) console.warn(`  FAIL ${id}: ${message}`);
    }

    if ((i + 1) % 100 === 0 || i + 1 === elementIds.length) {
      const elapsed = (Date.now() - t0) / 1000;
      const rate = ok / Math.max(elapsed, 0.001);
      process.stdout.write(
        `\r  ${i + 1}/${elementIds.length} | ${ok} ok, ${fail} fail | ${rate.toFixed(1)}/s   `,
      );
    }
  }

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  let targetVcard = '?';
  try {
    targetVcard = await target.sendCommand(['VCARD', VSET]);
  } catch {}

  await source.quit();
  await target.quit();

  console.log(`\n\nDone in ${elapsed}s`);
  console.log(`   Copied:       ${ok}`);
  console.log(`   Failed:       ${fail}`);
  console.log(`   Target VCARD: ${targetVcard}`);

  if (fail > 0) {
    console.log(`\n   Errors logged to: ${ERROR_LOG}`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
