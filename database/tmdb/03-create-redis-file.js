// Convert NDJSON -> Redis commands for Redis Vector Sets

// Notes:
// - Expects each NDJSON line to be: { id, embeddings:number[], label, imagePath }
// - Writes Redis commands: VADD <vset> VALUES <dim> <f1> ... <fN> <id> SETATTR <json>

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import readline from "readline";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_DIR = "output";

const INPUT = path.join(__dirname, OUTPUT_DIR, "tmdb.embedded.ndjson");
const OUTPUT = path.join(__dirname, OUTPUT_DIR, "tmdb.redis");
const VSET = "vset:tmdb";
const DIM = 768;
const ADD_NOQUANT = false;


// -------- Redis command formatter ----------
function formatRedisCommand(args) {
    // Build the command string, handling JSON attributes specially
    let command = '';
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (i > 0) command += ' ';

        // If this is the JSON attribute string (after SETATTR), use single quotes to avoid conflicts
        if (i > 0 && args[i - 1] === 'SETATTR') {
            command += `'${arg}'`;
        } else {
            command += arg;
        }
    }
    return command + '\n';
}

// -------- Country extraction function ----------
function cleanCountryName(country) {
    if (!country) return null;

    // Check if the country name contains primarily non-English characters
    const nonEnglishChars = country.match(/[^\x00-\x7F]/g);
    if (nonEnglishChars && nonEnglishChars.length > 0) {
        // If more than 50% of characters are non-English, skip this country
        const nonEnglishRatio = nonEnglishChars.length / country.length;
        if (nonEnglishRatio > 0.5) {
            return null;
        }
    }

    // Remove dots, extra spaces, and capitalize
    return country
        .replace(/\./g, '') // Remove all dots
        .replace(/\s+/g, '_') // Replace multiple spaces with _
        .trim()
        .toUpperCase();
}

