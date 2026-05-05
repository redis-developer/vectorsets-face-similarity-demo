#!/usr/bin/env bash
#
# Upload face images to the GCS bucket.
#
# Usage:
#   ./scripts/gcs-upload-images.sh                       # upload all (single stream)
#   ./scripts/gcs-upload-images.sh --parallel 8          # upload with 8 parallel streams
#   ./scripts/gcs-upload-images.sh /path/to/images/      # upload from a specific dir
#   ./scripts/gcs-upload-images.sh /path/to/images/ --parallel 4
#
# Prerequisites: gcloud CLI authenticated; bucket already created (run gcs-setup.sh first).

set -euo pipefail

BUCKET="redis-vectorsets-face-images"
GS_DEST="gs://${BUCKET}/faces/images/"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
DEFAULT_SRC="${REPO_ROOT}/app/server/static/faces/images/"

PARALLEL=1
SRC_DIR="${DEFAULT_SRC}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --parallel)
      PARALLEL="${2:-8}"
      shift 2
      ;;
    *)
      SRC_DIR="$1"
      shift
      ;;
  esac
done

if [ ! -d "${SRC_DIR}" ]; then
  echo "ERROR: Source directory does not exist: ${SRC_DIR}"
  exit 1
fi

FILE_COUNT=$(find "${SRC_DIR}" -maxdepth 1 -type f -name "*.jpg" | wc -l | tr -d ' ')
echo "==> Uploading ${FILE_COUNT} files from ${SRC_DIR}"
echo "    Destination: ${GS_DEST}"
echo "    Parallel streams: ${PARALLEL}"
echo ""

if [ "${PARALLEL}" -le 1 ]; then
  find "${SRC_DIR}" -maxdepth 1 -type f -name "*.jpg" | \
    gcloud storage cp -I "${GS_DEST}"
else
  TMPDIR=$(mktemp -d)
  trap 'rm -rf "${TMPDIR}"' EXIT

  BATCH_SIZE=$(( (FILE_COUNT + PARALLEL - 1) / PARALLEL ))
  find "${SRC_DIR}" -maxdepth 1 -type f -name "*.jpg" | sort | \
    split -l "${BATCH_SIZE}" - "${TMPDIR}/batch-"

  PIDS=()
  for batch_file in "${TMPDIR}"/batch-*; do
    gcloud storage cp -I "${GS_DEST}" < "${batch_file}" &
    PIDS+=($!)
  done

  echo "    Launched ${#PIDS[@]} parallel upload processes"

  FAILED=0
  for pid in "${PIDS[@]}"; do
    if ! wait "${pid}"; then
      FAILED=$((FAILED + 1))
    fi
  done

  if [ "${FAILED}" -gt 0 ]; then
    echo "ERROR: ${FAILED} batch(es) failed"
    exit 1
  fi
fi

echo ""
echo "==> Upload complete."
echo "    Public URL pattern: https://storage.googleapis.com/${BUCKET}/faces/images/<filename>"
