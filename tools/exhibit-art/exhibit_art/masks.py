import numpy as np
from scipy import ndimage as ndi


def object_mask(lum: np.ndarray, threshold: float, grow: int) -> np.ndarray:
    ink = lum < threshold
    mask = ndi.binary_dilation(ink, iterations=grow)
    mask = ndi.binary_fill_holes(mask)
    mask = ndi.binary_erosion(mask, iterations=grow)
    labels, count = ndi.label(mask)
    if count == 0:
        return mask
    sizes = ndi.sum(mask, labels, range(1, count + 1))
    return labels == (int(np.argmax(sizes)) + 1)


def paper_background(lum: np.ndarray, size: int, threshold: float, min_pixels: int) -> np.ndarray:
    white = ndi.minimum_filter(lum, size=size) > threshold
    labels, count = ndi.label(white)
    if count == 0:
        return np.zeros_like(lum, bool)
    sizes = ndi.sum(white, labels, range(1, count + 1))
    edge = np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]])
    touching = set(np.unique(edge)) - {0}
    keep = [i + 1 for i, area in enumerate(sizes) if area > min_pixels and (i + 1) in touching]
    return ndi.binary_dilation(np.isin(labels, keep), iterations=size // 2)


def blank_planes(lum: np.ndarray, mask: np.ndarray, size: int, min_pixels: int) -> np.ndarray:
    white = (ndi.minimum_filter(lum, size=size) > 0.85) & mask
    labels, count = ndi.label(white)
    if count == 0:
        return np.zeros_like(lum)
    sizes = ndi.sum(white, labels, range(1, count + 1))
    planes = np.isin(labels, 1 + np.where(sizes > min_pixels)[0])
    return ndi.gaussian_filter(ndi.binary_dilation(planes, iterations=3).astype(float), 1.5)
