import json
from pathlib import Path

import pytest

from exhibit_art.manifest import STATUSES, load_manifest, source_name

MANIFEST = Path(__file__).resolve().parent.parent / "manifest.json"


def test_manifest_variants_are_valid() -> None:
    variants = load_manifest(MANIFEST, Path("sources"))
    assert variants
    for v in variants:
        x0, y0, x1, y1 = v.job.crop
        assert 0 <= x0 < x1 <= 1 and 0 <= y0 < y1 <= 1
        assert v.status in STATUSES
        assert v.licence


def test_source_name_is_ascii_and_keeps_the_extension() -> None:
    assert source_name("Albrecht Dürer, Melencolia I, 1514, NGA 6640.jpg") == "Albrecht-Durer-Melencolia-I-1514-NGA-6640.jpg"
    assert source_name("Camera obscura.PNG") == "Camera-obscura.png"


def test_duplicate_variants_are_rejected(tmp_path: Path) -> None:
    item = {
        "exhibit": "regular",
        "variant": "x",
        "status": "chosen",
        "commons_file": "a.jpg",
        "licence": "CC0",
        "credit": "c",
        "crop": [0, 0, 1, 1],
    }
    path = tmp_path / "manifest.json"
    path.write_text(json.dumps({"variants": [item, item]}))
    with pytest.raises(ValueError):
        load_manifest(path, tmp_path)
