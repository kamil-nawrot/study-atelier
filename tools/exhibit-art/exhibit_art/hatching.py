import numpy as np
from PIL import Image, ImageDraw


def durer_wall(width: int, height: int, row: float, seed: int = 5, supersample: int = 4) -> np.ndarray:
    rng = np.random.default_rng(seed)
    s = row * supersample
    image = Image.new("L", (width * supersample, height * supersample), 255)
    draw = ImageDraw.Draw(image)
    dash, dx, dy = 1.25 * s, 0.55 * s, 0.75 * s
    line_width = max(1, int(0.2 * s))

    def jitter(value: float) -> float:
        return value + rng.normal(0, 0.06 * s)

    y = -s
    while y < height * supersample + s:
        x = -rng.uniform(0, dash * 2)
        while x < width * supersample + s:
            length = dash * rng.uniform(0.8, 1.2)
            x0, y0 = jitter(x), jitter(y)
            x1, y1 = jitter(x + length), jitter(y - 0.08 * s)
            draw.line([(x0, y0), (x1, y1)], fill=0, width=line_width)
            if rng.random() < 0.85:
                draw.line([(x1, y1), (jitter(x1 - dx), jitter(y1 + dy))], fill=0, width=max(1, int(line_width * 0.85)))
            x += length + rng.uniform(0.25, 0.6) * s
        y += s * rng.uniform(0.92, 1.08)
    return np.asarray(image.resize((width, height), Image.LANCZOS), float) / 255


def stripes(xx: np.ndarray, yy: np.ndarray, angle: float, period: float, duty: float) -> np.ndarray:
    a = np.deg2rad(angle)
    u = (xx * np.cos(a) + yy * np.sin(a)) / period
    return np.clip(1 - np.abs(u % 1 - 0.5) * 2 / duty, 0, 1)
