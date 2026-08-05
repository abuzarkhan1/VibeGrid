#!/usr/bin/env bash
set -e

echo "⚡ Building VibeGrid Production Release..."

# Optional: build ONE universal macOS binary for Apple Silicon + Intel:
#   UNIVERSAL=1 ./scripts/build-release.sh
EXTRA_TARGET=()
if [ "${UNIVERSAL:-0}" = "1" ]; then
  if [ "$(uname -s)" != "Darwin" ]; then
    echo "⚠️  UNIVERSAL=1 is only supported on macOS; building the native arch instead." >&2
  else
    echo "🍎 Building universal macOS binary (aarch64 + x86_64)..."
    rustup target add aarch64-apple-darwin x86_64-apple-darwin
    EXTRA_TARGET=("--target" "universal-apple-darwin")
  fi
fi

# 1. Run Typecheck & Frontend Vitest Unit Tests
echo "🔍 Running Typecheck & Frontend Tests..."
npx tsc --noEmit
npm test

# 2. Run Rust Backend Tests
echo "🦀 Running Rust Backend Unit Tests..."
cd src-tauri && cargo test && cd ..

# 3. Build Production Web Bundle
echo "🎨 Building Production Web Frontend..."
npm run build

# 4. Build Tauri Native Release Binary
echo "🚀 Building Tauri Desktop Application..."
npm run tauri -- build "${EXTRA_TARGET[@]}"

echo "📦 Generating SHA256 Checksums..."
if [ -d "src-tauri/target/release/bundle" ]; then
  find src-tauri/target/release/bundle -type f \( -name "*.dmg" -o -name "*.msi" -o -name "*.exe" -o -name "*.AppImage" -o -name "*.deb" -o -name "*.rpm" \) -exec shasum -a 256 {} + > release_checksums.txt
  cat release_checksums.txt
fi

echo "✅ Release Build Completed Successfully!"
