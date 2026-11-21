import zlib
import struct
import math
import os

def create_png(width, height, rgba_data, filename):
    def chunk(chunk_type, data):
        c = chunk_type + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)

    raw_data = bytearray()
    row_bytes = width * 4
    for y in range(height):
        raw_data.append(0) # filter: none
        offset = y * row_bytes
        raw_data.extend(rgba_data[offset : offset + row_bytes])

    compressed = zlib.compress(bytes(raw_data), 9)
    ihdr = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    png = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', ihdr) + chunk(b'IDAT', compressed) + chunk(b'IEND', b'')
    with open(filename, 'wb') as f:
        f.write(png)

def render_icon(size, filename, is_maskable=False):
    pixels = bytearray(size * size * 4)
    cx, cy = size / 2.0, size / 2.0
    scale = size / 512.0

    bg_dark = (6, 28, 56)       # #061c38
    bg_blue = (6, 63, 120)      # #063F78
    accent_cyan = (2, 132, 199) # #0284c7
    border_blue = (56, 189, 248)# #38bdf8

    center_offset_y = 12.0 * scale
    radius = (200.0 if not is_maskable else 165.0) * scale

    for y in range(size):
        for x in range(size):
            idx = (y * size + x) * 4
            dx = x - cx
            dy = y - cy
            dist = math.sqrt(dx * dx + dy * dy)

            if is_maskable:
                t_bg = (y / float(size))
                r = int(bg_dark[0] * (1 - t_bg) + bg_blue[0] * t_bg)
                g = int(bg_dark[1] * (1 - t_bg) + bg_blue[1] * t_bg)
                b = int(bg_dark[2] * (1 - t_bg) + bg_blue[2] * t_bg)
                a = 255
            else:
                edge_pad = 20.0 * scale
                corner_r = 105.0 * scale
                clamped_x = max(edge_pad + corner_r, min(size - edge_pad - corner_r, x))
                clamped_y = max(edge_pad + corner_r, min(size - edge_pad - corner_r, y))
                corner_dist = math.sqrt((x - clamped_x)**2 + (y - clamped_y)**2)
                if corner_dist > corner_r:
                    alpha_corner = max(0.0, min(1.0, corner_r + 1.0 - corner_dist))
                else:
                    alpha_corner = 1.0

                if alpha_corner <= 0.0:
                    pixels[idx:idx+4] = b'\x00\x00\x00\x00'
                    continue

                t_bg = (y / float(size))
                r = int(bg_dark[0] * (1 - t_bg) + bg_blue[0] * t_bg)
                g = int(bg_dark[1] * (1 - t_bg) + bg_blue[1] * t_bg)
                b = int(bg_dark[2] * (1 - t_bg) + bg_blue[2] * t_bg)
                a = int(255 * alpha_corner)

            # Center circular plate
            if dist <= radius:
                t_circ = dist / radius
                glow_r = int(14 * (1 - t_circ) + bg_blue[0] * t_circ)
                glow_g = int(116 * (1 - t_circ) + bg_blue[1] * t_circ)
                glow_b = int(200 * (1 - t_circ) + bg_blue[2] * t_circ)
                r = int(r * 0.25 + glow_r * 0.75)
                g = int(g * 0.25 + glow_g * 0.75)
                b = int(b * 0.25 + glow_b * 0.75)

            # Circular ring border
            if abs(dist - radius) <= 3.0 * scale:
                t_ring = 1.0 - abs(dist - radius) / (3.0 * scale)
                r = int(r * (1 - t_ring) + border_blue[0] * t_ring)
                g = int(g * (1 - t_ring) + border_blue[1] * t_ring)
                b = int(b * (1 - t_ring) + border_blue[2] * t_ring)

            # Bottle geometry
            bx = (x - cx) / scale
            by = (y - (cy - center_offset_y)) / scale

            in_bottle = False
            # Top cap
            if -118 <= by <= -102 and abs(bx) <= 44:
                in_bottle = True
            # Neck
            elif -102 <= by <= -62 and abs(bx) <= 32:
                in_bottle = True
            # Shoulders
            elif -62 < by < -16:
                t_sh = (by - (-62)) / 46.0
                sh_w = 32.0 + (90.0 - 32.0) * math.sin(t_sh * math.pi / 2.0)
                if abs(bx) <= sh_w:
                    in_bottle = True
            # Body
            elif -16 <= by <= 104:
                if by > (104 - 24):
                    bot_cx = 90.0 - 24.0 if bx > 0 else -(90.0 - 24.0)
                    bot_cy = 104.0 - 24.0
                    if abs(bx) > (90.0 - 24.0):
                        cdist = math.sqrt((abs(bx) - (90.0 - 24.0))**2 + (by - bot_cy)**2)
                        if cdist <= 24.0:
                            in_bottle = True
                    else:
                        in_bottle = True
                elif abs(bx) <= 90:
                    in_bottle = True

            # Drop inside bottle
            in_drop = False
            dx_d = bx
            dy_d = by - 36.0
            d_dist = math.sqrt(dx_d * dx_d + (dy_d - 6)**2)
            if d_dist <= 26:
                in_drop = True
            elif dy_d < 6 and dy_d > -40:
                half_w = 26.0 * (1.0 - (6 - dy_d) / 46.0)
                if abs(dx_d) <= half_w:
                    in_drop = True

            if in_bottle:
                if in_drop:
                    r = accent_cyan[0]
                    g = accent_cyan[1]
                    b = accent_cyan[2]
                else:
                    t_shading = (by + 118.0) / 222.0
                    r = int(255 - t_shading * 10)
                    g = int(255 - t_shading * 6)
                    b = 255

            pixels[idx] = max(0, min(255, r))
            pixels[idx + 1] = max(0, min(255, g))
            pixels[idx + 2] = max(0, min(255, b))
            pixels[idx + 3] = max(0, min(255, a))

    create_png(size, size, pixels, filename)
    print(f"Generated: {filename} ({size}x{size})")

os.makedirs('public/icons', exist_ok=True)
render_icon(512, 'public/icons/icon-512.png', is_maskable=False)
render_icon(192, 'public/icons/icon-192.png', is_maskable=False)
render_icon(512, 'public/icons/icon-maskable-512.png', is_maskable=True)
render_icon(192, 'public/icons/icon-maskable-192.png', is_maskable=True)
render_icon(180, 'public/icons/apple-touch-icon.png', is_maskable=False)
print("All PNG icons generated successfully!")
