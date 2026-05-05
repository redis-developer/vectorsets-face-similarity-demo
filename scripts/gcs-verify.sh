#!/usr/bin/env bash
#
# Quick verification that the GCS bucket is set up correctly
# and images are publicly accessible.
#
# Usage:  ./scripts/gcs-verify.sh

set -euo pipefail

BUCKET="redis-vectorsets-face-images"
GS_URI="gs://${BUCKET}"
BASE_URL="https://storage.googleapis.com/${BUCKET}/faces/images"

echo "==> Checking bucket exists..."
gcloud storage buckets describe "${GS_URI}" --format="value(name)" 2>/dev/null \
  && echo "    OK" \
  || { echo "    FAIL: Bucket not found"; exit 1; }

echo "==> Counting objects in bucket..."
COUNT=$(gcloud storage ls "${GS_URI}/faces/images/" 2>/dev/null | wc -l | tr -d ' ')
echo "    ${COUNT} objects found"

echo "==> Testing public HTTP access for a sample image..."
SAMPLE=$(gcloud storage ls "${GS_URI}/faces/images/" 2>/dev/null | head -1 | xargs -I{} basename {})
if [ -n "${SAMPLE}" ]; then
  URL="${BASE_URL}/${SAMPLE}"
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${URL}")
  if [ "${HTTP_CODE}" = "200" ]; then
    echo "    OK (HTTP ${HTTP_CODE}): ${URL}"
  else
    echo "    FAIL (HTTP ${HTTP_CODE}): ${URL}"
    exit 1
  fi
else
  echo "    WARN: No images found in bucket to test"
fi

echo ""
echo "==> All checks passed."
