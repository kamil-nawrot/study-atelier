import { appendedNotes } from '#lib/values/value-form/value-form.ts';
import { sameName } from '#lib/albums/album-values/album-values.ts';
import { signedYear } from '#lib/catalogue/years/years.ts';
import { initialImages, mergedImages } from '#lib/compare/album-merge-images/album-merge-images.ts';
import type { ComparedSide } from '#lib/compare/types/compared-side.ts';
import type { MergeChanges } from '#lib/compare/types/merge-changes.ts';
import type { MergeField } from '#lib/compare/types/merge-field.ts';

export const MERGE_FIELDS: readonly MergeField[] = [
	'title',
	'authors',
	'date',
	'era',
	'type',
	'period',
	'styles',
	'materials',
	'location',
	'notes'
];

export type ListField = 'authors' | 'styles' | 'materials';

export function isListField(field: MergeField): field is ListField {
	return field === 'authors' || field === 'styles' || field === 'materials';
}

export function listOf(field: ListField, side: ComparedSide): string[] {
	if (field === 'authors') return side.authorUnknown ? [] : side.authors;
	return side[field];
}

export function missingFrom(field: ListField, mine: ComparedSide, album: ComparedSide): string[] {
	const own = listOf(field, mine);
	return listOf(field, album).filter((name) => !own.some((item) => sameName(item, name)));
}

export function itemKey(field: ListField, name: string): string {
	return `${field}/${name}`;
}

function singleOf(field: MergeField, side: ComparedSide): string | null {
	switch (field) {
		case 'title':
			return side.title.trim() || null;
		case 'date':
			return side.yearTo === null
				? null
				: [
						signedYear(side.yearFrom, side.fromBeforeCommonEra),
						signedYear(side.yearTo, side.toBeforeCommonEra),
						side.yearApproximate
					].join(' ');
		case 'type':
			return side.typeCode;
		case 'era':
			return side.eraCode;
		case 'period':
			return side.period?.trim() || null;
		case 'location':
			return side.location?.trim() || null;
		default:
			return null;
	}
}

function emptyOn(field: MergeField, side: ComparedSide): boolean {
	if (field === 'notes') return side.notes.trim() === '';
	if (isListField(field)) return listOf(field, side).length === 0;
	return singleOf(field, side) === null;
}

export function pickable(field: MergeField, mine: ComparedSide, album: ComparedSide): boolean {
	if (field === 'notes') {
		const description = album.notes.trim();
		return description !== '' && !mine.notes.includes(description);
	}
	if (isListField(field)) return missingFrom(field, mine, album).length > 0;
	const theirs = singleOf(field, album);
	const own = singleOf(field, mine);
	return theirs !== null && (own === null || !sameName(own, theirs));
}

function withField(field: MergeField, mine: ComparedSide, album: ComparedSide): ComparedSide {
	switch (field) {
		case 'date':
			return {
				...mine,
				yearFrom: album.yearFrom,
				fromBeforeCommonEra: album.fromBeforeCommonEra,
				yearTo: album.yearTo,
				toBeforeCommonEra: album.toBeforeCommonEra,
				yearApproximate: album.yearApproximate
			};
		case 'title':
			return { ...mine, title: album.title };
		case 'type':
			return { ...mine, typeCode: album.typeCode };
		case 'era':
			return { ...mine, eraCode: album.eraCode };
		case 'period':
			return { ...mine, period: album.period };
		case 'location':
			return { ...mine, location: album.location };
		case 'notes':
			return { ...mine, notes: appendedNotes(mine.notes, album.notes.trim()) };
		default:
			return mine;
	}
}

export function keptList(
	field: ListField,
	mine: ComparedSide,
	album: ComparedSide,
	changes: MergeChanges
): string[] {
	return [
		...listOf(field, mine).filter((name) => !changes.dropped.includes(itemKey(field, name))),
		...missingFrom(field, mine, album).filter((name) =>
			changes.added.includes(itemKey(field, name))
		)
	];
}

function withLists(
	merged: ComparedSide,
	mine: ComparedSide,
	album: ComparedSide,
	changes: MergeChanges
): ComparedSide {
	const authors = keptList('authors', mine, album, changes);
	const authorsChanged = changes.added
		.concat(changes.dropped)
		.some((key) => key.startsWith('authors/'));
	return {
		...merged,
		...(authorsChanged ? { authors, authorUnknown: authors.length === 0 } : {}),
		styles: keptList('styles', mine, album, changes),
		materials: keptList('materials', mine, album, changes)
	};
}

export function mergedArtwork(
	mine: ComparedSide,
	album: ComparedSide,
	changes: MergeChanges
): ComparedSide {
	const merged = MERGE_FIELDS.filter(
		(field) => changes.fields.includes(field) && pickable(field, mine, album)
	).reduce((side, field) => withField(field, side, album), mine);
	return { ...withLists(merged, mine, album, changes), ...mergedImages(mine, album, changes) };
}

export function initialChanges(mine: ComparedSide, album: ComparedSide): MergeChanges {
	const empty = MERGE_FIELDS.filter(
		(field) => emptyOn(field, mine) && pickable(field, mine, album)
	);
	return {
		fields: empty.filter((field) => !isListField(field)),
		added: empty
			.filter(isListField)
			.flatMap((field) => missingFrom(field, mine, album).map((name) => itemKey(field, name))),
		dropped: [],
		images: initialImages(mine, album),
		droppedImages: []
	};
}

export function changeCount(changes: MergeChanges): number {
	return (
		changes.fields.length +
		changes.added.length +
		changes.dropped.length +
		changes.images.length +
		changes.droppedImages.length
	);
}
