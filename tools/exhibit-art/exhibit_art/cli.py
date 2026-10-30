import argparse
import json
import urllib.parse
from pathlib import Path

from exhibit_art.commons import download
from exhibit_art.manifest import Variant, load_app, load_manifest
from exhibit_art.pipeline import BACKGROUNDS, Job, render, source_preview
from exhibit_art.tiers import TierSet, load_tiers

HERE = Path(__file__).resolve().parent.parent
DEFAULT_MANIFEST = HERE / "manifest.json"
DEFAULT_SOURCES = HERE / ".cache" / "sources"


def write_set(job: Job, tiers: TierSet, folder: Path, preview: bool) -> None:
    folder.mkdir(parents=True, exist_ok=True)
    for name, image in render(job, tiers).items():
        image.save(folder / f"{name}.png", optimize=True)
    if preview:
        source_preview(job).save(folder / "source-crop.jpg", quality=85)


def sources_entry(v: Variant, tiers: TierSet) -> dict:
    base = f"{v.exhibit}/{v.variant}"
    return {
        "exhibit": v.exhibit,
        "variant": v.variant,
        "status": v.status,
        "files": {t.name: f"{base}/{t.name}.png" for t in tiers.tiers},
        "source_crop": f"{base}/source-crop.jpg",
        "commons_file": v.commons_file,
        "commons_url": "https://commons.wikimedia.org/wiki/File:" + urllib.parse.quote(v.commons_file.replace(" ", "_")),
        "licence": v.licence,
        "credit": v.credit,
    }


def cmd_render(args: argparse.Namespace) -> None:
    job = Job(
        source=Path(args.image),
        crop=tuple(float(v) for v in args.crop.split(",")),
        background=args.background,
        gamma=args.gamma,
        cap=args.cap,
        pad=args.pad,
        wall_darken=args.wall_darken,
    )
    write_set(job, load_tiers(args.tiers), Path(args.out), args.preview)


def selected(variants: list[Variant], only: list[str] | None) -> list[Variant]:
    if not only:
        return variants
    return [v for v in variants if v.exhibit in only or f"{v.exhibit}/{v.variant}" in only]


def cmd_fetch(args: argparse.Namespace) -> None:
    for v in selected(load_manifest(Path(args.manifest), Path(args.sources)), args.only):
        print(download(v.commons_file, v.job.source))


def cmd_build(args: argparse.Namespace) -> None:
    tiers = load_tiers(args.tiers)
    variants = load_manifest(Path(args.manifest), Path(args.sources))
    out = Path(args.out)
    for v in selected(variants, args.only):
        if args.fetch:
            download(v.commons_file, v.job.source)
        write_set(v.job, tiers, out / v.exhibit / v.variant, True)
        print(f"{v.exhibit}/{v.variant}")
    meta = {
        "size": [tiers.width, tiers.height],
        "tiers": [t.name for t in tiers.tiers],
        "variants": [sources_entry(v, tiers) for v in variants],
    }
    (out / "sources.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2) + "\n", "utf-8")


def cmd_publish(args: argparse.Namespace) -> None:
    tiers = load_tiers(args.tiers)
    variants = {(v.exhibit, v.variant): v for v in load_manifest(Path(args.manifest), Path(args.sources))}
    out = Path(args.out)
    for exhibit, name in load_app(Path(args.manifest)).items():
        if args.only and exhibit not in args.only:
            continue
        v = variants[(exhibit, name)]
        if args.fetch:
            download(v.commons_file, v.job.source)
        folder = out / exhibit
        folder.mkdir(parents=True, exist_ok=True)
        for tier, image in render(v.job, tiers).items():
            image.save(folder / f"{tier}.webp", "WEBP", quality=args.quality, method=4)
        print(f"{exhibit} <- {name}")


def parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(prog="exhibit-art")
    p.add_argument("--tiers", type=Path, help="tiers JSON (default: the built-in tiers.json)")
    sub = p.add_subparsers(required=True)

    r = sub.add_parser("render", help="render one image into every tier")
    r.add_argument("image")
    r.add_argument("--crop", default="0,0,1,1", help="x0,y0,x1,y1 as fractions of the image")
    r.add_argument("--background", default="scene", choices=sorted(BACKGROUNDS))
    r.add_argument("--gamma", type=float, default=1.25)
    r.add_argument("--cap", type=float, default=0.95)
    r.add_argument("--pad", action="store_true")
    r.add_argument("--wall-darken", type=float, default=1.0)
    r.add_argument("--preview", action="store_true", help="also write source-crop.jpg")
    r.add_argument("--out", required=True)
    r.set_defaults(func=cmd_render)

    commands = (
        ("fetch", cmd_fetch, "download the sources of the manifest"),
        ("build", cmd_build, "render every variant of the manifest as PNG, with source-crop.jpg and sources.json"),
        ("publish", cmd_publish, "render the variant chosen for the app of each exhibit as WebP"),
    )
    for name, func, text in commands:
        s = sub.add_parser(name, help=text)
        s.add_argument("--manifest", default=str(DEFAULT_MANIFEST))
        s.add_argument("--sources", default=str(DEFAULT_SOURCES))
        s.add_argument("--only", nargs="*", help="exhibit codes or exhibit/variant pairs")
        if name != "fetch":
            s.add_argument("--out", required=True)
            s.add_argument("--fetch", action="store_true", help="download missing sources first")
        if name == "publish":
            s.add_argument("--quality", type=int, default=80)
        s.set_defaults(func=func)
    return p


def main(argv: list[str] | None = None) -> None:
    args = parser().parse_args(argv)
    args.func(args)
