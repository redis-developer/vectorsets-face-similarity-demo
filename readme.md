# VectorSets Face Similarity Demo

This project demonstrates face similarity search using **Redis VectorSets**. It features a **Next.js frontend**, a **Node.js backend**, and **AI-powered face embedding** capabilities.

## Quick Start

```bash
# Clone the repository
git clone https://github.com/PrasanKumar93/vectorsets-face-similarity.git
cd vectorsets-face-similarity
```

## Docker Setup (Recommended)

### Prerequisites

- Docker and Docker Compose installed

### Start Services

```bash
# Start all services
docker-compose up --build

# Stop all services
docker-compose down
```

### Environment Configuration (Optional)

Modify these files to change default configurations:

- `backend/.env.docker`
- `frontend/.env.docker`

### Access URLs

- **Frontend**: `http://localhost:3000`
- **Backend**: `http://localhost:3001`
- **Redis**: `localhost:6379`

### Database

The database is automatically loaded with the `database/redis-data/dump.rdb` file when using Docker.

For more detailed Docker instructions, see **DOCKER_README.md**.

---

## 🔧 Local Development Setup

### Prerequisites

- Node.js installed
- Redis server running

### Backend Setup

```bash
cd backend
npm install
npm run dev
```

**Optional**: Update `backend/.env` file to change default configurations.

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

**Optional**: Update `frontend/.env` file to change default configurations.

### Database Setup

Install git lfs for large files handling

```bash
# Install Git LFS
# macOS: brew install git-lfs
# Ubuntu: sudo apt-get install git-lfs
# Windows: choco install git-lfs

git lfs install
git lfs pull
```

Upload the following files to your Redis database (e.g., `redis://localhost:6379`):

- `database/tmdb/output/tmdb.redis`
- `database/celebrity-1000-embeddings/output/celebs.redis`

You can use the **Bulk Actions → Upload Data** feature in Redis Insight:

![Redis Insight Upload](./docs/images/redis-insight-upload.png)
