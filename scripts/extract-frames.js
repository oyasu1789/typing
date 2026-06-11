const fs = require("fs");
const zlib = require("zlib");

const PNG_SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const MOTIONS = ["idle", "punch", "kick", "guard", "hit", "ko"];
const motions = process.env.FRAME_MOTIONS ? process.env.FRAME_MOTIONS.split(",") : MOTIONS;
const [, , inputPath, outputPrefix] = process.argv;

if (!inputPath || !outputPrefix) {
  console.error("Usage: node scripts/extract-frames.js <sheet.png> <output-prefix>");
  process.exit(1);
}

const image = decodePng(fs.readFileSync(inputPath));
const components = findCharacterComponents(image).slice(0, motions.length);

if (components.length !== motions.length) {
  throw new Error(`Expected ${motions.length} character components, found ${components.length}`);
}

components.forEach((box, index) => {
  const frame = cropToFrame(image, box, 520, 760);
  fs.writeFileSync(`${outputPrefix}-${motions[index]}.png`, encodePng(frame.width, frame.height, frame.pixels));
});

function findCharacterComponents(image) {
  const seen = new Uint8Array(image.width * image.height);
  const components = [];

  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const start = y * image.width + x;
      if (seen[start] || alphaAt(image, x, y) <= 20) continue;

      const queue = [start];
      const pixels = [];
      let cursor = 0;
      let minX = x;
      let maxX = x;
      let minY = y;
      let maxY = y;
      let count = 0;
      seen[start] = 1;

      while (cursor < queue.length) {
        const current = queue[cursor];
        cursor += 1;
        const cx = current % image.width;
        const cy = Math.floor(current / image.width);
        count += 1;
        pixels.push(current);
        minX = Math.min(minX, cx);
        maxX = Math.max(maxX, cx);
        minY = Math.min(minY, cy);
        maxY = Math.max(maxY, cy);

        for (const [nx, ny] of [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]]) {
          if (nx < 0 || ny < 0 || nx >= image.width || ny >= image.height) continue;
          const next = ny * image.width + nx;
          if (!seen[next] && alphaAt(image, nx, ny) > 20) {
            seen[next] = 1;
            queue.push(next);
          }
        }
      }

      if (count > 500) components.push({ minX, maxX, minY, maxY, count, pixels });
    }
  }

  return components.sort((a, b) => a.minX - b.minX);
}

function cropToFrame(image, box, width, height) {
  const out = Buffer.alloc(width * height * 4);
  const sourceWidth = box.maxX - box.minX + 1;
  const sourceHeight = box.maxY - box.minY + 1;
  const padX = Math.max(18, Math.floor(sourceWidth * 0.06));
  const padTop = 26;
  const padBottom = 14;
  const crop = {
    x: Math.max(0, box.minX - padX),
    y: Math.max(0, box.minY - padTop),
    width: Math.min(image.width, box.maxX + padX + 1) - Math.max(0, box.minX - padX),
    height: Math.min(image.height, box.maxY + padBottom + 1) - Math.max(0, box.minY - padTop),
  };
  const dstX = Math.floor((width - crop.width) / 2);
  const dstY = height - crop.height - 10;

  for (const point of box.pixels) {
    const sx = point % image.width;
    const sy = Math.floor(point / image.width);
    const dx = dstX + sx - crop.x;
    const dy = dstY + sy - crop.y;
    if (dx < 0 || dy < 0 || dx >= width || dy >= height) continue;
    const src = (sy * image.width + sx) * 4;
    const dst = (dy * width + dx) * 4;
    out[dst] = image.pixels[src];
    out[dst + 1] = image.pixels[src + 1];
    out[dst + 2] = image.pixels[src + 2];
    out[dst + 3] = image.pixels[src + 3];
  }

  return { width, height, pixels: out };
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

function alphaAt(image, x, y) {
  return image.pixels[(y * image.width + x) * 4 + 3];
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
