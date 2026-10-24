import { onDestroy } from 'svelte';
import { refreshExpiredImages, resolveImages } from './artworks.ts';
import { ImageQueue } from './image-queue.ts';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';

export const REFRESH_DELAY_MS = 100;

export class WallImages {
	#updated = $state<Record<string, WallArtwork>>({});
	#failed: WallArtwork[] = [];
	#refreshTimer: ReturnType<typeof setTimeout> | undefined;
	#queue = new ImageQueue(resolveImages, (resolved) => this.#remember(resolved));

	constructor() {
		onDestroy(() => {
			clearTimeout(this.#refreshTimer);
			this.#queue.reset();
		});
	}

	#remember(artworks: WallArtwork[]): void {
		for (const artwork of artworks) this.#updated[artwork.id] = artwork;
	}

	apply(artworks: WallArtwork[]): WallArtwork[] {
		return artworks.map((artwork) => this.#updated[artwork.id] ?? artwork);
	}

	request(artwork: WallArtwork): void {
		this.#queue.request(artwork);
	}

	failed(artwork: WallArtwork): void {
		this.#failed.push(artwork);
		clearTimeout(this.#refreshTimer);
		this.#refreshTimer = setTimeout(() => void this.#refresh(), REFRESH_DELAY_MS);
	}

	reset(): void {
		this.#updated = {};
		this.#queue.reset();
	}

	async #refresh(): Promise<void> {
		const batch = this.#failed;
		this.#failed = [];
		this.#remember(await refreshExpiredImages(batch));
	}
}
