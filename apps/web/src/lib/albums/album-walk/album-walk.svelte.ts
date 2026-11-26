import { loadArtworkVersion } from '#lib/albums/album-version-load/album-version-load.ts';
import type { Album } from '#lib/albums/types/album.ts';
import type { AlbumArtwork } from '#lib/albums/types/album-artwork.ts';
import type { AlbumVersion } from '#lib/albums/types/album-version.ts';
import type { AlbumWalkStatus } from '#lib/albums/types/album-walk-status.ts';

export class AlbumWalk {
	readonly album: Album;
	readonly artworks: AlbumArtwork[];
	index = $state(0);
	finished = $state(false);
	version = $state.raw<AlbumVersion>();
	error = $state('');

	#outcomes = $state<Record<string, 'saved' | 'skipped'>>({});
	#opening = 0;

	constructor(album: Album, artworks: AlbumArtwork[]) {
		this.album = album;
		this.artworks = artworks;
	}

	get current(): AlbumArtwork | undefined {
		return this.finished ? undefined : this.artworks[this.index];
	}

	get last(): boolean {
		return this.index === this.artworks.length - 1;
	}

	get added(): number {
		return Object.values(this.#outcomes).filter((outcome) => outcome === 'saved').length;
	}

	statusOf(artwork: AlbumArtwork): AlbumWalkStatus {
		if (artwork.id === this.current?.id) return 'current';
		return this.#outcomes[artwork.id] ?? 'todo';
	}

	async open(): Promise<void> {
		const artwork = this.current;
		const ticket = ++this.#opening;
		this.version = undefined;
		this.error = '';
		if (!artwork) return;
		const result = await loadArtworkVersion(this.album, artwork);
		if (ticket !== this.#opening) return;
		this.version = result.version;
		this.error = result.error ?? '';
	}

	saved(): Promise<void> {
		return this.#leave('saved');
	}

	skip(): Promise<void> {
		return this.#leave('skipped');
	}

	finish(): void {
		this.#opening++;
		this.finished = true;
	}

	async #leave(outcome: 'saved' | 'skipped'): Promise<void> {
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
