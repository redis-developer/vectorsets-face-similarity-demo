# VectorSets Face Similarity Demo

This project demonstrates face similarity search using **Redis VectorSets**. It features a **Next.js frontend**, a **Node.js backend**, and **AI-powered face embedding** capabilities.

## Quick Start

### Clone with Git LFS

This repository uses **Git LFS** (Large File Storage) to manage large image files. To clone the repository correctly, you **must** have Git with Git LFS installed.

```bash
# Install Git LFS
# macOS: brew install git-lfs
# Ubuntu: sudo apt-get install git-lfs
# Windows: choco install git-lfs

git lfs install
git clone https://github.com/PrasanKumar93/vectorsets-face-similarity.git
cd vectorsets-face-similarity
git lfs pull
```

### Modify Environment Variables (optional)

Modify the environment files to change default configurations.
`backend/.env.docker` and `frontend/.env.docker`

### Start with Docker

If you have **Docker** and **Docker Compose** installed, you can quickly start all services.

```bash
# Start all services
docker-compose up --build

# Stop all services
docker-compose down
```

**Access the services at these URLs:**

- **Frontend**: `http://localhost:3000`
- **Backend**: `http://localhost:3001`
- **Redis**: `localhost:6379`

For more detailed instructions on using Docker, see the **DOCKER_README.md** file.

## 🔧 Local Development

To run the services locally without Docker, follow these steps:

### Backend Setup

- (optional) update `backend/.env` file to change default configurations.

```bash
cd backend
npm install
npm run dev
```

### Frontend Setup

- (optional) update `frontend/.env` file to change default configurations.

```bash
cd frontend
npm install
npm run dev
```

### Redis Setup

Ensure a local Redis instance is running (if started by docker-compose), or update the backend environment variable to point to your specific Redis instance.

## 📊 Datasets

This project includes pre-processed datasets to get you started quickly. The large image files are stored using Git LFS to keep the repository size small.

- **TMDB Dataset**: Contains over 10,000 actors' images and basic details.

### Seed Data into Redis

To populate the Redis database with the TMDB dataset, use a tool like **Redis Insight**.

Upload the `database/tmdb/output/tmdb.redis` file to your Redis database (e.g., `redis://localhost:6379`).
You can use the **Bulk Actions -> Upload Data** feature in Redis Insight.

![Redis Insight Upload](./docs/images/redis-insight-upload.png)
