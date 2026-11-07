import { SvelteMap, SvelteSet } from 'svelte/reactivity';
import { loadArtworkNotes } from '#lib/exhibitions/exhibition-artworks-data/exhibition-artworks-data.ts';
import { loadNoteLinkLabels, mentionsLinks } from '#lib/notes/note-link-data/note-link-data.ts';
import { WallImages } from '#lib/wall/wall-images/wall-images.svelte.ts';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import type { BlockNote } from '#lib/exhibitions/types/block-note.ts';

export class ArtworkLookup {
	#artworks = new SvelteMap<string, WallArtwork>();
	#notes = new SvelteMap<string, BlockNote>();
	#asked = new SvelteSet<string>();
	#images = new WallImages();

	get(id: string): WallArtwork | undefined {
		const artwork = this.#artworks.get(id);
		return artwork && this.#images.apply([artwork])[0];
	}

	add(artworks: readonly WallArtwork[]): void {
		for (const artwork of artworks) {
			const known = this.#artworks.get(artwork.id);
			if (known && !known.pendingImage) continue;
			this.#artworks.set(artwork.id, artwork);
			if (artwork.pendingImage) this.#images.request(artwork);
		}
	}

	imageFailed(artwork: WallArtwork): void {
		this.#images.failed(artwork);
	}

	note(id: string): BlockNote | undefined {
		return this.#notes.get(id);
	}

	async wantNote(id: string): Promise<void> {
		if (this.#asked.has(id)) return;
		this.#asked.add(id);
		const { notes } = await loadArtworkNotes([id]);
		const text = notes.get(id) ?? '';
		this.#notes.set(id, { text });
		const artwork = this.#artworks.get(id);
		if (!artwork || !mentionsLinks(text)) return;
		const links = await loadNoteLinkLabels({ artworkNumber: artwork.number });
		if (links) this.#notes.set(id, { text, links });
	}
}
