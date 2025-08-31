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
function getCountry(placeOfBirth) {
    if (!placeOfBirth || placeOfBirth.trim() === '') {
        return null;
    }

    // Clean up the input
    let cleaned = placeOfBirth.trim();

    // Remove trailing periods and spaces
    cleaned = cleaned.replace(/\.$/, '').trim();

    // Handle dash-separated entries
    if (cleaned.includes(' - ')) {
        const parts = cleaned.split(' - ');
        const lastPart = parts[parts.length - 1].trim();
        return cleanCountryName(lastPart);
    }

    // Handle comma-separated entries
    if (cleaned.includes(',')) {
        const parts = cleaned.split(',').map(part => part.trim());
        const lastPart = parts[parts.length - 1];
        return cleanCountryName(lastPart);
    }

    // Single entry (likely just a country)
    return cleanCountryName(cleaned);
}

function cleanCountryName(country) {
    if (!country) return null;

    // Remove dots, extra spaces, and capitalize
    return country
        .replace(/\./g, '') // Remove all dots
        .replace(/\s+/g, '_') // Replace multiple spaces with _
        .trim()
        .toUpperCase();
}

// -------- main ----------
async function main() {
    const out = fs.createWriteStream(OUTPUT);
    const rl = readline.createInterface({
        input: fs.createReadStream(INPUT, { encoding: "utf8" }),
        crlfDelay: Infinity,
    });

    let count = 0, skipped = 0;

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
        const attrs = {
            label: fixedLabel,
            imagePath: rec.imagePath ?? "",
            charCount: fixedLabel.length,
            imdbId: rec.imdb_id || null,
            department: fixString(rec.department) || null,
            placeOfBirth: fixedPlaceOfBirth || null,
            popularity: parseFloat(rec.popularity) ?? null,
            country: getCountry(fixedPlaceOfBirth) || null,
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
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});