function mapCountryToStandard(country) {
    if (!country) return null;

    // Country name mapping to standardize variations
    const countryMap = {
        // United States variations
        'UNITED_STATES': 'UNITED_STATES',
        'UNITED_STATES_OF_AMERICA': 'UNITED_STATES',
        'US': 'UNITED_STATES',
        'USA': 'UNITED_STATES',
        'AMERICA': 'UNITED_STATES',
        'EEUU': 'UNITED_STATES',
        'STATI_UNITI': 'UNITED_STATES',
        // State abbreviations and state names
        'CA': 'UNITED_STATES',
        'DC': 'UNITED_STATES',
        'IL': 'UNITED_STATES',
        'NM': 'UNITED_STATES',
        'NY': 'UNITED_STATES',
        'OH': 'UNITED_STATES',
        'TX': 'UNITED_STATES',
        'WA': 'UNITED_STATES',
        'CALIFORNIA_USA': 'UNITED_STATES',
        'MICHIGAN_UNITED_STATES': 'UNITED_STATES',
        'NEW_YORK_USA': 'UNITED_STATES',
        'OREGON_USA': 'UNITED_STATES',
        'VIRGINIA_US': 'UNITED_STATES',
        'GEORGIA_USA': 'UNITED_STATES',
        'COLORADO': 'UNITED_STATES',
        'IDAHO': 'UNITED_STATES',
        'ILLINOIS': 'UNITED_STATES',
        'MAINE': 'UNITED_STATES',
        'NORTH_CAROLINA': 'UNITED_STATES',
        'OKLAHOMA': 'UNITED_STATES',
        'PENNSYLVANIA': 'UNITED_STATES',
        'TENNESSEE': 'UNITED_STATES',
        'TEXAS': 'UNITED_STATES',
        'VERMONT': 'UNITED_STATES',
        'VIRGINIA': 'UNITED_STATES',
        'NEW_YORK_CITY': 'UNITED_STATES',
        'NEW_JERSEY': 'UNITED_STATES',
        'ALBERTA': 'CANADA',
        'ONTARIO': 'CANADA',
        'WESTERN_AUSTRALIA': 'AUSTRALIA',

        // United Kingdom variations
        'UNITED_KINGDOM': 'UNITED_KINGDOM',
        'UK': 'UNITED_KINGDOM',
        'GREAT_BRITAIN': 'UNITED_KINGDOM',
        'ENGLAND': 'UNITED_KINGDOM',
        'ENGLAND_UK': 'UNITED_KINGDOM',
        'SCOTLAND': 'UNITED_KINGDOM',
        'WALES': 'UNITED_KINGDOM',
        'NORTHERN_IRELAND': 'UNITED_KINGDOM',
        'REGNO_UNITO': 'UNITED_KINGDOM',
        'BRITISH_CROWN_COLONY': 'UNITED_KINGDOM',
        'BRITISH_COLUMBIA': 'CANADA',
        'LONDON': 'UNITED_KINGDOM',
        'LONDRA': 'UNITED_KINGDOM',
        'CAMBRIDGESHIRE': 'UNITED_KINGDOM',
        'SOUTH_YORKSHIRE': 'UNITED_KINGDOM',
        'DUNGARVEN-WATERFORD-IRELAND': 'IRELAND',

        // Soviet Union variations
        'USSR': 'SOVIET_UNION',
        'SOVIET_UNION': 'SOVIET_UNION',
        'RUSSIAN_EMPIRE_NOW_RUSSIA': 'RUSSIA',
        'USSR_NOW_RUSSIA': 'RUSSIA',
        'USSR_RUSSIA': 'RUSSIA',
        'USSR_NOW_UKRAINE': 'UKRAINE',
        'USSR_NOW_ARMENIA': 'ARMENIA',
        'USSR_NOW_ESTONIA': 'ESTONIA',
        'USSR_NOW_LITHUANIA': 'LITHUANIA',
        'USSR_NOW_UZBEKISTAN': 'UZBEKISTAN',
        'USSR_KAZAKHSTAN': 'KAZAKHSTAN',
        'USSR_(KAZAKHSTAN)': 'KAZAKHSTAN',
        'USSR_(NOW_RUSSIA)': 'RUSSIA',
        'USSR_(RUSSIA)': 'RUSSIA',
        'USSR_[NOW_ARMENIA]': 'ARMENIA',
        'USSR_[NOW_ESTONIA]': 'ESTONIA',
        'USSR_[NOW_LITHUANIA]': 'LITHUANIA',
        'USSR_[NOW_RUSSIA]': 'RUSSIA',
        'USSR_[NOW_UKRAINE]': 'UKRAINE',
        'USSR_[NOW_UZBEKISTAN]': 'UZBEKISTAN',

        // Yugoslavia variations
        'YUGOSLAVIA': 'YUGOSLAVIA',
        'KINGDOM_OF_YUGOSLAVIA': 'YUGOSLAVIA',
        'SFR_YUGOSLAVIA': 'YUGOSLAVIA',
        'SFR_YUGOSLAVIA_(NOW_CROATIA)': 'CROATIA',
        'YUGOSLAVIA_NOW_SERBIA': 'SERBIA',
        'YUGOSLAVIA_NOW_CROATIA': 'CROATIA',
        'YUGOSLAVIA_(NOW_SERBIA)': 'SERBIA',
        'YUGOSLAVIA_[NOW_SERBIA]': 'SERBIA',

        // Czechoslovakia variations
        'CZECHOSLOVAKIA': 'CZECHOSLOVAKIA',
        'CZECHOSLOVAKIA_NOW_SLOVAKIA': 'SLOVAKIA',
        'CZECHOSLOVAKIA_(NOW_SLOVAKIA)': 'SLOVAKIA',
        'CZECHOSLOVAKIA_(PRESENT-DAY_CZECH_REPUBLIC)': 'CZECH_REPUBLIC',
        'CZECHOSLOVAKIA_[NOW_SLOVAKIA]': 'SLOVAKIA',
        'CZECH_REPUBLIC]': 'CZECH_REPUBLIC',
        'ČESKOSLOVENSKO': 'CZECHOSLOVAKIA',

        // Austria-Hungary variations
        'AUSTRIA-HUNGARY': 'AUSTRIA-HUNGARY',
        'AUSTRIA-HUNGARY_(NOW_SLOVAKIA)': 'SLOVAKIA',

        // Other common variations
        'FRANCE_NOW_ALGERIA': 'ALGERIA',
        'FRANCE_[NOW_ALGERIA]': 'ALGERIA',
        'PALESTINE_(NOW_ISRAEL)': 'ISRAEL',
        'PALESTINE_MANDATE': 'ISRAEL',
        'KOREAN_EMPIRE_NOW_DEMOCRATIC_PEOPLES_REPUBLIC_OF_KOREA': 'NORTH_KOREA',
        'KINGDOM_OF_BULGARIA_[NOW_BULGARIA]': 'BULGARIA',
        'PEOPLES_REPUBLIC_OF_CHINA': 'CHINA',
        'REPUBLIC_OF_GEORGIA': 'GEORGIA',
        'REPUBLIC_OF_IRELAND': 'IRELAND',
        'SOUTH_AFRICAN_REPUBLIC': 'SOUTH_AFRICA',
        'AFRIQUE_DU_SUD': 'SOUTH_AFRICA',
        'BIELORUSSIA': 'BELARUS',
        'BELGIE': 'BELGIUM',
        'DANIMARCA': 'DENMARK',
        'DANMARK': 'DENMARK',
        'FRANCIA': 'FRANCE',
        'FRANKREICH': 'GERMANY',
        'FRANKRIKE': 'GERMANY',
        'GERMANIA': 'GERMANY',
        'GIAPPONE': 'JAPAN',
        'INGLATERRA': 'ENGLAND',
        'ISLAND': 'ICELAND',
        'ITALIA': 'ITALY',
        'MESSICO': 'MEXICO',
        'MÉXICO': 'MEXICO',
        'NORGE': 'NORWAY',
        'POLSKA': 'POLAND',
        'REPÚBLICA_DOMINICANA': 'DOMINICAN_REPUBLIC',
        'TÜRKIYE': 'TURKEY',
        'VIETNAM_NOW_HO_CHI_MINH_CITY': 'VIETNAM',
        'VIETNAM_[NOW_HO_CHI_MINH_CITY]': 'VIETNAM',

        // Additional country variations
        'HONGKONG': 'HONG_KONG',
        'PERÚ': 'PERU',
        'THAILANDIA': 'THAILAND',
        'COREA_DEL_SUD': 'SOUTH_KOREA',
        'KASACHSTAN': 'KAZAKHSTAN',
        'KAZAKHSTAN)': 'KAZAKHSTAN',
        'LUXEMBURG': 'LUXEMBOURG',
        'BRASILE': 'BRAZIL',
        'CATANIA': 'ITALY',
        'MILANO_(ITALY)': 'ITALY',
        'ROMA': 'ITALY',
        'MÜNCHEN': 'GERMANY',
        'TOKYO': 'JAPAN',
        'SHIGA': 'JAPAN',
        'ZÜRICH': 'SWITZERLAND',
        'İSTANBUL': 'TURKEY',
        'ALGÉRIE': 'ALGERIA',
        'CÔTE_DIVOIRE': 'IVORY_COAST',
        'DOMINION_OF_NEW_ZEALAND': 'NEW_ZEALAND',
        'EAST_AFRICA': 'KENYA',
        'HEILONGJIANG_PROVINCE': 'CHINA',
        'JAMAICA_WI': 'JAMAICA',
        'MARIANAS_ISLANDS': 'NORTHERN_MARIANA_ISLANDS',
        'MOSCOW': 'RUSSIA',
        'MYANMAR]': 'MYANMAR',
        'RHODESIA': 'ZIMBABWE',
        'SICILY': 'ITALY',
        'SWAZILAND': 'ESWATINI',
        'TAMILNADU': 'INDIA',
        'TRINIDAD_AND_TOBAGO': 'TRINIDAD_AND_TOBAGO',
        'TYSKLAND': 'SWEDEN',
        'VENEZUELA': 'VENEZUELA',

        // Remove duplicates and fix malformed entries
        'ETHIOPIA': 'ETHIOPIA',
        'BOSNIA_AND_HERZEGOVINA]': 'BOSNIA_AND_HERZEGOVINA',
        'CHINA)': 'CHINA',
        'CROATIA)': 'CROATIA',
        'POLAND]': 'POLAND',
        'RUSSIA)': 'RUSSIA',
        'RUSSIA]': 'RUSSIA',
        'SWEDEN]': 'SWEDEN',
        'UKRAINE]': 'UKRAINE',
        'UK]': 'UNITED_KINGDOM',
        'CHI': 'CHINA',
        'BRITISH_CROWN_COLONY_[NOW_CHINA]': 'CHINA',
        'BRITISH_GUIANA': 'GUYANA',
        'BRITISH_HONG_KONG': 'HONG_KONG',
        'BRITISH_INDIA': 'INDIA',
        'BRITISH_WEST_INDIES': 'JAMAICA',
        'US_VIRGIN_ISLANDS': 'UNITED_STATES_VIRGIN_ISLANDS'
    };

    return countryMap[country] || country;
}

