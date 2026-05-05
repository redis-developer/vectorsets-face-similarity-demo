# VectorSets Face Similarity Demo

Face similarity search powered by **Redis VectorSets** and **Google Gemini Embedding 2**.

Upload a photo or pick a face from the gallery — the app finds the most visually similar faces in the dataset using 3072-dimensional vector embeddings.

**Stack:** Express.js, React (Vite), Redis VectorSets, Gemini Embedding API.

## Prerequisites

| Requirement                 | Notes                                               |
| --------------------------- | --------------------------------------------------- |
| **Git LFS**                 | Required — database dump is stored via Git LFS      |
| **Gemini API key**          | Free tier available at https://aistudio.google.com/ |
| **Redis** (with VectorSets) | Bundled via Docker, or run locally                  |
| **Node.js 20+**             | For local development                               |
| **Docker + Compose**        | For Docker setup                                    |

## Getting Started

After cloning, run the setup script to pull the LFS files (includes the pre-built Redis database):

```bash
./setup.sh
```

This installs Git LFS hooks and downloads `database/redis-data/dump.rdb` (~287 MB).

## Environment Setup

```bash
cp .env.example .env
vi .env    # Set your GEMINI_API_KEY
```

```env
GEMINI_API_KEY=your_key_here   # Required — get from https://aistudio.google.com/
PORT=3000
BASE_PATH=
```

---

## Docker Setup (Recommended)

```bash
docker-compose up --build        # foreground
docker-compose up -d --build     # background
```

This starts two containers:

| Service   | Port | Description                              |
| --------- | ---- | ---------------------------------------- |
| **app**   | 3000 | Express server + React client + Gemini   |
| **redis** | 6379 | Redis with pre-loaded face data          |

Open **http://localhost:3000** and you're good to go.

> `REDIS_URL` is automatically set to `redis://redis:6379` in Docker via `docker-compose.yml`. No need to set it in `.env`.

```bash
docker-compose down              # stop
docker-compose logs -f           # view logs
docker-compose ps                # service status
docker-compose build --no-cache  # rebuild without cache
docker-compose down -v --rmi all # clean everything
```

---

## Local Development Setup

### 1. Start Redis

```bash
# Option A: Use Docker for Redis only
docker compose up -d redis

# Option B: Start your own Redis server (must support VectorSets)
```

### 2. Install and run

```bash
npm install
npm run dev
```

This starts both the server (port 3000) and client dev server (port 5173) concurrently.

### 3. Open the app

- **UI:** http://localhost:5173 (Vite proxy forwards API calls to port 3000)
- **API:** http://localhost:3000

---

## Database

The Redis database (`database/redis-data/dump.rdb`) is tracked via **Git LFS**. Make sure you've run `./setup.sh` after cloning so the file is downloaded. It is automatically loaded when using Docker (mounted read-only).

To re-seed from scratch, see [`database/tmdb-gemini/readme.md`](database/tmdb-gemini/readme.md).

---

## Project Structure

```
.
├── .env.example         # Environment template
├── app/
│   ├── client/          # React + Vite frontend
│   ├── server/          # Express.js backend
│   │   └── src/api/
│   │       └── new-element-search/
│   │           └── gemini-embeddings.ts   # Gemini Embedding 2 integration
│   └── Dockerfile       # Multi-stage: Vite client build → Express server
├── database/
│   ├── redis-data/      # Pre-built dump.rdb
│   └── tmdb-gemini/     # Data pipeline (fetch → crop → embed → seed)
├── docker-compose.yml   # 2 services: app + redis
└── docs/
    └── architecture.md  # Detailed architecture documentation
```
