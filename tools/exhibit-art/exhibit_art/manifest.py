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
    commons_file: str | None
    licence: str
    credit: str
    job: Job
    source_url: str | None = None
    source_page: str | None = None


def source_name(commons_file: str) -> str:
    stem, _, ext = commons_file.rpartition(".")
    ext = ext.split("?")[0]
    plain = unicodedata.normalize("NFKD", stem).encode("ascii", "ignore").decode()
    slug = re.sub(r"[^A-Za-z0-9]+", "-", plain).strip("-")[:80]
    return f"{slug}.{ext.lower()}"


def load_app(path: Path) -> dict[str, str]:
    return json.loads(path.read_text("utf-8")).get("app", {})


def load_manifest(path: Path, sources_dir: Path) -> list[Variant]:
    data = json.loads(path.read_text("utf-8"))
    variants = []
    for item in data["variants"]:
        name = f"{item['exhibit']}/{item['variant']}"
        if item["status"] not in STATUSES:
            raise ValueError(f"{name}: unknown status {item['status']}")
        commons_file = item.get("commons_file")
        source_url = item.get("source_url")
        if bool(commons_file) == bool(source_url):
            raise ValueError(f"{name}: give either commons_file or source_url")
        if source_url and not item.get("source_page"):
            raise ValueError(f"{name}: a source_url needs its source_page")
        file_name = commons_file or source_url.split("?")[0].rsplit("/", 1)[-1]
        job = Job(
            source=sources_dir / source_name(file_name),
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
                commons_file=commons_file,
                licence=item["licence"],
                credit=item["credit"],
                job=job,
                source_url=source_url,
                source_page=item.get("source_page"),
            )
        )
    keys = [(v.exhibit, v.variant) for v in variants]
    if len(set(keys)) != len(keys):
        raise ValueError("exhibit and variant pairs must be unique")
    for exhibit, variant in data.get("app", {}).items():
        if (exhibit, variant) not in keys:
            raise ValueError(f"app image {exhibit}/{variant} is not in the manifest")
    return variants
