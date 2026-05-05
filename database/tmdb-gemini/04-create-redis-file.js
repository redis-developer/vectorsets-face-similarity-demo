/**
 * 04-create-redis-file.js — Convert embedded NDJSON → Redis VADD commands.
 *
 * Reads output/tmdb.embedded.ndjson (from 03-embed-gemini.js) and writes
 * output/faces.redis with one VADD command per line for the unified vset:faces key.
 *
 * Usage:
 *   node 04-create-redis-file.js [options]
 *
 * Options:
 *   --input <path>    Input NDJSON   (default: output/tmdb.embedded.ndjson)
 *   --output <path>   Output .redis  (default: output/faces.redis)
 *   --vset <name>     VectorSet key  (default: vset:faces)
 *   --dims <n>        Dimensions     (default: 3072)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function argVal(flag, def) {
  const i = process.argv.indexOf(flag);
  return i === -1 ? def : process.argv[i + 1];
}

const OUTPUT_ROOT = path.join(__dirname, 'output');
const INPUT = argVal('--input', path.join(OUTPUT_ROOT, 'tmdb.embedded.ndjson'));
const OUTPUT = argVal('--output', path.join(OUTPUT_ROOT, 'faces.redis'));
const VSET = argVal('--vset', 'vset:faces');
const DIM = Number(argVal('--dims', '3072'));

// ──────────── Redis command formatter ────────────

function formatRedisCommand(args) {
  let command = '';
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (i > 0) command += ' ';
    if (i > 0 && args[i - 1] === 'SETATTR') {
      command += `'${arg}'`;
    } else {
      command += arg;
    }
  }
  return command + '\n';
}

// ──────────── Country extraction (carried from original pipeline) ────────────

function cleanCountryName(country) {
  if (!country) return null;
  const nonEnglishChars = country.match(/[^\x00-\x7F]/g);
  if (nonEnglishChars && nonEnglishChars.length / country.length > 0.5) return null;
  return country.replace(/\./g, '').replace(/\s+/g, '_').trim().toUpperCase();
}

function mapCountryToStandard(country) {
  if (!country) return null;
  const map = {
    UNITED_STATES: 'UNITED_STATES', UNITED_STATES_OF_AMERICA: 'UNITED_STATES',
    US: 'UNITED_STATES', USA: 'UNITED_STATES', AMERICA: 'UNITED_STATES',
    EEUU: 'UNITED_STATES', STATI_UNITI: 'UNITED_STATES',
    CA: 'UNITED_STATES', DC: 'UNITED_STATES', IL: 'UNITED_STATES',
    NM: 'UNITED_STATES', NY: 'UNITED_STATES', OH: 'UNITED_STATES',
    TX: 'UNITED_STATES', WA: 'UNITED_STATES',
    CALIFORNIA_USA: 'UNITED_STATES', MICHIGAN_UNITED_STATES: 'UNITED_STATES',
    NEW_YORK_USA: 'UNITED_STATES', OREGON_USA: 'UNITED_STATES',
    VIRGINIA_US: 'UNITED_STATES', GEORGIA_USA: 'UNITED_STATES',
    COLORADO: 'UNITED_STATES', IDAHO: 'UNITED_STATES', ILLINOIS: 'UNITED_STATES',
    MAINE: 'UNITED_STATES', NORTH_CAROLINA: 'UNITED_STATES',
    OKLAHOMA: 'UNITED_STATES', PENNSYLVANIA: 'UNITED_STATES',
    TENNESSEE: 'UNITED_STATES', TEXAS: 'UNITED_STATES',
    VERMONT: 'UNITED_STATES', VIRGINIA: 'UNITED_STATES',
    NEW_YORK_CITY: 'UNITED_STATES', NEW_JERSEY: 'UNITED_STATES',
    ALBERTA: 'CANADA', ONTARIO: 'CANADA', BRITISH_COLUMBIA: 'CANADA',
    WESTERN_AUSTRALIA: 'AUSTRALIA',
    UNITED_KINGDOM: 'UNITED_KINGDOM', UK: 'UNITED_KINGDOM',
    GREAT_BRITAIN: 'UNITED_KINGDOM', ENGLAND: 'UNITED_KINGDOM',
    ENGLAND_UK: 'UNITED_KINGDOM', SCOTLAND: 'UNITED_KINGDOM',
    WALES: 'UNITED_KINGDOM', NORTHERN_IRELAND: 'UNITED_KINGDOM',
    REGNO_UNITO: 'UNITED_KINGDOM', BRITISH_CROWN_COLONY: 'UNITED_KINGDOM',
    LONDON: 'UNITED_KINGDOM', LONDRA: 'UNITED_KINGDOM',
    CAMBRIDGESHIRE: 'UNITED_KINGDOM', SOUTH_YORKSHIRE: 'UNITED_KINGDOM',
    USSR: 'SOVIET_UNION', SOVIET_UNION: 'SOVIET_UNION',
    RUSSIAN_EMPIRE_NOW_RUSSIA: 'RUSSIA', USSR_NOW_RUSSIA: 'RUSSIA',
    USSR_RUSSIA: 'RUSSIA', 'USSR_(NOW_RUSSIA)': 'RUSSIA', 'USSR_(RUSSIA)': 'RUSSIA',
    'USSR_[NOW_RUSSIA]': 'RUSSIA', MOSCOW: 'RUSSIA',
    USSR_NOW_UKRAINE: 'UKRAINE', 'USSR_[NOW_UKRAINE]': 'UKRAINE',
    USSR_NOW_ARMENIA: 'ARMENIA', 'USSR_[NOW_ARMENIA]': 'ARMENIA',
    USSR_NOW_ESTONIA: 'ESTONIA', 'USSR_[NOW_ESTONIA]': 'ESTONIA',
    USSR_NOW_LITHUANIA: 'LITHUANIA', 'USSR_[NOW_LITHUANIA]': 'LITHUANIA',
    USSR_NOW_UZBEKISTAN: 'UZBEKISTAN', 'USSR_[NOW_UZBEKISTAN]': 'UZBEKISTAN',
    USSR_KAZAKHSTAN: 'KAZAKHSTAN', 'USSR_(KAZAKHSTAN)': 'KAZAKHSTAN',
    YUGOSLAVIA: 'YUGOSLAVIA', KINGDOM_OF_YUGOSLAVIA: 'YUGOSLAVIA',
    SFR_YUGOSLAVIA: 'YUGOSLAVIA', 'SFR_YUGOSLAVIA_(NOW_CROATIA)': 'CROATIA',
    YUGOSLAVIA_NOW_SERBIA: 'SERBIA', YUGOSLAVIA_NOW_CROATIA: 'CROATIA',
    'YUGOSLAVIA_(NOW_SERBIA)': 'SERBIA', 'YUGOSLAVIA_[NOW_SERBIA]': 'SERBIA',
    CZECHOSLOVAKIA: 'CZECHOSLOVAKIA', CZECHOSLOVAKIA_NOW_SLOVAKIA: 'SLOVAKIA',
    'CZECHOSLOVAKIA_(NOW_SLOVAKIA)': 'SLOVAKIA',
    'CZECHOSLOVAKIA_(PRESENT-DAY_CZECH_REPUBLIC)': 'CZECH_REPUBLIC',
    'CZECHOSLOVAKIA_[NOW_SLOVAKIA]': 'SLOVAKIA',
    PEOPLES_REPUBLIC_OF_CHINA: 'CHINA', HEILONGJIANG_PROVINCE: 'CHINA',
    'BRITISH_CROWN_COLONY_[NOW_CHINA]': 'CHINA', CHI: 'CHINA',
    REPUBLIC_OF_IRELAND: 'IRELAND', 'DUNGARVEN-WATERFORD-IRELAND': 'IRELAND',
    REPUBLIC_OF_GEORGIA: 'GEORGIA',
    SOUTH_AFRICAN_REPUBLIC: 'SOUTH_AFRICA', AFRIQUE_DU_SUD: 'SOUTH_AFRICA',
    FRANCIA: 'FRANCE', GERMANIA: 'GERMANY', FRANKREICH: 'GERMANY',
    ITALIA: 'ITALY', CATANIA: 'ITALY', 'MILANO_(ITALY)': 'ITALY', ROMA: 'ITALY', SICILY: 'ITALY',
    GIAPPONE: 'JAPAN', TOKYO: 'JAPAN', SHIGA: 'JAPAN',
    MESSICO: 'MEXICO', MÉXICO: 'MEXICO',
    HONGKONG: 'HONG_KONG', BRITISH_HONG_KONG: 'HONG_KONG',
    COREA_DEL_SUD: 'SOUTH_KOREA', DANIMARCA: 'DENMARK', DANMARK: 'DENMARK',
    NORGE: 'NORWAY', POLSKA: 'POLAND', PERÚ: 'PERU',
    REPÚBLICA_DOMINICANA: 'DOMINICAN_REPUBLIC', TÜRKIYE: 'TURKEY', İSTANBUL: 'TURKEY',
    BRASILE: 'BRAZIL', THAILANDIA: 'THAILAND', BIELORUSSIA: 'BELARUS',
    BELGIE: 'BELGIUM', ISLAND: 'ICELAND', ZÜRICH: 'SWITZERLAND',
    KASACHSTAN: 'KAZAKHSTAN', 'KAZAKHSTAN)': 'KAZAKHSTAN',
    LUXEMBURG: 'LUXEMBOURG', RHODESIA: 'ZIMBABWE', SWAZILAND: 'ESWATINI',
    TAMILNADU: 'INDIA', BRITISH_INDIA: 'INDIA', MÜNCHE: 'GERMANY',
    ALGÉRIE: 'ALGERIA', FRANCE_NOW_ALGERIA: 'ALGERIA', 'FRANCE_[NOW_ALGERIA]': 'ALGERIA',
    'PALESTINE_(NOW_ISRAEL)': 'ISRAEL', PALESTINE_MANDATE: 'ISRAEL',
    VIETNAM_NOW_HO_CHI_MINH_CITY: 'VIETNAM', 'VIETNAM_[NOW_HO_CHI_MINH_CITY]': 'VIETNAM',
    BRITISH_GUIANA: 'GUYANA', BRITISH_WEST_INDIES: 'JAMAICA',
    CÔTE_DIVOIRE: 'IVORY_COAST', DOMINION_OF_NEW_ZEALAND: 'NEW_ZEALAND',
    EAST_AFRICA: 'KENYA', JAMAICA_WI: 'JAMAICA',
  };
  return map[country] || country;
}

function getCountry(placeOfBirth) {
  if (!placeOfBirth?.trim()) return null;
  let cleaned = placeOfBirth.trim().replace(/\.$/, '').trim();

  let lastPart;
  if (cleaned.includes(' - ')) {
    lastPart = cleaned.split(' - ').pop().trim();
  } else if (/[,，]/.test(cleaned)) {
    lastPart = cleaned.split(/[,，]/).pop().trim();
  } else {
    lastPart = cleaned;
  }
  return mapCountryToStandard(cleanCountryName(lastPart));
}

function fixString(str) {
  return (str || '').replace(/'/g, '').replace(/\\"/g, '');
}

// ──────────── Main ────────────

async function main() {
  if (!fs.existsSync(INPUT)) {
    console.error(`❌ Input not found: ${INPUT}`);
    console.error('   Run 03-embed-gemini.js first.');
    process.exit(1);
  }

  console.log(`📝 Creating Redis commands`);
  console.log(`   Input:  ${INPUT}`);
  console.log(`   Output: ${OUTPUT}`);
  console.log(`   VSet:   ${VSET} | Dims: ${DIM}\n`);

  const out = fs.createWriteStream(OUTPUT);
  const rl = readline.createInterface({
    input: fs.createReadStream(INPUT, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });

  let count = 0;
  let skipped = 0;
  const uniqueCountries = new Set();
  const seenIds = new Set();

  for await (const line of rl) {
    const t = line.trim();
    if (!t) continue;

    let rec;
    try {
      rec = JSON.parse(t);
    } catch {
      skipped++;
      continue;
    }

    if (seenIds.has(rec.id)) {
      skipped++;
      continue;
    }
    seenIds.add(rec.id);

    const emb = rec.embedding;
    if (!Array.isArray(emb) || emb.length !== DIM) {
      console.warn(`  ⚠️  Skipping ${rec.label || rec.id}: embedding is ${emb?.length || 'missing'}-d, expected ${DIM}`);
      skipped++;
      continue;
    }

    const fixedLabel = fixString(rec.label);

    const id = 'e' + rec.id;

    const floats = emb.map((x) => (Number.isFinite(x) ? String(x) : '0'));

    const fixedPlaceOfBirth = fixString(rec.place_of_birth);
    const country = getCountry(fixedPlaceOfBirth);
    uniqueCountries.add(country);

    const attrs = {
      label: fixedLabel,
      imagePath: rec.imagePath ?? '',
      charCount: fixedLabel.length,
      imdbId: rec.imdb_id || null,
      department: fixString(rec.department) || null,
      placeOfBirth: fixedPlaceOfBirth || null,
      popularity: parseFloat(rec.popularity) ?? null,
      country: country || null,
    };

    const args = ['VADD', VSET, 'VALUES', String(DIM), ...floats, id, 'SETATTR', JSON.stringify(attrs)];
    out.write(formatRedisCommand(args));
    count++;

    if (count % 1000 === 0) {
      process.stdout.write(`\r  Encoded ${count} commands…`);
    }
  }

  out.end();

  console.log(`\r✅ Encoded ${count} commands. Skipped ${skipped}.`);
  console.log(`   Redis file: ${OUTPUT}`);

  // Write countries
  const sortedCountries = Array.from(uniqueCountries).filter(Boolean).sort();
  const countriesPath = path.join(OUTPUT_ROOT, 'countries.json');
  fs.writeFileSync(countriesPath, JSON.stringify(sortedCountries, null, 2));
  console.log(`   Countries:  ${countriesPath} (${sortedCountries.length} unique)`);
}

main().catch((e) => {
  console.error('💥', e);
  process.exit(1);
});
