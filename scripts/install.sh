#!/bin/sh
# VibeGrid installer — detects OS/arch and downloads the right release.
#
#   curl -fsSL https://vibegrid.vercel.app/install.sh | sh
#
set -e

VERSION="${VIBEGRID_VERSION:-0.1.0}"
BASE_URL="${VIBEGRID_BASE_URL:-https://github.com/abuzarkhan1/VibeGrid/releases/download/v${VERSION}}"
DEST_DIR="${VIBEGRID_DEST:-$HOME/Downloads}"

echo "VibeGrid installer v${VERSION}"

OS="$(uname -s)"
ARCH="$(uname -m)"

case "$OS" in
  Darwin)
    # One universal DMG runs on BOTH Apple Silicon (M-series) and Intel Macs —
    # the release pipeline lipos aarch64 + x86_64 into a single binary.
    ASSET="VibeGrid_${VERSION}_universal.dmg"
    ;;
  MINGW*|MSYS*|CYGWIN*)
    case "$ARCH" in
      x86_64) ASSET="VibeGrid_${VERSION}_x64-setup.exe" ;;
      arm64)  ASSET="VibeGrid_${VERSION}_arm64-setup.exe" ;;
      *) echo "Unsupported Windows architecture: $ARCH" >&2; exit 1 ;;
    esac
    ;;
  Linux)
    case "$ARCH" in
      x86_64)              ASSET="VibeGrid_${VERSION}_amd64.AppImage" ;;
      aarch64|arm64)       ASSET="VibeGrid_${VERSION}_aarch64.AppImage" ;;
      *) echo "Unsupported Linux architecture: $ARCH" >&2; exit 1 ;;
    esac
    ;;
  *)
    echo "Unsupported OS: $OS" >&2
    exit 1
    ;;
esac

URL="${BASE_URL}/${ASSET}"
mkdir -p "$DEST_DIR"
OUT="$DEST_DIR/$ASSET"

echo "Downloading $URL"
if command -v curl >/dev/null 2>&1; then
  curl -fSL "$URL" -o "$OUT"
elif command -v wget >/dev/null 2>&1; then
  wget -O "$OUT" "$URL"
else
  echo "Need curl or wget to download." >&2
  exit 1
fi

echo "Saved to $OUT"

case "$OS" in
  Darwin) echo "Mount the DMG and drag VibeGrid.app into Applications:" ;;
  Linux)  chmod +x "$OUT" 2>/dev/null || true; echo "The AppImage is executable — run it directly:" ;;
  *)      echo "Run the installer to complete setup:" ;;
esac
echo "  open \"$OUT\"   # macOS"
echo "  \"$OUT\"        # Windows / Linux (AppImage)"
echo
echo "Then launch with:  vibegrid open"
