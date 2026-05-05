/**
 * 05-run-redis-file.js — Execute Redis VADD commands from the .redis file.
 *
 * Reads output/faces.redis line-by-line and sends each command to Redis.
 *
 * Usage:
 *   node 05-run-redis-file.js [options]
 *
 * Options:
 *   --input <path>    Input .redis file  (default: output/faces.redis)
 *   --redis <url>     Redis URL          (default: redis://localhost:6379)
 *   --flush           Delete the target vset before loading (reads key from file)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';
import { createClient } from 'redis';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function argVal(flag, def) {
  const i = process.argv.indexOf(flag);
  return i === -1 ? def : process.argv[i + 1];
}

const INPUT = argVal('--input', path.join(__dirname, 'output', 'faces.redis'));
const REDIS_URL = process.env.REDIS_URL || argVal('--redis', 'redis://localhost:6379');
const FLUSH = process.argv.includes('--flush');
const ERROR_LOG = path.join(__dirname, 'output', 'redis-errors.log');

// ──────────── Command parser (handles quoted SETATTR JSON) ────────────

function parseCommand(line) {
  const parts = [];
  let current = '';
  let inQuotes = false;
  let quoteChar = null;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if ((ch === '"' || ch === "'") && !inQuotes) {
      inQuotes = true;
      quoteChar = ch;
      continue;
    }
    if (ch === quoteChar && inQuotes) {
      inQuotes = false;
      quoteChar = null;
      continue;
    }
    if (ch === ' ' && !inQuotes) {
      if (current) {
        parts.push(current);
        current = '';
      }
    } else {
      current += ch;
    }
  }
  if (current) parts.push(current);
  return parts;
}

// ──────────── Main ────────────

async function main() {
  if (!fs.existsSync(INPUT)) {
    console.error(`❌ Input not found: ${INPUT}`);
    console.error('   Run 04-create-redis-file.js first.');
    process.exit(1);
  }

  console.log('🔴 Redis Loader');
  console.log(`   Input:  ${INPUT}`);
  console.log(`   Redis:  ${REDIS_URL}`);
  console.log(`   Flush:  ${FLUSH}\n`);

  const client = createClient({ url: REDIS_URL });
  await client.connect();
  console.log('   Connected to Redis\n');

  // Optionally flush the target vset
  if (FLUSH) {
    const rl0 = readline.createInterface({
      input: fs.createReadStream(INPUT, { encoding: 'utf8' }),
      crlfDelay: Infinity,
    });
    for await (const line of rl0) {
      const parts = line.trim().split(' ');
      if (parts[0] === 'VADD' && parts[1]) {
        const key = parts[1].replace(/'/g, '');
        try {
          await client.sendCommand(['DEL', key]);
          console.log(`   Flushed key: ${key}`);
        } catch {}
        break;
      }
    }
  }

  const rl = readline.createInterface({
    input: fs.createReadStream(INPUT, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });

  let total = 0;
  let ok = 0;
  let fail = 0;
  const t0 = Date.now();

  // Clear error log
  if (fs.existsSync(ERROR_LOG)) fs.unlinkSync(ERROR_LOG);

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    total++;

    try {
      const parts = parseCommand(trimmed);
      await client.sendCommand(parts);
      ok++;
    } catch (err) {
      fail++;
      fs.appendFileSync(ERROR_LOG, `[line ${total}] ${err.message}\n  cmd: ${trimmed.slice(0, 200)}...\n\n`);
      if (fail <= 5) console.warn(`  ❌ Line ${total}: ${err.message}`);
    }

    if (total % 500 === 0) {
      const elapsed = (Date.now() - t0) / 1000;
      const rate = ok / elapsed;
      process.stdout.write(`\r  📥 ${total} sent | ${ok} ok, ${fail} fail | ${rate.toFixed(0)} cmd/s   `);
    }
  }

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

  // Verify
  let vcard = '?';
  try {
    const firstLine = fs.readFileSync(INPUT, 'utf8').split('\n')[0];
    const vsetKey = firstLine.split(' ')[1]?.replace(/'/g, '');
    if (vsetKey) {
      const result = await client.sendCommand(['VCARD', vsetKey]);
      vcard = result;
    }
  } catch {}

  await client.quit();

  console.log(`\n\n✅ Done in ${elapsed}s`);
  console.log(`   Total:    ${total}`);
  console.log(`   Success:  ${ok}`);
  console.log(`   Failed:   ${fail}`);
  console.log(`   Rate:     ${(ok / (elapsed)).toFixed(0)} cmd/s`);
  console.log(`   VCARD:    ${vcard} elements in vset`);

  if (fail > 0) {
    console.log(`\n   ⚠️  Errors logged to: ${ERROR_LOG}`);
  }
}

main().catch((e) => {
  console.error('💥 Fatal error:', e);
  process.exit(1);
});
