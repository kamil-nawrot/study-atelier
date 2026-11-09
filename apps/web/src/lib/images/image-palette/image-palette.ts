import type { ArtworkImageInput } from '#lib/catalogue/types/artwork-image-input.ts';
import type { PaletteColour } from '#lib/catalogue/types/palette-colour.ts';
import { artworkImageSource } from '#lib/images/artwork-image/artwork-image.ts';
import { fetchCommonsThumbnails } from '#lib/images/commons/commons.ts';
import { fetchImageThroughProxy } from '#lib/images/image-proxy-data/image-proxy-data.ts';
import { readPixels } from '#lib/images/image-pixels/image-pixels.ts';
import { savePalette } from '#lib/images/palette-data/palette-data.ts';
import { extractPalette } from '#lib/images/palette/palette.ts';

export const PALETTE_SOURCE_WIDTH = 330;

export type PaletteResult = { colours: PaletteColour[] } | { unreadable: true };

const known = new Map<string, PaletteResult>();
const running = new Map<string, Promise<PaletteResult>>();

function memoryKey(image: ArtworkImageInput): string {
	const origin =
		image.kind === 'commons'
			? image.file
			: image.kind === 'url'
				? image.url
				: image.kind === 'upload'
					? image.path
					: image.previewUrl;
	return `${image.id ?? ''}:${image.kind}:${origin}`;
}

async function sourceUrl(image: ArtworkImageInput): Promise<string | undefined> {
	if (image.kind === 'commons') {
		const thumbnails = await fetchCommonsThumbnails([image.file], PALETTE_SOURCE_WIDTH);
		return thumbnails.get(image.file);
	}
	return artworkImageSource(image, PALETTE_SOURCE_WIDTH)?.src;
}

async function downloadImage(image: ArtworkImageInput, url: string): Promise<Blob | undefined> {
	try {
		const response = await fetch(url, { mode: 'cors' });
		return response.ok ? await response.blob() : undefined;
	} catch {
		return image.kind === 'url' ? fetchImageThroughProxy(url) : undefined;
	}
}

async function computeColours(image: ArtworkImageInput): Promise<PaletteColour[] | undefined> {
	try {
		const url = await sourceUrl(image);
		if (!url) return undefined;
		const blob = await downloadImage(image, url);
		if (!blob) return undefined;
		const pixels = await readPixels(blob);
		const colours = pixels ? extractPalette(pixels) : [];
		return colours.length > 0 ? colours : undefined;
	} catch {
		return undefined;
	}
}

async function readPalette(image: ArtworkImageInput, key: string): Promise<PaletteResult> {
	const colours = await computeColours(image);
	const result: PaletteResult = colours ? { colours } : { unreadable: true };
	known.set(key, result);
	if (colours && image.id) void savePalette(image, colours).catch(() => false);
	return result;
}

export function paletteOf(image: ArtworkImageInput): Promise<PaletteResult> {
	if (image.palette) return Promise.resolve({ colours: image.palette });
	const key = memoryKey(image);
	const remembered = known.get(key);
	if (remembered) return Promise.resolve(remembered);
	const pending = running.get(key);
	if (pending) return pending;
	const request = readPalette(image, key).finally(() => running.delete(key));
	running.set(key, request);
	return request;
}
