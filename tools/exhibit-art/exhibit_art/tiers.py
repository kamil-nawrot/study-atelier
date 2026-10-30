import json
from dataclasses import dataclass, field
from importlib import resources
from pathlib import Path

import numpy as np


@dataclass(frozen=True)
class Tier:
    name: str
    ramp: tuple[str, ...]
    effects: tuple[dict, ...] = field(default_factory=tuple)


@dataclass(frozen=True)
class TierSet:
    width: int
    height: int
    tiers: tuple[Tier, ...]


def load_tiers(path: Path | None = None) -> TierSet:
    text = path.read_text("utf-8") if path else resources.files("exhibit_art").joinpath("tiers.json").read_text("utf-8")
    data = json.loads(text)
    tiers = tuple(
        Tier(name=t["name"], ramp=tuple(t["ramp"]), effects=tuple(t.get("effects", []))) for t in data["tiers"]
    )
    names = [t.name for t in tiers]
    if len(set(names)) != len(names):
        raise ValueError("tier names must be unique")
    for tier in tiers:
        if len(tier.ramp) < 2:
            raise ValueError(f"tier {tier.name} needs at least two ramp colours")
    return TierSet(width=data["output"]["width"], height=data["output"]["height"], tiers=tiers)


def hex_to_rgb(value: str) -> np.ndarray:
    return np.array([int(value[i : i + 2], 16) for i in (1, 3, 5)], float)


def apply_ramp(tone: np.ndarray, ramp: tuple[str, ...]) -> np.ndarray:
    stops = np.array([hex_to_rgb(c) for c in ramp])
    last = len(stops) - 1
    x = np.clip(tone, 0, 1) * last
    i = np.clip(np.floor(x).astype(int), 0, last - 1)
    f = (x - i)[..., None]
    return stops[i] * (1 - f) + stops[i + 1] * f
