import { changeCount, mergedArtwork } from '#lib/compare/album-merge/album-merge.ts';
import type { ComparedSide } from '#lib/compare/types/compared-side.ts';
import type { MergeChanges } from '#lib/compare/types/merge-changes.ts';
import type { MergeField } from '#lib/compare/types/merge-field.ts';

function toggled<T>(items: readonly T[], item: T): T[] {
	return items.includes(item) ? items.filter((entry) => entry !== item) : [...items, item];
}

export class AlbumMerge {
	fields = $state.raw<MergeField[]>([]);
	images = $state.raw<string[]>([]);

	#mine: () => ComparedSide;
	#album: () => ComparedSide;

	constructor(mine: () => ComparedSide, album: () => ComparedSide) {
		this.#mine = mine;
		this.#album = album;
	}

	get changes(): MergeChanges {
		return { fields: this.fields, images: this.images };
	}

	get count(): number {
		return changeCount(this.changes);
	}

	get merged(): ComparedSide {
		return mergedArtwork(this.#mine(), this.#album(), this.changes);
	}

	toggleField(field: MergeField): void {
		this.fields = toggled(this.fields, field);
	}

	toggleImage(path: string): void {
		this.images = toggled(this.images, path);
	}
}
