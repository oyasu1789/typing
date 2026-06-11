const fs = require("fs");
const zlib = require("zlib");

const PNG_SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

const [, , inputPath, outputPath] = process.argv;

if (!inputPath || !outputPath) {
  console.error("Usage: node scripts/chroma-key.js <input.png> <output.png>");
  process.exit(1);
}

const input = fs.readFileSync(inputPath);
const image = decodePng(input);
const key = sampleBorderKey(image);
const rgba = removeKey(image, key);
fs.writeFileSync(outputPath, encodePng(image.width, image.height, rgba));

function decodePng(buffer) {
  if (!buffer.subarray(0, 8).equals(PNG_SIG)) throw new Error("Not a PNG file");

  let offset = 8;
  let ihdr = null;
  const idat = [];

  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    offset += 12 + length;

    if (type === "IHDR") {
      ihdr = {
        width: data.readUInt32BE(0),
        height: data.readUInt32BE(4),
        bitDepth: data[8],
        colorType: data[9],
      };
    } else if (type === "IDAT") {
      idat.push(data);
    } else if (type === "IEND") {
      break;
    }
  }

  if (!ihdr) throw new Error("IHDR missing");
  if (ihdr.bitDepth !== 8 || ![2, 6].includes(ihdr.colorType)) {
    throw new Error(`Unsupported PNG format: bitDepth=${ihdr.bitDepth}, colorType=${ihdr.colorType}`);
  }

  const channels = ihdr.colorType === 6 ? 4 : 3;
  const stride = ihdr.width * channels;
  const inflated = zlib.inflateSync(Buffer.concat(idat));
  const pixels = Buffer.alloc(ihdr.width * ihdr.height * channels);

  let src = 0;
  let dst = 0;
  let previous = Buffer.alloc(stride);

  for (let y = 0; y < ihdr.height; y += 1) {
    const filter = inflated[src];
    src += 1;
    const row = Buffer.from(inflated.subarray(src, src + stride));
    src += stride;
    unfilter(row, previous, channels, filter);
    row.copy(pixels, dst);
    dst += stride;
    previous = row;
  }

  return { ...ihdr, channels, pixels };
}

function unfilter(row, previous, bpp, filter) {
  for (let x = 0; x < row.length; x += 1) {
    const left = x >= bpp ? row[x - bpp] : 0;
    const up = previous[x] || 0;
    const upLeft = x >= bpp ? previous[x - bpp] || 0 : 0;
    let value = row[x];

    if (filter === 1) value += left;
    else if (filter === 2) value += up;
    else if (filter === 3) value += Math.floor((left + up) / 2);
    else if (filter === 4) value += paeth(left, up, upLeft);
    else if (filter !== 0) throw new Error(`Unsupported filter ${filter}`);

    row[x] = value & 255;
  }
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

function sampleBorderKey(image) {
  const samples = [];
  const step = Math.max(1, Math.floor(Math.min(image.width, image.height) / 80));

  for (let x = 0; x < image.width; x += step) {
    samples.push(pixelAt(image, x, 0), pixelAt(image, x, image.height - 1));
  }
  for (let y = 0; y < image.height; y += step) {
    samples.push(pixelAt(image, 0, y), pixelAt(image, image.width - 1, y));
  }

  const brightGreen = samples.filter(([r, g, b]) => g > 160 && g > r * 1.5 && g > b * 1.5);
  const source = brightGreen.length ? brightGreen : samples;
  const sum = source.reduce((acc, color) => {
    acc[0] += color[0];
    acc[1] += color[1];
    acc[2] += color[2];
    return acc;
  }, [0, 0, 0]);
  return sum.map((value) => Math.round(value / source.length));
}

function pixelAt(image, x, y) {
  const index = (y * image.width + x) * image.channels;
  return [image.pixels[index], image.pixels[index + 1], image.pixels[index + 2]];
}

function removeKey(image, key) {
  const out = Buffer.alloc(image.width * image.height * 4);
  const transparentDistance = 42;
  const opaqueDistance = 155;

  for (let src = 0, dst = 0; src < image.pixels.length; src += image.channels, dst += 4) {
    const r = image.pixels[src];
    const g = image.pixels[src + 1];
    const b = image.pixels[src + 2];
    const sourceAlpha = image.channels === 4 ? image.pixels[src + 3] : 255;
    const distance = Math.hypot(r - key[0], g - key[1], b - key[2]);
    let alpha = 255;

    if (distance <= transparentDistance) {
      alpha = 0;
    } else if (distance < opaqueDistance && g > r * 1.18 && g > b * 1.18) {
      alpha = Math.round(255 * ((distance - transparentDistance) / (opaqueDistance - transparentDistance)));
    }

    const spill = alpha < 255 ? Math.max(0, 1 - alpha / 255) : 0;
    out[dst] = clampByte(r + (key[1] - g) * 0.08 * spill);
    out[dst + 1] = clampByte(g - Math.max(0, g - Math.max(r, b)) * 0.72 * spill);
    out[dst + 2] = clampByte(b + (key[1] - g) * 0.04 * spill);
    out[dst + 3] = Math.round(alpha * (sourceAlpha / 255));
  }

  return out;
}

function encodePng(width, height, rgba) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  const chunks = [
    chunk("IHDR", ihdr(width, height)),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ];
  return Buffer.concat([PNG_SIG, ...chunks]);
}

function ihdr(width, height) {
  const out = Buffer.alloc(13);
  out.writeUInt32BE(width, 0);
  out.writeUInt32BE(height, 4);
  out[8] = 8;
  out[9] = 6;
  out[10] = 0;
  out[11] = 0;
  out[12] = 0;
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
    for (let i = 0; i < 8; i += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function clampByte(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}
