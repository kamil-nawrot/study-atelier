import { SvelteSet } from 'svelte/reactivity';
import { albumItems, selectableItem, startsSelected } from '#lib/albums/album-items/album-items.ts';
import { loadItemData } from '#lib/albums/album-items-data/album-items-data.ts';
import { AlbumWalk } from '#lib/albums/album-walk/album-walk.svelte.ts';
import { m } from '#lib/i18n/i18n.ts';
import type { Album } from '#lib/albums/types/album.ts';
import type { AlbumAddPhase } from '#lib/albums/types/album-add-phase.ts';
import type { AlbumArtwork } from '#lib/albums/types/album-artwork.ts';
import type { AlbumItem } from '#lib/albums/types/album-item.ts';
import type { CardIndexData } from '#lib/catalogue/types/card-index-data.ts';
import type { GlossaryTerm } from '#lib/glossary/types/glossary-term.ts';

const NO_MATCHES = { entries: [], events: [], records: [], details: {} };

export class AlbumAdd {
	readonly walk: AlbumWalk;
	readonly selected = new SvelteSet<string>();
	phase = $state<AlbumAddPhase>('artworks');
	items = $state.raw<AlbumItem[]>([]);
	terms = $state.raw<GlossaryTerm[]>([]);
	index = $state.raw<CardIndexData>();
	queue = $state.raw<AlbumItem[]>([]);
	position = $state(0);
	itemsAdded = $state(0);
	error = $state('');

	constructor(
		private readonly album: Album,
		artworks: AlbumArtwork[]
	) {
		this.walk = new AlbumWalk(album, artworks);
	}

	get current(): AlbumItem | undefined {
		return this.queue[this.position];
	}

	get lastItem(): boolean {
		return this.position === this.queue.length - 1;
	}

	get message(): string {
		const title = this.album.title;
		return this.itemsAdded > 0
			? m.albums.closing.done(title, this.walk.added, this.itemsAdded)
			: m.albums.walk.done(title, this.walk.added);
	}

	start(): Promise<void> {
		return this.walk.open();
	}

	async artworkSaved(): Promise<void> {
		await this.walk.saved();
		await this.#afterArtwork();
	}

	async artworkSkipped(): Promise<void> {
		await this.walk.skip();
		await this.#afterArtwork();
	}

	async artworksFinished(): Promise<void> {
		this.walk.finish();
		await this.#afterArtwork();
	}

	skipAll(): void {
		this.phase = 'done';
	}

	addSelected(): void {
		this.queue = this.items.filter((item) => this.selected.has(item.key));
		this.position = 0;
		this.phase = this.queue.length > 0 ? 'items' : 'done';
	}

	itemSaved(): void {
		this.itemsAdded++;
		this.#nextItem();
	}

	itemSkipped(): void {
		this.#nextItem();
	}

	itemsFinished(): void {
		this.phase = 'done';
	}

	toggle(item: AlbumItem): void {
		if (!selectableItem(item)) return;
		if (this.selected.has(item.key)) this.selected.delete(item.key);
		else this.selected.add(item.key);
	}

	#nextItem(): void {
		if (this.lastItem) this.phase = 'done';
		else this.position++;
	}

	async #afterArtwork(): Promise<void> {
		if (!this.walk.finished) return;
		if (albumItems(this.album, NO_MATCHES, []).length === 0) {
			this.phase = 'done';
			return;
		}
		this.phase = 'loading';
		const data = await loadItemData(this.album);
		if (data.error) {
			this.error = data.error;
			this.phase = 'choose';
			return;
		}
		this.items = albumItems(this.album, data.matches, this.walk.savedIds);
		this.terms = data.entries;
		this.index = data.index;
		this.selected.clear();
		for (const item of this.items) if (startsSelected(item)) this.selected.add(item.key);
		this.phase = 'choose';
	}
}
