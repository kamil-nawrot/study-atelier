import { SvelteMap, SvelteSet } from 'svelte/reactivity';
import type { ArtworkImageInput } from '#lib/catalogue/types/artwork-image-input.ts';
import {
	loadArtworkNotes,
	loadArtworksWithNotes
} from '#lib/exhibitions/exhibition-artworks-data/exhibition-artworks-data.ts';
import { loadArtworkImages } from '#lib/exhibitions/exhibition-images-data/exhibition-images-data.ts';
import { loadNoteLinkLabels, mentionsLinks } from '#lib/notes/note-link-data/note-link-data.ts';
import { WallImages } from '#lib/wall/wall-images/wall-images.svelte.ts';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import type { BlockNote } from '#lib/exhibitions/types/block-note.ts';

export class ArtworkLookup {
	#artworks = new SvelteMap<string, WallArtwork>();
	#notes = new SvelteMap<string, BlockNote>();
	#asked = new SvelteSet<string>();
	#withNotes = new SvelteSet<string>();
	#notesChecked = new SvelteSet<string>();
	#pictures = new SvelteMap<string, ArtworkImageInput[]>();
	#pictureAsked = new SvelteSet<string>();
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

	hasNote(id: string): boolean {
		return this.#withNotes.has(id);
	}

	async checkNotes(ids: readonly string[]): Promise<void> {
		const unknown = ids.filter((id) => !this.#notesChecked.has(id));
		if (unknown.length === 0) return;
		for (const id of unknown) this.#notesChecked.add(id);
		const { ids: found, error } = await loadArtworksWithNotes(unknown);
		if (error) {
			for (const id of unknown) this.#notesChecked.delete(id);
			return;
		}
		for (const id of found) this.#withNotes.add(id);
	}

	note(id: string): BlockNote | undefined {
		return this.#notes.get(id);
	}

	pictures(id: string): ArtworkImageInput[] | undefined {
		return this.#pictures.get(id);
	}

	async wantPictures(id: string): Promise<void> {
		if (this.#pictureAsked.has(id)) return;
		this.#pictureAsked.add(id);
		const { images, error } = await loadArtworkImages([id]);
		if (error) {
			this.#pictureAsked.delete(id);
			return;
		}
		this.#pictures.set(id, images.get(id) ?? []);
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
