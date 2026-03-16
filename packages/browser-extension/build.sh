#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DIST_DIR="$SCRIPT_DIR/dist"
ZIP_NAME="allylab-extension.zip"

echo "Building AllyLab Browser Extension..."

# Clean
rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

# Copy files
cp "$SCRIPT_DIR/manifest.json" "$DIST_DIR/"
cp "$SCRIPT_DIR/popup.html" "$DIST_DIR/"
cp "$SCRIPT_DIR/popup.js" "$DIST_DIR/"
cp "$SCRIPT_DIR/popup.css" "$DIST_DIR/"
cp "$SCRIPT_DIR/options.html" "$DIST_DIR/"
cp "$SCRIPT_DIR/options.js" "$DIST_DIR/"

# Copy icons
mkdir -p "$DIST_DIR/icons"
cp "$SCRIPT_DIR/icons/"*.png "$DIST_DIR/icons/" 2>/dev/null || echo "Warning: No icon PNGs found"

# Create ZIP
cd "$DIST_DIR"
zip -r "../$ZIP_NAME" . -x "*.DS_Store"
cd "$SCRIPT_DIR"

echo "Build complete!"
echo "  Output: $DIST_DIR/"
echo "  ZIP: $ZIP_NAME"
echo ""
echo "To upload to Chrome Web Store:"
echo "  1. Go to https://chrome.google.com/webstore/devconsole"
echo "  2. Click 'New Item' and upload $ZIP_NAME"
