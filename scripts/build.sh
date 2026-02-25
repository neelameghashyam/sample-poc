#!/bin/bash
set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

echo "================================"
echo "TG Template Webapp - Build"
echo "================================"
echo ""

# Clean artifacts directory
rm -rf "$PROJECT_ROOT/deployment/artifacts"
mkdir -p "$PROJECT_ROOT/deployment/artifacts"

# Build frontend
echo "[1/3] Building frontend..."
cd "$PROJECT_ROOT/frontend"
npm ci
npm run build
echo "Frontend built to deployment/artifacts/frontend/"
echo ""

# Package backend
echo "[2/3] Packaging backend..."
cd "$PROJECT_ROOT/backend"
npm ci --omit=dev
zip -r "$PROJECT_ROOT/deployment/artifacts/backend.zip" \
    src/ \
    node_modules/ \
    package.json \
    -x "*.test.js" \
    -x "src/serve.js"
echo "Backend packaged to deployment/artifacts/backend.zip"
echo ""

# Package cron
echo "[3/3] Packaging cron jobs..."
cd "$PROJECT_ROOT/cron"
npm ci --omit=dev
zip -r "$PROJECT_ROOT/deployment/artifacts/cron.zip" \
    src/ \
    node_modules/ \
    package.json \
    -x "*.test.js"
echo "Cron packaged to deployment/artifacts/cron.zip"
echo ""

echo "================================"
echo "Build complete!"
echo "================================"
echo ""
echo "Artifacts:"
ls -la "$PROJECT_ROOT/deployment/artifacts/"
