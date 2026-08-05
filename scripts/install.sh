#!/bin/sh
# VibeGrid installer — detects OS/arch and downloads the right release.
#
#   curl -fsSL https://vibegrid.vercel.app/install.sh | sh
#
set -e

VERSION="${VIBEGRID_VERSION:-0.1.0}"
# GitHub release TAG is decoupled from the app VERSION: the v1 release tag
# ships the 0.1.0 asset (VibeGrid_0.1.0_aarch64.dmg). VERSION names the asset
# file; TAG names the release tag in the download URL.
TAG="${VIBEGRID_TAG:-1}"
BASE_URL="${VIBEGRID_BASE_URL:-https://github.com/abuzarkhan1/VibeGrid/releases/download/v${TAG}}"
DEST_DIR="${VIBEGRID_DEST:-$HOME/Downloads}"

echo "VibeGrid installer v${VERSION} (release tag v${TAG})"

OS="$(uname -s)"
ARCH="$(uname -m)"

case "$OS" in
  Darwin)
    # Latest release ships an Apple Silicon (M-series) build only.
    case "$ARCH" in
      arm64) ASSET="VibeGrid_${VERSION}_aarch64.dmg" ;;
      x86_64)
        echo "VibeGrid for Intel Macs is not available in this release yet." >&2
        echo "See https://github.com/abuzarkhan1/VibeGrid/releases for available builds." >&2
        exit 1
        ;;
      *) echo "Unsupported macOS architecture: $ARCH" >&2; exit 1 ;;
    esac
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
