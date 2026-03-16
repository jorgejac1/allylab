#!/usr/bin/env node
// Generate icon PNGs from SVG
// Requires: npm install canvas (or use browser dev tools to export)
// For now, creates placeholder files
const fs = require('fs');
const path = require('path');

// Minimal valid 1x1 transparent PNG
const PNG_HEADER = Buffer.from([
  0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
  0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, // RGBA, etc
  0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41, 0x54, // IDAT chunk
  0x78, 0x9C, 0x62, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, 0xE5, // compressed data
  0x27, 0xDE, 0xFC, // CRC
  0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, // IEND
  0xAE, 0x42, 0x60, 0x82  // CRC
]);

const sizes = [16, 32, 48, 128];
const iconsDir = path.join(__dirname);

for (const size of sizes) {
  const filename = `icon${size}.png`;
  fs.writeFileSync(path.join(iconsDir, filename), PNG_HEADER);
  console.log(`Created placeholder: ${filename} (replace with ${size}x${size} icon)`);
}

console.log('\nTo generate proper icons:');
console.log('1. Open icons/icon.svg in a browser');
console.log('2. Export as PNG at each size (16, 32, 48, 128)');
console.log('3. Save as icon16.png, icon32.png, icon48.png, icon128.png');
