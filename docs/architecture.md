# Architecture — Face Similarity App

## Overview

A face similarity demo that lets users upload a photo (or pick one from a gallery), then finds visually similar faces using **Redis VectorSets** and **Google Gemini Embedding 2**.

Single unified dataset. Single embedding model. Two containers.

---

## Services (2 containers)

```
┌─────────────┐       ┌──────────────────────────────────────────────┐
│   Browser    │──────▶│  Node.js App (Express + Vite SPA)  :3000    │
│  React SPA   │       │                                              │
└─────────────┘       │  Upload image                                │
      │               │    → base64 encode                           │
      │               │    → Gemini Embedding API (3072-d)           │
      │               │    → VSIM vset:faces VALUES 3072 ...         │
      │               │                                              │
      │               │              ┌────────────────────┐          │
      │               │              │  Redis  :6379      │          │
      │               │              │  VectorSets        │          │
      │               │              │  vset:faces (3072) │          │
      │               │              └────────────────────┘          │
      │               └──────────────────────────────────────────────┘
      │                                       │
      │                                       ▼
      │                           ┌────────────────────────┐
      │                           │  Google Gemini API      │
      │                           │  gemini-embedding-2     │
      │                           │  (external, no container)│
      │                           └────────────────────────┘
      │
      │  (direct image fetch)
      ▼
┌──────────────────────────────────┐
│  Google Cloud Storage (public)   │
│  gs://redis-vectorsets-face-images│
│  86k+ face images                │
└──────────────────────────────────┘
```

| Service | Tech | Port | Purpose |
|---------|------|------|---------|
| **app** | Node.js / Express / React (Vite) | 3000 | API server + SPA frontend + Gemini embedding |
| **redis** | Redis Alpine | 6379 | Vector storage & similarity search |
| **GCS** | Google Cloud Storage (external) | — | Public image hosting (86k+ face images) |

---

## Dataset

### Faces (`vset:faces`)

| Aspect | Detail |
|--------|--------|
| **Source** | TMDB API — actor/actress profile images |
| **Image quality** | Original resolution from TMDB CDN |
| **Face cropping** | MediaPipe face detection (offline, before embedding) |
| **Embedding model** | `gemini-embedding-2-preview` (Google Gemini) |
| **Dimensions** | 3072 |
| **Runtime query embedding** | Node.js → Gemini API (HTTP) |
| **Count** | ~10,000 faces |
| **Offline pipeline** | `database/tmdb-gemini/` (01–05 scripts) |

### Attributes stored per element

```json
{
  "label": "Ana de Armas",
  "imagePath": "images/000013_Ana_de_Armas.jpg",
  "charCount": 12,
  "imdbId": "nm1869101",
  "department": "Acting",
  "placeOfBirth": "Santa Cruz del Norte, Cuba",
  "popularity": 72.5,
  "country": "CUBA"
}
```

---

## Embedding Flow (Runtime)

### New image search (user uploads a photo)

```
User uploads image
  → Express receives multipart upload → saves to /uploads/
  → Node reads file → base64 encode
  → POST to Gemini API (gemini-embedding-2-preview, 3072-d)
  → Returns number[3072]
  → Node: VSIM 'vset:faces' VALUES 3072 <floats...> WITHSCORES WITHATTRIBS COUNT N
  → Redis returns matching face IDs + scores + attributes
```

**Expected latency:** ~200–400ms for Gemini API call.

### Existing element search (user picks from gallery)

```
User clicks a face from the gallery
  → Node: VSIM 'vset:faces' ELE '<elementId>' WITHSCORES WITHATTRIBS COUNT N
  → No embedding needed — Redis compares directly by stored vector
```

---

## API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/imageUpload` | Upload image, returns `{ id, url, filename }` |
| POST | `/api/newElementSearch` | Embed uploaded image → VSIM by VALUES |
| POST | `/api/existingElementSearch` | VSIM by existing element ID |
| POST | `/api/getSampleImages` | VRANDMEMBER + VGETATTR for gallery grid |
| POST | `/api/getServerConfig` | Returns `{ basePath }` |

---

## Frontend (React SPA)

- **Input methods** — drag/drop upload, webcam selfie, or click a random gallery thumbnail
- **Search bar** — builds VectorSet FILTER expressions (e.g. `.country=="INDIA"`, `.popularity>=50`)
- **Results** — nearest match highlighted, grid of other matches with similarity scores
- **Query display** — shows the actual Redis VSIM command used

---

## Image Storage (GCS)

Face images are **not** bundled in the Docker image or git repo. They live in a public GCS bucket:

| Aspect | Detail |
|--------|--------|
| **Bucket** | `gs://redis-vectorsets-face-images` |
| **Project** | `redis-technical-marketing` |
| **Region** | `us-central1` |
| **Access** | Public (`allUsers` → `objectViewer`) |
| **URL pattern** | `https://storage.googleapis.com/redis-vectorsets-face-images/faces/images/<filename>` |
| **Count** | 86k+ images (~11 GB) |

The server returns full GCS URLs in API responses via the `IMAGE_PREFIX` config. The browser fetches images directly from GCS — no server proxy.

### Managing GCS images

Reusable scripts in `scripts/`:

| Script | Purpose |
|--------|---------|
| `gcs-setup.sh` | Create bucket + set public read IAM (idempotent) |
| `gcs-upload-images.sh` | Upload images to bucket (accepts optional source dir) |
| `gcs-verify.sh` | Verify bucket exists, count objects, test public HTTP access |

---

## Docker Compose

```yaml
services:
  redis:   # redis:alpine, mounts dump.rdb read-only
  app:     # Multi-stage: Vite client build → Express server
```

- Redis data is pre-seeded via `dump.rdb` — the app is read-only against Redis
- `app` depends on `redis` (started)
- Gemini API key and `IMAGE_PREFIX` are set via `.env`
- Face images are served from GCS, not from the container

---

## Key Dependencies

### Node Server (`app/server/package.json`)

- `express` — HTTP server
- `redis` — Redis client (sendCommand for VectorSet ops)
- `@google/genai` — Google Gemini SDK for image embeddings
- `multer` — file upload handling
- `zod` — input validation

---

## Offline Data Pipeline

All scripts in `database/tmdb-gemini/`:

| Step | Script | Purpose |
|------|--------|---------|
| 1 | `01-fetch-hq.js` | Download original-res TMDB images |
| 2 | `02-crop-faces.py` | Face detection + crop (MediaPipe) |
| 3 | `03-embed-gemini.js` | Embed cropped faces with Gemini |
| 4 | `04-create-redis-file.js` | Convert to Redis VADD commands |
| 5 | `05-run-redis-file.js` | Load into Redis |

See [`database/tmdb-gemini/readme.md`](../database/tmdb-gemini/readme.md) for full instructions.
