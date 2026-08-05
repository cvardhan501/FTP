const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

// Pure Node PNG generator to build valid 192x192 and 512x512 PNG icons for Chrome PWA
function createPngBuffer(width, height, r, g, b) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR Chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth
  ihdr[9] = 2; // Truecolor (RGB)
  ihdr[10] = 0; // Compression
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace

  const ihdrChunk = createChunk("IHDR", ihdr);

  // IDAT Chunk (Raw RGB Image Data)
  const rowSize = 1 + width * 3;
  const rawData = Buffer.alloc(height * rowSize);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // No filter
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 3;
      // Gradient background from Dark Blue to Purple
      const factor = (x + y) / (width + height);
      rawData[pixelOffset] = Math.min(255, Math.floor(r * (1 - factor * 0.3)));
      rawData[pixelOffset + 1] = Math.min(255, Math.floor(g * (1 - factor * 0.2)));
      rawData[pixelOffset + 2] = Math.min(255, Math.floor(b + factor * 50));
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = createChunk("IDAT", compressedData);

  // IEND Chunk
  const iendChunk = createChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(8 + len + 4);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, "ascii");
  data.copy(buf, 8);

  const crc = crc32(buf.slice(4, 8 + len));
  buf.writeUInt32BE(crc, 8 + len);
  return buf;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    let byte = buf[i];
    crc ^= byte;
    for (let j = 0; j < 8; j++) {
      if (crc & 1) {
        crc = (crc >>> 1) ^ 0xedb88320;
      } else {
        crc = crc >>> 1;
      }
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const publicDir = path.join(__dirname, "..", "public");

const icon192 = createPngBuffer(192, 192, 59, 130, 246);
fs.writeFileSync(path.join(publicDir, "icon-192.png"), icon192);
console.log("✅ Created public/icon-192.png");

const icon512 = createPngBuffer(512, 512, 99, 102, 241);
fs.writeFileSync(path.join(publicDir, "icon-512.png"), icon512);
console.log("✅ Created public/icon-512.png");
