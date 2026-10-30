# exhibit-art

Turns an engraving into the images of a display case exhibit: one image per tier (`none`, `bronze`, `silver`, `gold`, `platinum`), 400 × 520 px. Why it is a Python tool: [ADR-0163](../../docs/decisions/0163-generate-the-exhibit-images-with-a-python-tool.md). How the display case uses the images: [ADR-0162](../../docs/decisions/0162-show-the-exhibits-as-toned-engravings-in-frames.md).

The same input always gives the same output: the generated hatching uses fixed seeds. Regenerating the manifest reproduces the images in the app.

## Setup

Python 3.10 or newer. From this folder:

```sh
python3 -m venv .venv
. .venv/bin/activate
pip install -e '.[test]'
pytest
```

## Commands

```sh
exhibit-art render engraving.jpg --crop 0.59,0.04,0.80,0.25 --out tmp/hourglass --preview
exhibit-art fetch
exhibit-art build --out tmp/exhibits
exhibit-art publish --out ../../apps/web/static/exhibits
```

| Command   | What it does                                                                                                                                                                             |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `render`  | Renders one image into every tier as PNG. `--preview` also writes `source-crop.jpg`, the original with the crop marked.                                                                  |
| `fetch`   | Downloads the source of every variant in `manifest.json` from Wikimedia Commons into `.cache/sources/`, at most 3840 px wide, and skips files already there.                             |
| `build`   | Renders every variant of the manifest into `<out>/<exhibit>/<variant>/`, with `source-crop.jpg`, and writes `<out>/sources.json` with the credits and licences.                          |
| `publish` | Renders the variant chosen for the app (`app` in the manifest) of each exhibit as WebP (quality 80) into `<out>/<exhibit>/<tier>.webp`, the layout the app reads from `static/exhibits`. |

`build` and `publish` take `--fetch` to download missing sources first, and `--only` to limit the run to some exhibits (`--only marathon chronicle`) or variants (`--only marathon/durer-nemesis-cup`). Every command takes `--tiers <file>` to use other tiers than the built-in ones.

## The manifest

`manifest.json` lists every variant made so far, chosen, alternative and rejected, so none has to be prepared again by hand. `app` names the variant shown in the app for each exhibit.

| Field                | Meaning                                                                                                                      |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `exhibit`, `variant` | The exhibit code used in the app and a name for this crop                                                                    |
| `status`             | `chosen`, `alternative` or `rejected`                                                                                        |
| `commons_file`       | The file name on Wikimedia Commons, without `File:`                                                                          |
| `licence`, `credit`  | What the credits need                                                                                                        |
| `crop`               | `[x0, y0, x1, y1]` as fractions of the source, so the crop does not depend on the downloaded size; keep the ratio near 10:13 |
| `background`         | `scene` (default), `wall` or `wall-detect`, see below                                                                        |
| `gamma`, `cap`       | Tone settings: gamma above 1 darkens the mid-tones, `cap` lowers the brightest tone (defaults 1.25 and 0.95)                 |
| `pad`, `wall_darken` | Pad a narrow crop with paper to 10:13 before rendering, and darken the generated wall (1 keeps it)                           |

## How an image is made

1. Crop the source by the fractions and scale it to twice the output size.
2. Background: `scene` keeps the engraving as it is, for a dense scene. `wall` finds the object on a blank plate, replaces the paper around it with generated wall hatching in the manner of Dürer's _Melencolia I_ with a cast shadow, and hatches blank planes inside the object. `wall-detect` replaces only the paper that touches the edges, for an object held by a figure, such as the cup of _Nemesis_.
3. Tone: stretch the contrast, blend the fine lines with a soft copy, darken the corners with a vignette and add light from above.
4. For every tier, map the tone onto the tier's colour ramp, apply the tier's effects and scale to the output size.

## Adding a tier

Tiers live in `exhibit_art/tiers.json`: an output size and a list of tiers, each with a `name`, a `ramp` of colours from dark to light, and optional `effects`. A new tier is a new entry, here a diamond tier with two built-in effects:

```json
{
	"name": "diamond",
	"ramp": ["#1B2430", "#5C7A99", "#B9D4EC", "#F2FAFF"],
	"effects": [
		{ "type": "bloom", "strength": 0.4 },
		{ "type": "sparkle", "density": 0.002 }
	]
}
```

To try a tier without changing the defaults, put the whole tier list in another file and pass it with `--tiers`.

Built-in effects (`exhibit_art/effects.py`):

| Effect    | Parameters                                                  |
| --------- | ----------------------------------------------------------- |
| `bloom`   | `threshold` (0.75), `strength` (0.6), `radius` (8)          |
| `sparkle` | `density` (0.0008), `threshold` (0.7), `colour`, `seed` (7) |
| `tint`    | `colour` (required), `amount` (0.2)                         |

## Adding an effect or a background

An effect is a function in `exhibit_art/effects.py` registered by name, which takes the RGB image (0–255, floats), the tone (0–1), its parameters from `tiers.json` and the scale of the working size, and returns the new RGB image:

```python
from exhibit_art.effects import effect


@effect("frost")
def frost(rgb, tone, spec, scale):
    return rgb * (1 - spec.get("amount", 0.1)) + 255 * spec.get("amount", 0.1)
```

A background is registered the same way with `@background("name")` in `exhibit_art/pipeline.py`; it takes the luminance of the crop (0–1), the job and the scale, and returns the new luminance. Lengths in effects and backgrounds are multiplied by `scale`, so they keep their look at another output size.
