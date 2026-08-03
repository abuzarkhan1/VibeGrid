#!/usr/bin/env bash
set -e

echo "⚡ Building VibeGrid Production Release..."

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
npm run tauri build

echo "📦 Generating SHA256 Checksums..."
if [ -d "src-tauri/target/release/bundle" ]; then
  find src-tauri/target/release/bundle -type f \( -name "*.dmg" -o -name "*.msi" -o -name "*.exe" -o -name "*.AppImage" -o -name "*.deb" \) -exec shasum -a 256 {} + > release_checksums.txt
  cat release_checksums.txt
fi

echo "✅ Release Build Completed Successfully!"
