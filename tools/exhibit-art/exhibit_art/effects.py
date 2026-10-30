from typing import Callable

import numpy as np
from scipy import ndimage as ndi

Effect = Callable[[np.ndarray, np.ndarray, dict, float], np.ndarray]

EFFECTS: dict[str, Effect] = {}


def effect(name: str) -> Callable[[Effect], Effect]:
    def register(fn: Effect) -> Effect:
        EFFECTS[name] = fn
        return fn

    return register


def apply_effects(rgb: np.ndarray, tone: np.ndarray, effects: tuple[dict, ...], scale: float) -> np.ndarray:
    for spec in effects:
        kind = spec["type"]
        if kind not in EFFECTS:
            raise KeyError(f"unknown effect: {kind}")
        rgb = EFFECTS[kind](rgb, tone, spec, scale)
    return np.clip(rgb, 0, 255)


@effect("bloom")
def bloom(rgb: np.ndarray, tone: np.ndarray, spec: dict, scale: float) -> np.ndarray:
    threshold = spec.get("threshold", 0.75)
    strength = spec.get("strength", 0.6)
    radius = spec.get("radius", 8) * scale
    light = np.clip((tone - threshold) / (1 - threshold), 0, 1)
    glow = ndi.gaussian_filter(rgb * light[..., None], sigma=(radius, radius, 0))
    return rgb + strength * glow


@effect("sparkle")
def sparkle(rgb: np.ndarray, tone: np.ndarray, spec: dict, scale: float) -> np.ndarray:
    rng = np.random.default_rng(spec.get("seed", 7))
    density = spec.get("density", 0.0008)
    threshold = spec.get("threshold", 0.7)
    colour = np.array(spec.get("colour", [255, 255, 255]), float)
    seeds = (rng.random(tone.shape) < density) & (tone > threshold)
    star = ndi.gaussian_filter(seeds.astype(float), sigma=1.2 * scale)
    star = np.clip(star / max(star.max(), 1e-6), 0, 1)
    return rgb * (1 - star[..., None]) + colour * star[..., None]


@effect("tint")
def tint(rgb: np.ndarray, tone: np.ndarray, spec: dict, scale: float) -> np.ndarray:
    colour = np.array(spec["colour"], float)
    amount = spec.get("amount", 0.2)
    return rgb * (1 - amount) + colour * amount
