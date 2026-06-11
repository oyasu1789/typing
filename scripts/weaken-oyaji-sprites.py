#!/usr/bin/env python3
import os
import struct
import zlib
from collections import deque


PNG_SIG = b"\x89PNG\r\n\x1a\n"
ASSETS = [
    "oyaji-idle.png",
    "oyaji-punch.png",
    "oyaji-kick.png",
    "oyaji-guard.png",
    "oyaji-hit.png",
    "oyaji-ko.png",
]


def read_png(path):
    with open(path, "rb") as f:
        data = f.read()
    if not data.startswith(PNG_SIG):
        raise ValueError(f"{path} is not a PNG")

    pos = len(PNG_SIG)
    width = height = None
    color_type = bit_depth = None
    idat = []

    while pos < len(data):
      length = struct.unpack(">I", data[pos:pos + 4])[0]
      ctype = data[pos + 4:pos + 8]
      chunk = data[pos + 8:pos + 8 + length]
      pos += 12 + length

      if ctype == b"IHDR":
          width, height, bit_depth, color_type, _, _, _ = struct.unpack(">IIBBBBB", chunk)
      elif ctype == b"IDAT":
          idat.append(chunk)
      elif ctype == b"IEND":
          break

    if bit_depth != 8 or color_type != 6:
        raise ValueError(f"{path} must be 8-bit RGBA PNG")

    raw = zlib.decompress(b"".join(idat))
    stride = width * 4
    rows = []
    prev = [0] * stride
    offset = 0

    for _ in range(height):
        ftype = raw[offset]
        offset += 1
        row = list(raw[offset:offset + stride])
        offset += stride
        out = [0] * stride

        for i, value in enumerate(row):
            left = out[i - 4] if i >= 4 else 0
            up = prev[i]
            up_left = prev[i - 4] if i >= 4 else 0
            if ftype == 0:
                recon = value
            elif ftype == 1:
                recon = value + left
            elif ftype == 2:
                recon = value + up
            elif ftype == 3:
                recon = value + ((left + up) // 2)
            elif ftype == 4:
                p = left + up - up_left
                pa = abs(p - left)
                pb = abs(p - up)
                pc = abs(p - up_left)
                pr = left if pa <= pb and pa <= pc else up if pb <= pc else up_left
                recon = value + pr
            else:
                raise ValueError(f"unsupported PNG filter {ftype}")
            out[i] = recon & 255

        rows.append(out)
        prev = out

    return width, height, rows


def write_png(path, width, height, rows):
    raw = bytearray()
    for row in rows:
        raw.append(0)
        raw.extend(row)

    def chunk(ctype, payload):
        crc = zlib.crc32(ctype + payload) & 0xffffffff
        return struct.pack(">I", len(payload)) + ctype + payload + struct.pack(">I", crc)

    ihdr = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    data = PNG_SIG
    data += chunk(b"IHDR", ihdr)
    data += chunk(b"IDAT", zlib.compress(bytes(raw), 9))
    data += chunk(b"IEND", b"")
    with open(path, "wb") as f:
        f.write(data)


def alpha_bbox(width, height, rows):
    xs = []
    ys = []
    for y, row in enumerate(rows):
        for x in range(width):
            if row[x * 4 + 3] > 16:
                xs.append(x)
                ys.append(y)
    return min(xs), min(ys), max(xs), max(ys)


def sample(rows, width, height, x, y):
    x = max(0, min(width - 1, x))
    y = max(0, min(height - 1, y))
    row = rows[y]
    i = x * 4
    return row[i:i + 4]


def narrow(width, height, rows, scale=0.84):
    left, top, right, bottom = alpha_bbox(width, height, rows)
    center = (left + right) / 2
    out = [[0] * (width * 4) for _ in range(height)]

    for y in range(height):
        for x in range(width):
            src_x = center + (x - center) / scale
            if src_x < 0 or src_x >= width - 1:
                continue
            x0 = int(src_x)
            t = src_x - x0
            p0 = sample(rows, width, height, x0, y)
            p1 = sample(rows, width, height, x0 + 1, y)
            rgba = [round(p0[c] * (1 - t) + p1[c] * t) for c in range(4)]
            i = x * 4
            out[y][i:i + 4] = rgba
    return out


def is_skin(row, x):
    i = x * 4
    r, g, b, a = row[i:i + 4]
    return a > 80 and r > 160 and g > 95 and b > 55 and r > g + 18 and g > b + 12


def find_face(width, height, rows):
    left, top, right, bottom = alpha_bbox(width, height, rows)
    y_limit = top + int((bottom - top) * 0.48)
    visited = set()
    best = None

    for y in range(top, min(bottom + 1, y_limit)):
        row = rows[y]
        for x in range(left, right + 1):
            if (x, y) in visited or not is_skin(row, x):
                continue
            q = deque([(x, y)])
            visited.add((x, y))
            xs = []
            ys = []
            while q:
                cx, cy = q.popleft()
                xs.append(cx)
                ys.append(cy)
                for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                    if nx < left or nx > right or ny < top or ny >= y_limit or (nx, ny) in visited:
                        continue
                    if is_skin(rows[ny], nx):
                        visited.add((nx, ny))
                        q.append((nx, ny))
            area = len(xs)
            if area < 90:
                continue
            bbox = (min(xs), min(ys), max(xs), max(ys))
            width_score = bbox[2] - bbox[0]
            y_score = bottom - bbox[1]
            score = area + width_score * 8 + y_score * 0.2
            if best is None or score > best[0]:
                best = (score, bbox)

    return best[1] if best else None


def draw_pixel(rows, width, height, x, y, rgba):
    if 0 <= x < width and 0 <= y < height:
        i = x * 4
        rows[y][i:i + 4] = rgba


def draw_line(rows, width, height, x0, y0, x1, y1, rgba, thickness=2):
    dx = abs(x1 - x0)
    dy = -abs(y1 - y0)
    sx = 1 if x0 < x1 else -1
    sy = 1 if y0 < y1 else -1
    err = dx + dy
    while True:
        for oy in range(-thickness, thickness + 1):
            for ox in range(-thickness, thickness + 1):
                if ox * ox + oy * oy <= thickness * thickness:
                    draw_pixel(rows, width, height, x0 + ox, y0 + oy, rgba)
        if x0 == x1 and y0 == y1:
            break
        e2 = 2 * err
        if e2 >= dy:
            err += dy
            x0 += sx
        if e2 <= dx:
            err += dx
            y0 += sy


def draw_ellipse(rows, width, height, cx, cy, rx, ry, rgba):
    for deg in range(360):
        import math
        x = round(cx + math.cos(math.radians(deg)) * rx)
        y = round(cy + math.sin(math.radians(deg)) * ry)
        draw_pixel(rows, width, height, x, y, rgba)
        draw_pixel(rows, width, height, x + 1, y, rgba)


def add_glasses(width, height, rows):
    face = find_face(width, height, rows)
    if not face:
        return
    x0, y0, x1, y1 = face
    fw = max(20, x1 - x0)
    fh = max(20, y1 - y0)
    cy = y0 + int(fh * 0.43)
    rx = max(6, int(fw * 0.13))
    ry = max(4, int(fh * 0.08))
    left_cx = x0 + int(fw * 0.40)
    right_cx = x0 + int(fw * 0.62)
    ink = [20, 22, 24, 255]

    draw_ellipse(rows, width, height, left_cx, cy, rx, ry, ink)
    draw_ellipse(rows, width, height, right_cx, cy, rx, ry, ink)
    draw_line(rows, width, height, left_cx + rx, cy, right_cx - rx, cy, ink, 1)
    draw_line(rows, width, height, x0 + int(fw * 0.22), cy - 1, left_cx - rx, cy, ink, 1)
    draw_line(rows, width, height, right_cx + rx, cy, x1 - int(fw * 0.08), cy - 1, ink, 1)


def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    asset_dir = os.path.join(root, "assets")
    backup_dir = os.path.join(asset_dir, "oyaji-original")
    os.makedirs(backup_dir, exist_ok=True)

    for name in ASSETS:
        path = os.path.join(asset_dir, name)
        backup = os.path.join(backup_dir, name)
        if not os.path.exists(backup):
            with open(path, "rb") as src, open(backup, "wb") as dst:
                dst.write(src.read())
        width, height, rows = read_png(backup)
        edited = narrow(width, height, rows)
        add_glasses(width, height, edited)
        write_png(path, width, height, edited)
        print(f"updated {name}")


if __name__ == "__main__":
    main()
