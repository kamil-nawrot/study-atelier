import type { WallArtwork } from './types.ts';

export const IMAGE_BATCH_SIZE = 50;
export const IMAGE_BATCH_DELAY = 100;

export class ImageQueue {
	#requested = new Set<string>();
	#waiting: WallArtwork[] = [];
	#timer: ReturnType<typeof setTimeout> | undefined;
	#running = false;
	#generation = 0;

	constructor(
		private resolve: (artworks: WallArtwork[]) => Promise<WallArtwork[]>,
		private onresolved: (artworks: WallArtwork[]) => void
	) {}

	request(artwork: WallArtwork): void {
		if (!artwork.pendingImage || this.#requested.has(artwork.id)) return;
		this.#requested.add(artwork.id);
		this.#waiting.push(artwork);
		if (this.#running) return;
		clearTimeout(this.#timer);
		this.#timer = setTimeout(() => void this.#drain(), IMAGE_BATCH_DELAY);
	}

	reset(): void {
		this.#generation++;
		this.#requested.clear();
		this.#waiting = [];
		clearTimeout(this.#timer);
		this.#running = false;
	}

	async #drain(): Promise<void> {
		const generation = this.#generation;
		this.#running = true;
		try {
			while (this.#waiting.length > 0) {
				const batch = this.#waiting.splice(0, IMAGE_BATCH_SIZE);
				const resolved = await this.resolve(batch);
				if (generation !== this.#generation) return;
				this.onresolved(resolved);
			}
		} catch {
			return;
		} finally {
			if (generation === this.#generation) this.#running = false;
		}
	}
}
