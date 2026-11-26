import { sameName } from '#lib/albums/album-values/album-values.ts';
import { MAX_ARTWORK_IMAGES } from '#lib/artworks/artwork-form/artwork-form.ts';
import { signedYear } from '#lib/catalogue/years/years.ts';
import type { ArtworkImageInput } from '#lib/catalogue/types/artwork-image-input.ts';
import type { ComparedSide } from '#lib/compare/types/compared-side.ts';
import type { MergeAction } from '#lib/compare/types/merge-action.ts';
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

type ListField = 'authors' | 'styles' | 'materials';

function isListField(field: MergeField): field is ListField {
	return field === 'authors' || field === 'styles' || field === 'materials';
}

function listOf(field: ListField, side: ComparedSide): string[] {
	if (field === 'authors') return side.authorUnknown ? [] : side.authors;
	return side[field];
}

function missingFrom(field: ListField, mine: ComparedSide, album: ComparedSide): string[] {
	const own = listOf(field, mine);
	return listOf(field, album).filter((name) => !own.some((item) => sameName(item, name)));
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

function appendedNote(mine: string, description: string): string {
	return mine.trim() === '' ? description : `${mine.trimEnd()}\n\n${description}`;
}

export function offeredAction(
	field: MergeField,
	mine: ComparedSide,
	album: ComparedSide
): MergeAction | null {
	if (field === 'notes') {
		const description = album.notes.trim();
		return description !== '' && !mine.notes.includes(description) ? 'append' : null;
	}
	if (isListField(field)) {
		if (missingFrom(field, mine, album).length === 0) return null;
		return listOf(field, mine).length === 0 ? 'move' : 'add';
	}
	const theirs = singleOf(field, album);
	const own = singleOf(field, mine);
	if (theirs === null || (own !== null && sameName(own, theirs))) return null;
	return own === null ? 'move' : 'replace';
}

function withField(field: MergeField, mine: ComparedSide, album: ComparedSide): ComparedSide {
	switch (field) {
		case 'title':
			return { ...mine, title: album.title };
		case 'authors':
			return {
				...mine,
				authors: [...listOf('authors', mine), ...missingFrom('authors', mine, album)],
				authorUnknown: false
			};
		case 'styles':
		case 'materials':
			return { ...mine, [field]: [...mine[field], ...missingFrom(field, mine, album)] };
		case 'date':
			return {
				...mine,
				yearFrom: album.yearFrom,
				fromBeforeCommonEra: album.fromBeforeCommonEra,
				yearTo: album.yearTo,
				toBeforeCommonEra: album.toBeforeCommonEra,
				yearApproximate: album.yearApproximate
			};
		case 'type':
			return { ...mine, typeCode: album.typeCode };
		case 'era':
			return { ...mine, eraCode: album.eraCode };
		case 'period':
			return { ...mine, period: album.period };
		case 'location':
			return { ...mine, location: album.location };
		case 'notes':
			return { ...mine, notes: appendedNote(mine.notes, album.notes.trim()) };
	}
}

function albumPath(image: ArtworkImageInput | null): string | null {
	return image?.kind === 'album' ? image.path : null;
}

function imagesOf(side: ComparedSide): ArtworkImageInput[] {
	return [side.image, ...side.images].filter((image) => image !== null);
}

export function albumImages(album: ComparedSide): ArtworkImageInput[] {
	return imagesOf(album);
}

export function hasImage(mine: ComparedSide, path: string): boolean {
	return imagesOf(mine).some((image) => albumPath(image) === path);
}

export function imageAttachable(mine: ComparedSide, changes: MergeChanges, path: string): boolean {
	if (hasImage(mine, path)) return false;
	return (
		changes.images.includes(path) ||
		imagesOf(mine).length + changes.images.length < MAX_ARTWORK_IMAGES
	);
}

export function mergedArtwork(
	mine: ComparedSide,
	album: ComparedSide,
	changes: MergeChanges
): ComparedSide {
	const merged = MERGE_FIELDS.filter((field) => changes.fields.includes(field)).reduce(
		(side, field) => withField(field, side, album),
		mine
	);
	const attached = imagesOf(album).filter((image) => {
		const path = albumPath(image);
		return path !== null && changes.images.includes(path) && !hasImage(mine, path);
	});
	const [image = null, ...images] = [...imagesOf(mine), ...attached];
	return { ...merged, image, images };
}

export function changeCount(changes: MergeChanges): number {
	return changes.fields.length + changes.images.length;
}
