import { untrack } from 'svelte';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import { resolveImages } from '#lib/wall/wall-data/wall-data.ts';

function mapOf<K, V>(entries: Iterable<readonly [K, V]> = []): Map<K, V> {
	return new Map(entries);
}

export class ResolvedImages {
	#resolved = $state.raw(mapOf<string, WallArtwork>());

	withImage = (artwork: WallArtwork): WallArtwork => this.#resolved.get(artwork.id) ?? artwork;

	follow(artworks: () => WallArtwork[]): void {
		$effect(() => {
			const pending = artworks().filter(
				(artwork) => artwork.pendingImage && !untrack(() => this.#resolved.has(artwork.id))
			);
			if (pending.length > 0) void this.resolve(pending);
		});
	}

	async resolve(artworks: WallArtwork[]): Promise<void> {
		const pending = artworks.filter((artwork) => artwork.pendingImage);
		if (pending.length === 0) return;
		const found = await resolveImages(pending);
		if (found.length === 0) return;
		this.#resolved = mapOf([
			...this.#resolved,
			...found.map((artwork) => [artwork.id, artwork] as const)
		]);
	}
}
