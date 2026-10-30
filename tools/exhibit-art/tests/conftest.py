import json
from pathlib import Path

import numpy as np
import pytest
from PIL import Image, ImageDraw


@pytest.fixture
def engraving(tmp_path: Path) -> Path:
    rng = np.random.default_rng(1)
    image = Image.new("L", (600, 760), 255)
    draw = ImageDraw.Draw(image)
    for y in range(0, 760, 5):
        draw.line([(0, y), (600, y + 40)], fill=int(rng.integers(40, 160)), width=1)
    draw.ellipse([180, 220, 420, 560], fill=245, outline=0, width=6)
    path = tmp_path / "engraving.png"
    image.save(path)
    return path


@pytest.fixture
def object_on_paper(tmp_path: Path) -> Path:
    image = Image.new("L", (600, 760), 255)
    draw = ImageDraw.Draw(image)
    draw.rectangle([200, 200, 400, 560], fill=255, outline=0, width=8)
    for x in range(210, 400, 6):
        draw.line([(x, 210), (x, 550)], fill=60, width=2)
    path = tmp_path / "object.png"
    image.save(path)
    return path


@pytest.fixture
def small_tiers(tmp_path: Path) -> Path:
    data = {
        "output": {"width": 100, "height": 130},
        "tiers": [
            {"name": "none", "ramp": ["#000000", "#222222"]},
            {"name": "gold", "ramp": ["#2E2008", "#644A12", "#A27E2A", "#D2AE52", "#F4E2A2"]},
            {
                "name": "diamond",
                "ramp": ["#1B2430", "#5C7A99", "#B9D4EC", "#F2FAFF"],
                "effects": [{"type": "bloom", "strength": 0.4}, {"type": "sparkle", "density": 0.002}],
            },
        ],
    }
    path = tmp_path / "tiers.json"
    path.write_text(json.dumps(data))
    return path
