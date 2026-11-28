import { SvelteSet } from 'svelte/reactivity';
import { loadArtworkVersion } from '#lib/albums/album-version-load/album-version-load.ts';
import { loadArtwork } from '#lib/artworks/artwork-data/artwork-data.ts';
import type { ArtworkRecord } from '#lib/artworks/types/artwork-record.ts';
import type { Album } from '#lib/albums/types/album.ts';
import type { AlbumArtwork } from '#lib/albums/types/album-artwork.ts';
import type { AlbumVersion } from '#lib/albums/types/album-version.ts';
import type { AlbumWalkStatus } from '#lib/albums/types/album-walk-status.ts';

type Outcome = 'saved' | 'merged' | 'skipped';

export class AlbumWalk {
	readonly album: Album;
	readonly artworks: AlbumArtwork[];
	index = $state(0);
	finished = $state(false);
	version = $state.raw<AlbumVersion>();
	mine = $state.raw<ArtworkRecord>();
	error = $state('');
	picking = $state(false);
	pickError = $state('');

	readonly #similar: Record<string, number>;
	readonly #chosen: Record<string, number> = {};
	readonly #asNew = new SvelteSet<string>();
	#outcomes = $state<Record<string, Outcome>>({});
	#opening = 0;

	constructor(album: Album, artworks: AlbumArtwork[], similar: Record<string, number> = {}) {
		this.album = album;
		this.artworks = artworks;
		this.#similar = similar;
	}

	get comparing(): boolean {
		const artwork = this.current;
		return Boolean(artwork && this.mine && !this.picking && !this.#asNew.has(artwork.id));
	}

	get chosen(): boolean {
		const artwork = this.current;
		return Boolean(artwork && this.#chosen[artwork.id] !== undefined);
	}

	get current(): AlbumArtwork | undefined {
		return this.finished ? undefined : this.artworks[this.index];
	}

	get last(): boolean {
		return this.index === this.artworks.length - 1;
	}

	get savedIds(): string[] {
		return this.artworks
			.filter((artwork) => {
				const outcome = this.#outcomes[artwork.id];
				return outcome === 'saved' || outcome === 'merged';
			})
			.map((artwork) => artwork.id);
	}

	get added(): number {
		return this.#count('saved');
	}

	get merged(): number {
		return this.#count('merged');
	}

	statusOf(artwork: AlbumArtwork): AlbumWalkStatus {
		if (artwork.id === this.current?.id) return 'current';
		return this.#outcomes[artwork.id] ?? 'todo';
	}

	async open(): Promise<void> {
		const artwork = this.current;
		const ticket = ++this.#opening;
		this.version = undefined;
		this.mine = undefined;
		this.error = '';
		this.picking = false;
		if (!artwork) return;
		const number = this.#chosen[artwork.id] ?? this.#similar[artwork.id];
		const [result, mine] = await Promise.all([
			loadArtworkVersion(this.album, artwork),
			number === undefined ? undefined : loadArtwork(number)
		]);
		if (ticket !== this.#opening) return;
		this.version = result.version;
		this.mine = mine?.artwork;
		this.error = result.error ?? '';
	}

	addAsNew(): void {
		const artwork = this.current;
		if (artwork) this.#asNew.add(artwork.id);
	}

	pick(): void {
		this.pickError = '';
		this.picking = true;
	}

	cancelPick(): void {
		this.#opening++;
		this.picking = false;
	}

	async compareWith(number: number): Promise<void> {
		const artwork = this.current;
		if (!artwork) return;
		const ticket = ++this.#opening;
		this.pickError = '';
		const result = await loadArtwork(number);
		if (ticket !== this.#opening) return;
		if (!result.artwork) {
			this.pickError = result.error ?? '';
			return;
		}
		this.#chosen[artwork.id] = number;
		this.#asNew.delete(artwork.id);
		this.mine = result.artwork;
		this.picking = false;
	}

	saved(): Promise<void> {
		return this.#leave('saved');
	}

	completed(): Promise<void> {
		return this.#leave('merged');
	}

	skip(): Promise<void> {
		return this.#leave('skipped');
	}

	finish(): void {
		this.#opening++;
		this.finished = true;
	}

	#count(outcome: Outcome): number {
		return Object.values(this.#outcomes).filter((value) => value === outcome).length;
	}

	async #leave(outcome: Outcome): Promise<void> {
		const artwork = this.current;
		if (!artwork) return;
		this.#outcomes[artwork.id] = outcome;
		if (this.last) {
			this.finish();
			return;
		}
		this.index++;
		await this.open();
	}
}
