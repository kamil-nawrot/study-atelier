from pathlib import Path

import numpy as np
import pytest

from exhibit_art.effects import EFFECTS, apply_effects, effect
from exhibit_art.pipeline import BACKGROUNDS, Job, crop_box, render
from exhibit_art.tiers import apply_ramp, load_tiers


def pixels(image) -> np.ndarray:
    return np.asarray(image, int)


def test_default_tiers_are_the_five_metals() -> None:
    tiers = load_tiers()
    assert [t.name for t in tiers.tiers] == ["none", "bronze", "silver", "gold", "platinum"]
    assert (tiers.width, tiers.height) == (400, 520)


def test_ramp_maps_ends_to_first_and_last_colour() -> None:
    ramp = ("#000000", "#808080", "#FFFFFF")
    rgb = apply_ramp(np.array([0.0, 0.5, 1.0]), ramp)
    assert rgb.tolist() == [[0, 0, 0], [128, 128, 128], [255, 255, 255]]


def test_crop_box_rounds_fractions_to_pixels() -> None:
    assert crop_box((1000, 2000), (0.1234, 0.5, 0.75, 1.0)) == (123, 1000, 750, 2000)


def test_render_writes_every_tier_at_the_output_size(engraving: Path, small_tiers: Path) -> None:
    images = render(Job(source=engraving, crop=(0.1, 0.1, 0.9, 0.9)), load_tiers(small_tiers))
    assert list(images) == ["none", "gold", "diamond"]
    assert all(image.size == (100, 130) for image in images.values())


def test_render_is_deterministic(engraving: Path, small_tiers: Path) -> None:
    tiers = load_tiers(small_tiers)
    job = Job(source=engraving, crop=(0, 0, 1, 1))
    first, second = render(job, tiers), render(job, tiers)
    for name in first:
        assert np.array_equal(pixels(first[name]), pixels(second[name]))


@pytest.mark.parametrize("mode", sorted(BACKGROUNDS))
def test_every_background_renders(mode: str, object_on_paper: Path, small_tiers: Path) -> None:
    job = Job(source=object_on_paper, crop=(0, 0, 1, 1), background=mode, pad=True)
    images = render(job, load_tiers(small_tiers))
    assert pixels(images["gold"]).std() > 0


def test_wall_background_hatches_blank_paper(object_on_paper: Path, small_tiers: Path) -> None:
    tiers = load_tiers(small_tiers)
    plain = render(Job(source=object_on_paper, crop=(0, 0, 1, 1)), tiers)["gold"]
    walled = render(Job(source=object_on_paper, crop=(0, 0, 1, 1), background="wall"), tiers)["gold"]
    def texture(image) -> float:
        grey = pixels(image.convert("L"))[30:70, 5:30]
        return float(np.abs(np.diff(grey, axis=1)).mean())

    assert texture(walled) > 2 * texture(plain)


def test_unknown_background_and_effect_are_rejected(engraving: Path, small_tiers: Path) -> None:
    with pytest.raises(KeyError):
        render(Job(source=engraving, crop=(0, 0, 1, 1), background="nope"), load_tiers(small_tiers))
    with pytest.raises(KeyError):
        apply_effects(np.zeros((2, 2, 3)), np.zeros((2, 2)), ({"type": "nope"},), 1.0)


def test_a_registered_effect_is_applied() -> None:
    @effect("invert-for-test")
    def invert(rgb: np.ndarray, tone: np.ndarray, spec: dict, scale: float) -> np.ndarray:
        return 255 - rgb

    try:
        out = apply_effects(np.zeros((2, 2, 3)), np.zeros((2, 2)), ({"type": "invert-for-test"},), 1.0)
        assert out.max() == 255
    finally:
        del EFFECTS["invert-for-test"]
