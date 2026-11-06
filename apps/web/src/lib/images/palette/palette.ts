import type { PaletteColour } from '#lib/catalogue/types/palette-colour.ts';

export const PALETTE_SIZE = 6;
export const PALETTE_LABELLED_SHARE = 0.2;

const ITERATIONS = 12;
const MIN_ALPHA = 128;
const BUCKET_SHIFT = 4;
const MIN_SEED_DISTANCE = 1800;
const HEX = /^#[0-9a-f]{6}$/;

type Rgb = [number, number, number];

function distance(first: Rgb, second: Rgb): number {
	return (first[0] - second[0]) ** 2 + (first[1] - second[1]) ** 2 + (first[2] - second[2]) ** 2;
}

function pixelsOf(data: Uint8ClampedArray): Rgb[] {
	const pixels: Rgb[] = [];
	for (let index = 0; index + 3 < data.length; index += 4) {
		if (data[index + 3] >= MIN_ALPHA) {
			pixels.push([data[index], data[index + 1], data[index + 2]]);
		}
	}
	return pixels;
}

function seeds(pixels: readonly Rgb[], count: number): Rgb[] {
	const buckets = new Map<number, { total: Rgb; size: number }>();
	for (const [red, green, blue] of pixels) {
		const key =
			((red >> BUCKET_SHIFT) << 8) | ((green >> BUCKET_SHIFT) << 4) | (blue >> BUCKET_SHIFT);
		const bucket = buckets.get(key) ?? { total: [0, 0, 0], size: 0 };
		bucket.total = [bucket.total[0] + red, bucket.total[1] + green, bucket.total[2] + blue];
		bucket.size += 1;
		buckets.set(key, bucket);
	}
	const ranked = [...buckets.entries()]
		.sort((first, second) => second[1].size - first[1].size || first[0] - second[0])
		.map(([, bucket]): Rgb => [
			bucket.total[0] / bucket.size,
			bucket.total[1] / bucket.size,
			bucket.total[2] / bucket.size
		]);
	const chosen: Rgb[] = [];
	for (const candidate of ranked) {
		if (chosen.every((seed) => distance(seed, candidate) >= MIN_SEED_DISTANCE)) {
			chosen.push(candidate);
		}
		if (chosen.length === count) break;
	}
	return chosen;
}

function assign(pixels: readonly Rgb[], centres: readonly Rgb[]): number[] {
	return pixels.map((pixel) => {
		let best = 0;
		for (let index = 1; index < centres.length; index += 1) {
			if (distance(pixel, centres[index]) < distance(pixel, centres[best])) best = index;
		}
		return best;
	});
}

function recentre(pixels: readonly Rgb[], labels: readonly number[], centres: Rgb[]): Rgb[] {
	const sums = centres.map((): [number, number, number, number] => [0, 0, 0, 0]);
	pixels.forEach((pixel, index) => {
		const sum = sums[labels[index]];
		sum[0] += pixel[0];
		sum[1] += pixel[1];
		sum[2] += pixel[2];
		sum[3] += 1;
	});
	return sums.map((sum, index): Rgb =>
		sum[3] === 0 ? centres[index] : [sum[0] / sum[3], sum[1] / sum[3], sum[2] / sum[3]]
	);
}

export function hexOf(colour: readonly number[]): string {
	return `#${colour.map((channel) => Math.round(channel).toString(16).padStart(2, '0')).join('')}`;
}

export function extractPalette(
	data: Uint8ClampedArray,
	count: number = PALETTE_SIZE
): PaletteColour[] {
	const pixels = pixelsOf(data);
	if (pixels.length === 0) return [];
	let centres = seeds(pixels, count);
	let labels = assign(pixels, centres);
	for (let step = 0; step < ITERATIONS; step += 1) {
		centres = recentre(pixels, labels, centres);
		const next = assign(pixels, centres);
		if (next.every((label, index) => label === labels[index])) break;
		labels = next;
	}
	const sizes = centres.map(() => 0);
	for (const label of labels) sizes[label] += 1;
	return centres
		.map((centre, index) => ({ color: hexOf(centre), size: sizes[index] }))
		.filter((entry) => entry.size > 0)
		.sort((first, second) => second.size - first.size || first.color.localeCompare(second.color))
		.map((entry) => ({
			color: entry.color,
			share: Math.round((entry.size / pixels.length) * 1000) / 1000
		}));
}

export function storedPalette(value: unknown): PaletteColour[] | undefined {
	if (!Array.isArray(value) || value.length === 0 || value.length > PALETTE_SIZE) return undefined;
	const colours: PaletteColour[] = [];
	for (const entry of value) {
		if (typeof entry !== 'object' || entry === null) return undefined;
		const { color, share } = entry as Record<string, unknown>;
		if (typeof color !== 'string' || !HEX.test(color)) return undefined;
		if (typeof share !== 'number' || !(share > 0) || share > 1) return undefined;
		colours.push({ color, share });
	}
	return colours;
}
