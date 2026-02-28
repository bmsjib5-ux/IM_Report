"""Generate app icon for IM Report Dashboard"""
from PIL import Image, ImageDraw, ImageFont
import os

SIZE = 512
OUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'public')
os.makedirs(OUT_DIR, exist_ok=True)

# Create base image
img = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)

# Background - rounded rectangle (gradient-like effect with two colors)
# Main background circle
cx, cy = SIZE // 2, SIZE // 2
r = SIZE // 2 - 8

# Draw gradient background (indigo to blue)
for i in range(r, 0, -1):
    ratio = i / r
    # From indigo (#4F46E5) to blue (#2563EB)
    red = int(79 * ratio + 37 * (1 - ratio))
    green = int(70 * ratio + 99 * (1 - ratio))
    blue = int(229 * ratio + 235 * (1 - ratio))
    draw.ellipse([cx - i, cy - i, cx + i, cy + i], fill=(red, green, blue, 255))

# Draw document icon (white)
doc_left = SIZE * 0.28
doc_top = SIZE * 0.18
doc_right = SIZE * 0.62
doc_bottom = SIZE * 0.82
fold_size = SIZE * 0.1

# Document body
doc_points = [
    (doc_left, doc_top + fold_size),
    (doc_left, doc_bottom),
    (doc_right, doc_bottom),
    (doc_right, doc_top),
    (doc_right - fold_size, doc_top),
    (doc_left, doc_top + fold_size),
]
draw.polygon(doc_points, fill=(255, 255, 255, 230))

# Document fold
fold_points = [
    (doc_right - fold_size, doc_top),
    (doc_right, doc_top),
    (doc_right - fold_size, doc_top + fold_size),
]
draw.polygon(fold_points, fill=(200, 210, 240, 200))

# Lines on document
line_y_start = doc_top + fold_size + SIZE * 0.06
line_left = doc_left + SIZE * 0.05
line_right = doc_right - SIZE * 0.05
line_h = SIZE * 0.02

for i in range(4):
    y = line_y_start + i * (SIZE * 0.065)
    w = line_right if i < 2 else line_right - SIZE * 0.08
    draw.rounded_rectangle(
        [line_left, y, w, y + line_h],
        radius=2,
        fill=(79, 70, 229, 80)
    )

# Bar chart on the right side
bar_left = SIZE * 0.58
bar_bottom = SIZE * 0.78
bar_width = SIZE * 0.06
bar_gap = SIZE * 0.03
bar_heights = [SIZE * 0.18, SIZE * 0.30, SIZE * 0.22, SIZE * 0.38]
bar_colors = [
    (52, 211, 153, 255),   # emerald
    (96, 165, 250, 255),   # blue
    (251, 191, 36, 255),   # amber
    (129, 140, 248, 255),  # indigo
]

for i, (h, color) in enumerate(zip(bar_heights, bar_colors)):
    x = bar_left + i * (bar_width + bar_gap)
    draw.rounded_rectangle(
        [x, bar_bottom - h, x + bar_width, bar_bottom],
        radius=4,
        fill=color
    )

# Save PNG (512x512)
png_path = os.path.join(OUT_DIR, 'icon.png')
img.save(png_path, 'PNG')
print(f'Created {png_path}')

# Save ICO with multiple sizes (required for Windows exe icon)
# Base image must be 256x256, append smaller sizes
ico_sizes = [256, 128, 64, 48, 32, 16]
ico_images = [img.resize((s, s), Image.LANCZOS) for s in ico_sizes]
ico_path = os.path.join(OUT_DIR, 'icon.ico')
ico_images[0].save(ico_path, format='ICO', append_images=ico_images[1:])
print(f'Created {ico_path} (sizes: {ico_sizes})')

# Save favicon (32x32)
img_32 = img.resize((32, 32), Image.LANCZOS)
favicon_path = os.path.join(OUT_DIR, 'favicon.ico')
img_32.save(favicon_path, format='ICO', sizes=[(32, 32)])
print(f'Created {favicon_path}')

# Also save as SVG-like favicon PNG for web
img_192 = img.resize((192, 192), Image.LANCZOS)
img_192.save(os.path.join(OUT_DIR, 'icon-192.png'), 'PNG')
print('Created icon-192.png')

print('Done!')
