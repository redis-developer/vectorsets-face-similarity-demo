# TMDB–Gemini Data Pipeline

End-to-end pipeline that downloads actor images from TMDB, crops faces, generates embeddings with Google Gemini Embedding 2, and loads them into Redis VectorSets.

## Prerequisites

| Requirement | Where to get it |
|-------------|-----------------|
| **TMDB API key** | https://www.themoviedb.org/settings/api |
| **Gemini API key** | https://aistudio.google.com/ |
| **Node.js 20+** | https://nodejs.org/ |
| **Python 3.10+** | For face cropping (MediaPipe) |
| **Redis** | Running locally or via Docker |

## Setup

```bash
cd database/tmdb-gemini
npm install
pip install mediapipe Pillow
```

Create a `.env` file from the template:

```bash
cp .env.example .env
```

Then fill in your API keys:

```env
TMDB_API_KEY=your_tmdb_api_key
GEMINI_API_KEY=your_gemini_api_key
```

## Pipeline Steps

Run each step in order from the `database/tmdb-gemini/` directory.

### Step 1 — Download high-resolution TMDB images

Fetches person metadata from HuggingFace and downloads original-resolution profile images from TMDB.

```bash
node 01-fetch-hq.js
```

| Flag | Description |
|------|-------------|
| `--limit N` | Only process first N records |
| `--dry-run` | Print what would happen without downloading |

**Output:** `output/images-hq/` (JPEG images) + `output/tmdb-hq.ndjson` (metadata manifest)

### Step 2 — Crop faces

Detects and crops the primary face from each image using MediaPipe.

```bash
python3 02-crop-faces.py
```

| Flag | Description |
|------|-------------|
| `--input DIR` | Input image directory (default: `output/images-hq`) |
| `--output DIR` | Output directory for cropped images (default: `output/images-cropped`) |
| `--padding N` | Padding around face as fraction (default: `0.35`) |
| `--min-conf N` | Minimum detection confidence (default: `0.5`) |

**Output:** `output/images-cropped/` (square face crops) + `output/crop-report.json`

### Step 3 — Embed with Gemini

Generates 3072-dimensional embeddings for each cropped face image using `gemini-embedding-2-preview`.

```bash
node 03-embed-gemini.js
```

| Flag | Description |
|------|-------------|
| `--limit N` | Only embed first N images |
| `--concurrency N` | Parallel API calls (default: `5`) |
| `--dry-run` | Validate inputs without calling the API |

Reads `GEMINI_API_KEY` from `.env`. Supports checkpointing — safe to interrupt and resume.

**Output:** `output/tmdb.embedded.ndjson` (metadata + embedding vectors)

### Step 4 — Generate Redis commands

Converts the embedded NDJSON into Redis `VADD` commands for `vset:faces`.

```bash
node 04-create-redis-file.js
```

**Output:** `output/faces.redis` (one VADD command per line) + `output/countries.json`

### Step 5 — Load into Redis

Executes the generated Redis commands to populate the `vset:faces` vector set.

```bash
node 05-run-redis-file.js
```

| Flag | Description |
|------|-------------|
| `--flush` | Delete existing `vset:faces` before loading |
| `--redis-url URL` | Redis connection URL (default: `redis://localhost:6379`) |

### Step 6 — Copy display images

Copy the original (uncropped) images to the server's static directory so the app can serve them to the browser:

```bash
cp -r output/images-hq/* ../../app/server/static/faces/images/
```

## Quick Reference

```bash
# Full pipeline from scratch
node 01-fetch-hq.js
python3 02-crop-faces.py
node 03-embed-gemini.js
node 04-create-redis-file.js
node 05-run-redis-file.js --flush
cp -r output/images-hq/* ../../app/server/static/faces/images/
```

## Output Directory

All intermediate and final outputs go into `output/` (git-ignored):

```
output/
  images-hq/           # Original TMDB images
  images-cropped/      # Face-cropped images (used for embedding)
  tmdb-hq.ndjson       # Metadata manifest
  tmdb.embedded.ndjson  # Metadata + 3072-d embeddings
  faces.redis          # Redis VADD commands
  countries.json       # Unique country list
  crop-report.json     # Face detection results
```

## npm Scripts

| Script | Command |
|--------|---------|
| `npm run fetch` | `node 01-fetch-hq.js` |
| `npm run crop` | `python3 02-crop-faces.py` |
| `npm run embed` | `node 03-embed-gemini.js` |
| `npm run redis:create` | `node 04-create-redis-file.js` |
| `npm run redis:load` | `node 05-run-redis-file.js` |
