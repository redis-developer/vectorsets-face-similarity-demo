#!/usr/bin/env bash
#
# Create (or verify) the GCS bucket for face images and make it public.
# Idempotent — safe to run multiple times.
#
# Usage:  ./gcs-setup.sh
#
# Prerequisites: gcloud CLI authenticated with sufficient IAM permissions.

set -euo pipefail

BUCKET="redis-vectorsets-face-images"
PROJECT="redis-technical-marketing"
LOCATION="us-central1"
GS_URI="gs://${BUCKET}"

echo "==> Checking if bucket ${GS_URI} exists..."
if gcloud storage buckets describe "${GS_URI}" --project="${PROJECT}" &>/dev/null; then
  echo "    Bucket already exists."
else
  echo "    Creating bucket..."
  gcloud storage buckets create "${GS_URI}" \
    --project="${PROJECT}" \
    --location="${LOCATION}" \
    --uniform-bucket-level-access
  echo "    Bucket created."
fi

echo "==> Ensuring public read access (allUsers → objectViewer)..."
gcloud storage buckets add-iam-policy-binding "${GS_URI}" \
  --member=allUsers \
  --role=roles/storage.objectViewer \
  --quiet

echo "==> Done. Bucket is publicly readable at:"
echo "    https://storage.googleapis.com/${BUCKET}/"
