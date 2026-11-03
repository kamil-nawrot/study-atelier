import { loadArtwork } from '#lib/artworks/artwork-data/artwork-data.ts';
import type { LoadArtworkResult } from '#lib/artworks/types/load-artwork-result.ts';
import { onWrite } from '#lib/shared/data/writes/writes.ts';

export const PRELOAD_LIFETIME_MS = 60 * 1000;

type Preloaded = { number: number; at: number; result: Promise<LoadArtworkResult> };

let preloaded: Preloaded | undefined;

onWrite(() => {
	preloaded = undefined;
});

export function preloadArtwork(number: number, now: number = Date.now()): void {
	if (preloaded?.number === number && now - preloaded.at < PRELOAD_LIFETIME_MS) return;
	preloaded = { number, at: now, result: loadArtwork(number) };
}

export function artworkCore(number: number, now: number = Date.now()): Promise<LoadArtworkResult> {
	const taken = preloaded;
	preloaded = undefined;
	if (taken?.number === number && now - taken.at < PRELOAD_LIFETIME_MS) return taken.result;
	return loadArtwork(number);
}
