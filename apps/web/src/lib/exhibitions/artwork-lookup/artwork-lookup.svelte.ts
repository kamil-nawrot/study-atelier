import { untrack } from 'svelte';
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

export type PicturesResult = { error?: string };

type PictureLoad = { done: Promise<PicturesResult>; failed: boolean };

type Queued = { id: string; resolve: (result: PicturesResult) => void };

export class ArtworkLookup {
	#artworks = new SvelteMap<string, WallArtwork>();
	#notes = new SvelteMap<string, BlockNote>();
	#noteLoads = new SvelteMap<string, Promise<void>>();
	#withNotes = new SvelteSet<string>();
	#notesChecked = new SvelteSet<string>();
	#pictures = new SvelteMap<string, ArtworkImageInput[]>();
	#pictureErrors = new SvelteSet<string>();
	#pictureLoads = new SvelteMap<string, PictureLoad>();
	#queued: Queued[] = [];
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

	checkNotes(ids: readonly string[]): Promise<void> {
		return untrack(() => this.#checkNotes(ids));
	}

	async #checkNotes(ids: readonly string[]): Promise<void> {
		const unknown = ids.filter(
			(id, index) => ids.indexOf(id) === index && !this.#notesChecked.has(id)
		);
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

	picturesFailed(id: string): boolean {
		return this.#pictureErrors.has(id);
	}

	wantPictures(id: string, again = false): Promise<PicturesResult> {
		return untrack(() => this.#wantPictures(id, again));
	}

	#wantPictures(id: string, again: boolean): Promise<PicturesResult> {
		const known = this.#pictureLoads.get(id);
		if (known && !(again && known.failed)) return known.done;
		const load: PictureLoad = { done: this.#queuePictures(id), failed: false };
		void load.done.then((result) => (load.failed = result.error !== undefined));
		this.#pictureLoads.set(id, load);
		return load.done;
	}

	#queuePictures(id: string): Promise<PicturesResult> {
		return new Promise((resolve) => {
			if (this.#queued.length === 0) queueMicrotask(() => void this.#loadQueued());
			this.#queued.push({ id, resolve });
		});
	}

	async #loadQueued(): Promise<void> {
		const queued = this.#queued;
		this.#queued = [];
		const { images, error } = await loadArtworkImages(queued.map(({ id }) => id));
		for (const { id, resolve } of queued) {
			if (error) {
				this.#pictureErrors.add(id);
			} else {
				this.#pictureErrors.delete(id);
				this.#pictures.set(id, images.get(id) ?? []);
			}
			resolve(error === undefined ? {} : { error });
		}
	}

	wantNote(id: string): Promise<void> {
		return untrack(() => this.#wantNote(id));
	}

	#wantNote(id: string): Promise<void> {
		const known = this.#noteLoads.get(id);
		if (known) return known;
		const load = this.#loadNote(id);
		this.#noteLoads.set(id, load);
		return load;
	}

	async #loadNote(id: string): Promise<void> {
		const { notes, error } = await loadArtworkNotes([id]);
		if (error) {
			this.#noteLoads.delete(id);
			return;
		}
		const text = notes.get(id) ?? '';
		this.#notes.set(id, { text });
		const artwork = this.#artworks.get(id);
		if (!artwork || !mentionsLinks(text)) return;
		const links = await loadNoteLinkLabels({ artworkNumber: artwork.number });
		if (links) this.#notes.set(id, { text, links });
	}
}
