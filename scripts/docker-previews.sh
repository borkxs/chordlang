#!/usr/bin/env bash
# Generate previews in Docker for consistent rendering across platforms
#
# Usage:
#   ./scripts/docker-previews.sh          # Build image and generate previews
#   ./scripts/docker-previews.sh --build  # Force rebuild of Docker image
#   ./scripts/docker-previews.sh --shell  # Drop into shell for debugging

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
IMAGE_NAME="chordlang-previews"
IMAGE_TAG="latest"

cd "$ROOT_DIR"

# Parse arguments
BUILD_ONLY=false
SHELL_MODE=false

for arg in "$@"; do
  case $arg in
    --build)
      BUILD_ONLY=true
      ;;
    --shell)
      SHELL_MODE=true
      ;;
    *)
      echo "Unknown argument: $arg"
      echo "Usage: $0 [--build] [--shell]"
      exit 1
      ;;
  esac
done

# Build Docker image
echo "Building Docker image for consistent preview generation..."
docker build -f docker/Dockerfile.previews -t "${IMAGE_NAME}:${IMAGE_TAG}" .

if [ "$BUILD_ONLY" = true ]; then
  echo "✓ Image built: ${IMAGE_NAME}:${IMAGE_TAG}"
  exit 0
fi

if [ "$SHELL_MODE" = true ]; then
  echo "Starting interactive shell in preview environment..."
  docker run --rm -it \
    -v "$ROOT_DIR/docs/assets:/workspace/docs/assets" \
    "${IMAGE_NAME}:${IMAGE_TAG}" \
    /bin/bash
  exit 0
fi

# Generate previews
echo "Generating previews in Docker..."
docker run --rm \
  -v "$ROOT_DIR/docs/assets:/workspace/docs/assets" \
  "${IMAGE_NAME}:${IMAGE_TAG}"

echo "✓ Previews generated in docs/assets/"
echo ""
echo "Review changes:"
echo "  git status docs/assets/"
echo "  git diff docs/assets/"
