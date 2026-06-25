#!/usr/bin/env bash
# Generate Android launcher icons from public/logo.png (same as web app).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOGO="$ROOT/public/logo.png"
RES="$ROOT/android/app/src/main/res"

if [[ ! -f "$LOGO" ]]; then
  echo "Missing $LOGO"
  exit 1
fi

generate() {
  local folder="$1"
  local size="$2"
  local out="$RES/$folder"
  mkdir -p "$out"
  sips -z "$size" "$size" "$LOGO" --out "$out/ic_launcher.png" >/dev/null
  cp "$out/ic_launcher.png" "$out/ic_launcher_round.png"
  sips -z "$size" "$size" "$LOGO" --out "$out/ic_launcher_foreground.png" >/dev/null
  echo "  $folder → ${size}px"
}

echo "Generating launcher icons from public/logo.png…"
generate mipmap-mdpi 48
generate mipmap-hdpi 72
generate mipmap-xhdpi 96
generate mipmap-xxhdpi 144
generate mipmap-xxxhdpi 192
echo "Done."
