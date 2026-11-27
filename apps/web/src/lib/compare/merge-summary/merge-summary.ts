import { MERGE_FIELDS, isListField, pickable } from '#lib/compare/album-merge/album-merge.ts';
import { imagesOf, ownImageKey } from '#lib/compare/album-merge-images/album-merge-images.ts';
import type { ComparedSide } from '#lib/compare/types/compared-side.ts';
import type { MergeChanges } from '#lib/compare/types/merge-changes.ts';
import { m } from '#lib/i18n/i18n.ts';

const LISTS = ['authors', 'styles', 'materials'] as const;

function countOf(keys: readonly string[], field: string): number {
	return keys.filter((key) => key.startsWith(`${field}/`)).length;
}

export function takenParts(
	mine: ComparedSide,
	album: ComparedSide,
	changes: MergeChanges
): string[] {
	const fields = MERGE_FIELDS.filter(
		(field) => !isListField(field) && changes.fields.includes(field) && pickable(field, mine, album)
	).map((field) => m.compare.takenFields[field as keyof typeof m.compare.takenFields]);
	const lists = LISTS.flatMap((field) => {
		const count = countOf(changes.added, field);
		return count === 0 ? [] : [m.compare.takenItems[field](count)];
	});
	const images =
		changes.images.length === 0 ? [] : [m.compare.takenItems.images(changes.images.length)];
	return [...fields, ...lists, ...images];
}

export function removedParts(mine: ComparedSide, changes: MergeChanges): string[] {
	const names = changes.dropped.map((key) => key.slice(key.indexOf('/') + 1));
	const images = imagesOf(mine).filter((image, index) =>
		changes.droppedImages.includes(ownImageKey(image, index))
	).length;
	return [...names, ...(images === 0 ? [] : [m.compare.takenItems.images(images)])];
}
