# [Old] Architecture — Face Similarity App (Pre-Gemini Migration)

> **Note:** This document describes the original architecture before the migration to Google Gemini Embedding 2. It is kept for historical reference only. See the root `readme.md` for the current architecture.

## Overview

A face similarity demo app that lets users upload a photo (or pick one from a gallery), then finds visually similar faces from a pre-indexed dataset using **Redis VectorSets**. The app supports two datasets, each using a different embedding model.

---

## Services (3 containers + Redis)

```
┌─────────────┐       ┌──────────────────────────────────────────────────┐
│   Browser    │──────▶│  Node.js App (Express + Vite SPA)  :3000        │
│  React SPA   │       │                                                  │
└─────────────┘       │  ┌─ Celebrity queries ──▶ HTTP POST ─────────┐  │
                      │  │                                            ▼  │
                      │  │                          ┌────────────────────┐│
                      │  │                          │  embed-python      ││
                      │  │                          │  FastAPI  :8009    ││
                      │  │                          │  ViT model (768-d) ││
                      │  │                          └────────────────────┘│
                      │  │                                                │
                      │  ├─ TMDB queries ──▶ In-process CLIP (Node)      │
                      │  │   @huggingface/transformers (768-d)            │
                      │  │                                                │
                      │  └─ Both ──▶ VSIM command ────────────────────┐  │
                      │                                                ▼  │
                      │                               ┌──────────────────┐│
                      │                               │  Redis  :6379    ││
                      │                               │  VectorSets      ││
                      │                               │  vset:celeb      ││
                      │                               │  vset:tmdb       ││
                      │                               └──────────────────┘│
                      └──────────────────────────────────────────────────┘
```

| Service | Tech | Port | Purpose |
|---------|------|------|---------|
| **app** | Node.js / Express / Vite React | 3000 | API server + SPA frontend |
| **embed-python** | Python / FastAPI / PyTorch | 8009 | Embedding service for Celebrity dataset |
| **redis** | Redis Alpine | 6379 | Vector storage & similarity search |

---

## Datasets

### 1. Celebrity 1000 (`vset:celeb`)

| Aspect | Detail |
|--------|--------|
| **Source** | `tonyassi/celebrity-1000-embeddings` on Hugging Face |
| **Embedding model** | `tonyassi/celebrity-classifier` — ViT image classifier |
| **How embedded** | CLS token from last hidden state, L2-normalized |
| **Dimensions** | 768 |
| **Runtime query embedding** | Python service (`embed-python`) via HTTP |
| **Count** | ~1,000 celebrity faces |
| **Offline pipeline** | `database/celebrity-1000-embeddings/` — downloads NDJSON from HF, converts to Redis VADD commands |

### 2. TMDB 10k (`vset:tmdb`)

| Aspect | Detail |
|--------|--------|
| **Source** | TMDB API (fetched via `database/tmdb/01-fetch.js`) |
| **Embedding model** | `Xenova/clip-vit-large-patch14` — CLIP ViT-L/14 (ONNX) |
| **How embedded** | `image_embeds` from CLIPVisionModelWithProjection, L2-normalized |
| **Dimensions** | 768 |
| **Runtime query embedding** | In-process Node.js via `@huggingface/transformers` |
| **Count** | ~10,000 actor/actress faces |
| **Offline pipeline** | `database/tmdb/01-fetch.js` → `02-embed.js` → `03-create-redis-file.js` → `04-run-redis-file.js` |

---

## Embedding Flow (Runtime)

### Celebrity Dataset (Python path)

```
User uploads image
  → Express receives multipart upload → saves to /uploads/
  → Node reads file from disk
  → POST multipart/form-data to embed-python:8009/embed
  → Python: ViTImageProcessor + ViTForImageClassification → CLS token → L2 norm
  → Returns { embedding: number[768] }
  → Node: VSIM 'vset:celeb' VALUES 768 <floats...> WITHSCORES WITHATTRIBS COUNT N
  → Redis returns matching face IDs + scores + attributes
```

### TMDB Dataset (Node path)

```
User uploads image
  → Express receives multipart upload → saves to /uploads/
  → Node loads image via RawImage.read()
  → In-process: AutoProcessor + CLIPVisionModelWithProjection → image_embeds → L2 norm
  → Returns number[768]
  → Node: VSIM 'vset:tmdb' VALUES 768 <floats...> WITHSCORES WITHATTRIBS COUNT N
  → Redis returns matching face IDs + scores + attributes
```

### Existing Element Search (both datasets)

```
User picks a face from the gallery grid
  → Node sends: VSIM 'vset:X' ELE '<elementId>' WITHSCORES WITHATTRIBS COUNT N
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
| POST | `/api/getServerConfig` | Returns `{ currentDataset, basePath }` |

---

## Frontend (React SPA)

- **Dataset picker** — switch between Celebrity 1000 and TMDB 10k
- **Input methods** — drag/drop upload, webcam selfie, or click a random gallery thumbnail
- **Search bar** — builds VectorSet FILTER expressions (e.g. `.country=="INDIA"`, `.popularity>=X`)
- **Results** — nearest match highlighted, grid of other matches with similarity scores
- **Query display** — shows the actual Redis VSIM command used

---

## Docker Compose Setup

```yaml
services:
  redis:        # redis:alpine, mounts dump.rdb read-only
  embed-python: # Builds embed-python/Dockerfile (Python 3.13, PyTorch, ViT model)
  app:          # Builds app/Dockerfile (Node 25, multi-stage: Vite build → Express)
```

**Key details:**
- `embed-python` has a 60s startup period (model download/load) with health checks
- `app` depends on both `redis` (started) and `embed-python` (healthy)
- Redis data is pre-seeded via `dump.rdb` — the app is read-only against Redis
- HuggingFace model caches are volume-mounted to avoid re-downloads

---

## Key Dependencies

### Node Server (`app/server/package.json`)
- `express` — HTTP server
- `redis` — Redis client (sendCommand for VectorSet ops)
- `@huggingface/transformers` — CLIP model for TMDB embeddings (~700MB ONNX weights)
- `multer` — file upload handling
- `node-fetch` + `form-data` — HTTP client for Python embed service
- `zod` — input validation

### Python Service (`embed-python/requirements.txt`)
- `fastapi` + `uvicorn` — HTTP server
- `transformers` + `torch` — ViT model (~1.1GB PyTorch weights)
- `pillow` — image processing

---

## Pain Points of Current Architecture

1. **Two separate services for embeddings** — Python (ViT) for celebrities, Node (CLIP) for TMDB
2. **Two different models** — embeddings are incompatible between datasets (different vector spaces)
3. **Heavy Docker image** — Python service pulls PyTorch (~2GB), Node service pulls ONNX CLIP weights (~700MB)
4. **Slow cold start** — embed-python needs 60s+ for model download; Node CLIP also slow on first load
5. **Complex deployment** — 3 containers to manage, health checks, inter-service networking
6. **Two embedding pipelines** — offline scripts use different tools for each dataset
7. **No unified model** — can't search across datasets or add new datasets easily
