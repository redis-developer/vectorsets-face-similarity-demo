#!/bin/bash
set -e

echo "==> Checking for Git LFS..."
if ! command -v git-lfs &> /dev/null; then
  echo "Git LFS is not installed."
  echo "Install it from https://git-lfs.com or via your package manager:"
  echo "  macOS:  brew install git-lfs"
  echo "  Ubuntu: sudo apt install git-lfs"
  exit 1
fi

echo "==> Initializing Git LFS..."
git lfs install

echo "==> Pulling LFS files..."
git lfs pull

echo "==> Verifying LFS files..."
git lfs ls-files

echo ""
echo "Setup complete! LFS files are ready."
echo "Run './start.sh' to start the application."
