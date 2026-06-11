const fs = require("fs");
const zlib = require("zlib");

const PNG_SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const files = process.argv.slice(2);

if (!files.length) {
  console.error("Usage: node scripts/cleanup-green-fringe.js <png> [...]");
  process.exit(1);
}

for (const file of files) {
  const image = decodePng(fs.readFileSync(file));
  for (let i = 0; i < image.pixels.length; i += 4) {
    const r = image.pixels[i];
    const g = image.pixels[i + 1];
    const b = image.pixels[i + 2];
    const a = image.pixels[i + 3];
    if (!a) continue;

    const greenDominance = g - Math.max(r, b);
    if (greenDominance <= 18) continue;

    if (g > 150 && greenDominance > 58) {
      image.pixels[i + 3] = Math.max(0, a - greenDominance * 3);
    }

    const neutral = Math.round((r + b) / 2);
    image.pixels[i + 1] = clampByte(g - greenDominance * 0.86);
    image.pixels[i] = clampByte(r + Math.max(0, neutral - r) * 0.12);
    image.pixels[i + 2] = clampByte(b + Math.max(0, neutral - b) * 0.08);
  }
  fs.writeFileSync(file, encodePng(image.width, image.height, image.pixels));
  console.log(`cleaned ${file}`);
}

function decodePng(buffer) {
  if (!buffer.subarray(0, 8).equals(PNG_SIG)) throw new Error("Not a PNG file");
  let offset = 8;
  let header = null;
  const idat = [];

  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    offset += 12 + length;
    if (type === "IHDR") {
      header = { width: data.readUInt32BE(0), height: data.readUInt32BE(4), bitDepth: data[8], colorType: data[9] };
    } else if (type === "IDAT") {
      idat.push(data);
    } else if (type === "IEND") {
      break;
    }
  }

  if (!header || header.bitDepth !== 8 || header.colorType !== 6) {
    throw new Error("Only 8-bit RGBA PNG input is supported");
  }

  const stride = header.width * 4;
  const inflated = zlib.inflateSync(Buffer.concat(idat));
  const pixels = Buffer.alloc(header.width * header.height * 4);
  let src = 0;
  let dst = 0;
  let previous = Buffer.alloc(stride);

  for (let y = 0; y < header.height; y += 1) {
    const filter = inflated[src];
    src += 1;
    const row = Buffer.from(inflated.subarray(src, src + stride));
    src += stride;
    unfilter(row, previous, 4, filter);
    row.copy(pixels, dst);
    dst += stride;
    previous = row;
  }

  return { ...header, pixels };
}

function unfilter(row, previous, bpp, filter) {
  for (let x = 0; x < row.length; x += 1) {
    const left = x >= bpp ? row[x - bpp] : 0;
    const up = previous[x] || 0;
    const upLeft = x >= bpp ? previous[x - bpp] || 0 : 0;
    if (filter === 1) row[x] = (row[x] + left) & 255;
    else if (filter === 2) row[x] = (row[x] + up) & 255;
    else if (filter === 3) row[x] = (row[x] + Math.floor((left + up) / 2)) & 255;
    else if (filter === 4) row[x] = (row[x] + paeth(left, up, upLeft)) & 255;
    else if (filter !== 0) throw new Error(`Unsupported filter ${filter}`);
  }
}

function encodePng(width, height, rgba) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  return Buffer.concat([PNG_SIG, chunk("IHDR", ihdr(width, height)), chunk("IDAT", zlib.deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))]);
}

function ihdr(width, height) {
  const out = Buffer.alloc(13);
  out.writeUInt32BE(width, 0);
  out.writeUInt32BE(height, 4);
  out[8] = 8;
  out[9] = 6;
  return out;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

function clampByte(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}
