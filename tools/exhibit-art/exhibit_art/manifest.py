import json
import re
import unicodedata
from dataclasses import dataclass
from pathlib import Path

from exhibit_art.pipeline import Job

STATUSES = ("chosen", "alternative", "rejected")


@dataclass(frozen=True)
class Variant:
    exhibit: str
    variant: str
    status: str
    commons_file: str
    licence: str
    credit: str
    job: Job


def source_name(commons_file: str) -> str:
    stem, _, ext = commons_file.rpartition(".")
    plain = unicodedata.normalize("NFKD", stem).encode("ascii", "ignore").decode()
    slug = re.sub(r"[^A-Za-z0-9]+", "-", plain).strip("-")[:80]
    return f"{slug}.{ext.lower()}"


def load_app(path: Path) -> dict[str, str]:
    return json.loads(path.read_text("utf-8")).get("app", {})


def load_manifest(path: Path, sources_dir: Path) -> list[Variant]:
    data = json.loads(path.read_text("utf-8"))
    variants = []
    for item in data["variants"]:
        if item["status"] not in STATUSES:
            raise ValueError(f"{item['exhibit']}/{item['variant']}: unknown status {item['status']}")
        job = Job(
            source=sources_dir / source_name(item["commons_file"]),
            crop=tuple(item["crop"]),
            background=item.get("background", "scene"),
            gamma=item.get("gamma", 1.25),
            cap=item.get("cap", 0.95),
            pad=item.get("pad", False),
            wall_darken=item.get("wall_darken", 1.0),
        )
        variants.append(
            Variant(
                exhibit=item["exhibit"],
                variant=item["variant"],
                status=item["status"],
                commons_file=item["commons_file"],
                licence=item["licence"],
                credit=item["credit"],
                job=job,
            )
        )
    keys = [(v.exhibit, v.variant) for v in variants]
    if len(set(keys)) != len(keys):
        raise ValueError("exhibit and variant pairs must be unique")
    for exhibit, variant in data.get("app", {}).items():
        if (exhibit, variant) not in keys:
            raise ValueError(f"app image {exhibit}/{variant} is not in the manifest")
    return variants
