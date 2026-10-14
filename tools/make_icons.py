"""Draw original PLZ FitZone app icons (no third-party assets).

Icon: dark navy (#0f172a) rounded background, bold white "FZ" letters with a
blue (#3b82f6) accent bar underneath. Maskable icon keeps content inside the
central 80% safe zone. Outputs:
  icons/icon-192.png, icons/icon-512.png, icons/maskable-512.png,
  icons/apple-touch-icon.png (180).
"""
import os
from PIL import Image, ImageDraw, ImageFont

NAVY = (15, 23, 42, 255)
WHITE = (255, 255, 255, 255)
BLUE = (59, 130, 246, 255)

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(BASE, "icons")


def load_font(size):
    for name in ("DejaVuSans-Bold.ttf", "arialbd.ttf", "Arial Bold.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def rounded_bg(size, radius_ratio=0.225):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([0, 0, size - 1, size - 1],
                        radius=int(size * radius_ratio), fill=NAVY)
    return img


def draw_mark(img, scale=1.0):
    """Draw white FZ + blue accent bar, centered, scaled to fit."""
    size = img.size[0]
    d = ImageDraw.Draw(img)
    font = load_font(int(size * 0.38 * scale))
    text = "FZ"
    bbox = d.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    x = (size - tw) / 2 - bbox[0]
    y = (size - th) / 2 - bbox[1] - size * 0.04 * scale
    d.text((x, y), text, font=font, fill=WHITE)
    # blue accent bar under the letters
    bar_w = tw * 0.9
    bar_h = max(2, int(size * 0.045 * scale))
    bar_x = (size - bar_w) / 2
    bar_y = y + th + size * 0.03 * scale
    d.rounded_rectangle([bar_x, bar_y, bar_x + bar_w, bar_y + bar_h],
                        radius=bar_h // 2, fill=BLUE)


def save_icon(path, size, maskable=False):
    img = rounded_bg(size)
    draw_mark(img, scale=0.8 if maskable else 1.0)
    rgb = Image.new("RGB", img.size, NAVY[:3])
    rgb.paste(img, mask=(img.split()[3] if img.mode == "RGBA" else None))
    rgb.save(path)
    print("wrote", path, rgb.size)


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    save_icon(os.path.join(OUT_DIR, "icon-192.png"), 192)
    save_icon(os.path.join(OUT_DIR, "icon-512.png"), 512)
    save_icon(os.path.join(OUT_DIR, "maskable-512.png"), 512, maskable=True)
    save_icon(os.path.join(OUT_DIR, "apple-touch-icon.png"), 180)


if __name__ == "__main__":
    main()
