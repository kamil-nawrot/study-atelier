from dataclasses import dataclass
from pathlib import Path
from typing import Callable

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi

from exhibit_art.effects import apply_effects
from exhibit_art.hatching import durer_wall, stripes
from exhibit_art.masks import blank_planes, object_mask, paper_background
from exhibit_art.tiers import TierSet, apply_ramp

BASE_HEIGHT = 1040

Image.MAX_IMAGE_PIXELS = None


@dataclass(frozen=True)
class Job:
    source: Path
    crop: tuple[float, float, float, float]
    background: str = "scene"
    gamma: float = 1.25
    cap: float = 0.95
    pad: bool = False
    wall_darken: float = 1.0


Background = Callable[[np.ndarray, Job, float], np.ndarray]

BACKGROUNDS: dict[str, Background] = {}


def background(name: str) -> Callable[[Background], Background]:
    def register(fn: Background) -> Background:
        BACKGROUNDS[name] = fn
        return fn

    return register


def crop_box(size: tuple[int, int], crop: tuple[float, float, float, float]) -> tuple[int, int, int, int]:
    w, h = size
    x0, y0, x1, y1 = crop
    return round(x0 * w), round(y0 * h), round(x1 * w), round(y1 * h)


def load_crop(job: Job, width: int, height: int) -> np.ndarray:
    image = Image.open(job.source).convert("L")
    region = image.crop(crop_box(image.size, job.crop))
    if job.pad:
        target = width / height
        if region.width / region.height < target:
            canvas = Image.new("L", (round(region.height * target), region.height), 255)
        else:
            canvas = Image.new("L", (region.width, round(region.width / target)), 255)
        canvas.paste(region, ((canvas.width - region.width) // 2, (canvas.height - region.height) // 2))
        region = canvas
    return np.asarray(region.resize((width, height), Image.LANCZOS), float) / 255


def wall_lum(height: int, width: int, mask: np.ndarray, scale: float, strength: float) -> np.ndarray:
    yy, xx = np.mgrid[0:height, 0:width].astype(float)
    wall = durer_wall(width, height, row=9.0 * scale)
    fine = 1 - 0.4 * np.clip(1 - np.abs(((yy + 0.08 * xx) / (4.5 * scale)) % 1 - 0.5) * 2 / 0.35, 0, 1)
    shift = (34 * scale, 46 * scale)
    shadow = ndi.gaussian_filter(ndi.shift(mask, shift, order=0), 12 * scale)
    shadow = np.clip(shadow * 1.6, 0, 1) * (1 - mask)
    cross = stripes(xx, yy, -40, 3.6 * scale, 0.45)
    return (1 - 0.85 * (1 - wall)) * fine * (1 - 0.7 * cross * shadow) * (1 - 0.25 * shadow) * strength


@background("scene")
def scene(lum: np.ndarray, job: Job, scale: float) -> np.ndarray:
    return lum


@background("wall")
def wall(lum: np.ndarray, job: Job, scale: float) -> np.ndarray:
    h, w = lum.shape
    mask = object_mask(lum, 0.7, round(6 * scale))
    mf = mask.astype(float)
    obj = ndi.gaussian_filter(mf, 2 * scale)
    yy, xx = np.mgrid[0:h, 0:w].astype(float)
    planes = blank_planes(lum, mask, round(9 * scale) | 1, 400 * scale * scale)
    vx = (xx + 1.2 * scale * np.sin(yy / (37 * scale))) / (4.2 * scale)
    vlines = np.clip(1 - np.abs(vx % 1 - 0.5) * 2 / 0.32, 0, 1)
    lum = lum * (1 - planes * vlines * (0.3 + 0.25 * yy / h))
    result = lum * obj + wall_lum(h, w, mf, scale, 1.0) * (1 - obj)
    return result * (obj + (1 - obj) * job.wall_darken)


@background("wall-detect")
def wall_detect(lum: np.ndarray, job: Job, scale: float) -> np.ndarray:
    h, w = lum.shape
    paper = paper_background(lum, round(9 * scale) | 1, 0.85, 2000 * scale * scale)
    mf = (~paper).astype(float)
    obj = ndi.gaussian_filter(mf, 2 * scale)
    result = lum * obj + wall_lum(h, w, mf, scale, 0.85) * (1 - obj)
    return result * (obj + (1 - obj) * job.wall_darken)


def tone(lum: np.ndarray, gamma: float, cap: float, scale: float) -> np.ndarray:
    lo, hi = np.percentile(lum, 1.5), np.percentile(lum, 99.5)
    norm = np.clip((lum - lo) / (hi - lo), 0, 1) ** gamma
    value = (0.7 * norm + 0.3 * ndi.gaussian_filter(norm, 6 * scale)) * cap
    h, w = value.shape
    yy, xx = np.mgrid[0:h, 0:w]
    r = np.sqrt((np.abs(xx - w / 2) / (w / 2)) ** 2 + (np.abs(yy - h / 2) / (h / 2)) ** 2) / np.sqrt(2)
    t = np.clip((r - 0.22) / 0.78, 0, 1)
    t = t * t * (3 - 2 * t)
    return value * (1 - 0.88 * t) * (1 - 0.15 * (yy / h))


def render(job: Job, tiers: TierSet) -> dict[str, Image.Image]:
    if job.background not in BACKGROUNDS:
        raise KeyError(f"unknown background: {job.background}")
    width, height = tiers.width * 2, tiers.height * 2
    scale = height / BASE_HEIGHT
    lum = BACKGROUNDS[job.background](load_crop(job, width, height), job, scale)
    value = tone(lum, job.gamma, job.cap, scale)
    images = {}
    for tier in tiers.tiers:
        rgb = apply_effects(apply_ramp(value, tier.ramp), value, tier.effects, scale)
        image = Image.fromarray(rgb.astype(np.uint8), "RGB")
        images[tier.name] = image.resize((tiers.width, tiers.height), Image.LANCZOS)
    return images


def source_preview(job: Job, longest: int = 640) -> Image.Image:
    image = Image.open(job.source).convert("RGB")
    factor = longest / max(image.size)
    preview = image.resize((round(image.width * factor), round(image.height * factor)), Image.LANCZOS)
    box = [round(v * factor) for v in crop_box(image.size, job.crop)]
    ImageDraw.Draw(preview).rectangle(box, outline=(214, 170, 80), width=3)
    return preview
