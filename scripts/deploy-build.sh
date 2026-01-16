#!/bin/bash
set -e

# Disable corepack auto-pinning to prevent pnpm self-installation loop
export COREPACK_ENABLE_AUTO_PIN=0

# Install dependencies first
pnpm install --frozen-lockfile

# Build shared-types first
cd packages/shared-types
pnpm run build
cd ../..

# Build API
cd services/api
pnpm run build
cd ../..

# Build web app
cd apps/web
pnpm run build