function getCountry(placeOfBirth) {

    let retCountry = null;
    if (placeOfBirth && placeOfBirth.trim()) {
        // Clean up the input
        let cleaned = placeOfBirth.trim();

        // Remove trailing periods and spaces
        cleaned = cleaned.replace(/\.$/, '').trim();

        // Handle dash-separated entries
        if (cleaned.includes(' - ')) {
            const parts = cleaned.split(' - ');
            const lastPart = parts[parts.length - 1].trim();
            retCountry = cleanCountryName(lastPart);
        }
        else if (cleaned.includes(',') || cleaned.includes('，')) {
            // Handle comma-separated entries (including Chinese comma ，)
            // Split by both regular comma and Chinese comma
            const parts = cleaned.split(/[,，]/).map(part => part.trim());
            const lastPart = parts[parts.length - 1];
            retCountry = cleanCountryName(lastPart);
        }
        else {
            // Single entry (likely just a country)
            retCountry = cleanCountryName(cleaned);
        }
    }

    retCountry = mapCountryToStandard(retCountry);

    return retCountry;
}

// -------- main ----------
async function main() {
    const out = fs.createWriteStream(OUTPUT);
    const rl = readline.createInterface({
        input: fs.createReadStream(INPUT, { encoding: "utf8" }),
        crlfDelay: Infinity,
    });

    let count = 0, skipped = 0;
    const uniqueCountries = new Set();

    for await (const line of rl) {
        const t = line.trim();
        if (!t) continue;

        let rec;
        try {
            rec = JSON.parse(t);
        } catch (e) {
            skipped++;
            continue;
        }

        let id = rec.id ?? count;
        id = id.replace(/^tmdb:/, "");
        id = "e" + (parseInt(id) + 1); // e for element

        const emb = rec.embeddings;

        if (!Array.isArray(emb) || emb.length !== DIM) {
            skipped++;
            continue;
        }

        // Build command args
        // VADD <vset> [NOQUANT] VALUES <dim> <f1> ... <fN> <id> SETATTR <json>
        const floats = emb.map((x) => {
            // Keep numeric fidelity; avoid toFixed (would bloat file)
            // Ensure string format acceptable to Redis parsing.
            return Number.isFinite(x) ? String(x) : "0";
        });

        const fixString = (str) => {
            str = str || "";
            str = str.replace(/'/g, ''); // like Auli'i
            str = str.replace(/\\"/g, ''); // like \"The Rock\"
            return str;
        }

        const fixedLabel = fixString(rec.label);
        const fixedPlaceOfBirth = fixString(rec.place_of_birth);
        const country = getCountry(fixedPlaceOfBirth);

        uniqueCountries.add(country);

        const attrs = {
            label: fixedLabel,
            imagePath: rec.imagePath ?? "",
            charCount: fixedLabel.length,
            imdbId: rec.imdb_id || null,
            department: fixString(rec.department) || null,
            placeOfBirth: fixedPlaceOfBirth || null,
            popularity: parseFloat(rec.popularity) ?? null,
            country: country || null,
        };
        const attrStr = JSON.stringify(attrs);

        const args = ["VADD", VSET];
        if (ADD_NOQUANT) args.push("NOQUANT");
        args.push("VALUES", String(DIM), ...floats, String(id), "SETATTR", attrStr);

        out.write(formatRedisCommand(args));
        count++;

        if (count % 1000 === 0) {
            process.stdout.write(`\rEncoded ${count} commands…`);
        }
    }

    out.end();

    process.stdout.write(`\rEncoded ${count} commands. Skipped ${skipped}.  \n`);
    console.log(`Redis commands file written -> ${OUTPUT}`);

    // Write sorted countries to JSON file
    const sortedCountries = Array.from(uniqueCountries).sort();
    const countriesOutput = path.join(__dirname, OUTPUT_DIR, "countries.json");
    fs.writeFileSync(countriesOutput, JSON.stringify(sortedCountries, null, 2));
    console.log(`Countries written to ${countriesOutput}`);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});