import {
	changeCount,
	initialChanges,
	itemKey,
	mergedArtwork,
	type ListField
} from '#lib/compare/album-merge/album-merge.ts';
import type { ComparedSide } from '#lib/compare/types/compared-side.ts';
import type { MergeChanges } from '#lib/compare/types/merge-changes.ts';
import type { MergeField } from '#lib/compare/types/merge-field.ts';

function toggled<T>(items: readonly T[], item: T): T[] {
	return items.includes(item) ? items.filter((entry) => entry !== item) : [...items, item];
}

export class AlbumMerge {
	changes = $state.raw<MergeChanges>({
		fields: [],
		added: [],
		dropped: [],
		images: [],
		droppedImages: []
	});

	#mine: () => ComparedSide;
	#album: () => ComparedSide;

	constructor(mine: () => ComparedSide, album: () => ComparedSide) {
		this.#mine = mine;
		this.#album = album;
		this.changes = initialChanges(mine(), album());
	}

	get count(): number {
		return changeCount(this.changes);
	}

	get merged(): ComparedSide {
		return mergedArtwork(this.#mine(), this.#album(), this.changes);
	}

	pickField(field: MergeField, fromAlbum: boolean): void {
		if (this.changes.fields.includes(field) === fromAlbum) return;
		this.changes = { ...this.changes, fields: toggled(this.changes.fields, field) };
	}

	toggleAdded(field: ListField, name: string): void {
		this.changes = { ...this.changes, added: toggled(this.changes.added, itemKey(field, name)) };
	}

	toggleDropped(field: ListField, name: string): void {
		this.changes = {
			...this.changes,
			dropped: toggled(this.changes.dropped, itemKey(field, name))
		};
	}

	toggleImage(path: string): void {
		this.changes = { ...this.changes, images: toggled(this.changes.images, path) };
	}

	toggleOwnImage(key: string): void {
		this.changes = { ...this.changes, droppedImages: toggled(this.changes.droppedImages, key) };
	}
}
