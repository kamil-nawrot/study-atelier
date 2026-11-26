import { formatDate, signedYear } from '#lib/catalogue/years/years.ts';
import type { OwnFieldDefinition } from '#lib/card-index/types/own-field-definition.ts';
import type { OwnEntry } from '#lib/catalogue/types/own-entry.ts';
import type { ComparedSide } from '#lib/compare/types/compared-side.ts';
import type { DisplayRow } from '#lib/compare/types/display-row.ts';
import type { RowCellItem } from '#lib/compare/types/row-cell-item.ts';
import type { MergeField } from '#lib/compare/types/merge-field.ts';
import { m } from '#lib/i18n/i18n.ts';

export const SHARED_FIELDS: readonly MergeField[] = [
	'authors',
	'date',
	'era',
	'type',
	'period',
	'styles',
	'materials',
	'location'
];

export function fieldLabel(field: MergeField): string {
	switch (field) {
		case 'title':
			return m.artworkForm.title;
		case 'authors':
			return m.artworkForm.authors;
		case 'date':
			return m.artworkForm.year;
		case 'type':
			return m.artworkForm.type;
		case 'era':
			return m.artworkForm.era;
		case 'period':
			return m.artworkForm.period;
		case 'styles':
			return m.artworkForm.style;
		case 'materials':
			return m.artworkForm.material;
		case 'location':
			return m.artworkForm.location;
		case 'notes':
			return m.common.notes;
	}
}

export function dateOf(side: ComparedSide): string | null {
	if (side.yearTo === null) return null;
	return (
		formatDate(
			signedYear(side.yearFrom, side.fromBeforeCommonEra),
			signedYear(side.yearTo, side.toBeforeCommonEra),
			side.yearApproximate
		) ?? null
	);
}

function cells(texts: readonly string[]): RowCellItem[] {
	return texts.map((text) => ({ text }));
}

function single(value: string | null): string[] {
	return value === null || value.trim() === '' ? [] : [value];
}

const SINGLE_VALUES: Record<
	Exclude<MergeField, 'authors' | 'styles' | 'materials'>,
	(side: ComparedSide) => string | null
> = {
	title: (side) => side.title,
	date: dateOf,
	type: (side) => (side.typeCode ? m.artworkTypes[side.typeCode] : null),
	era: (side) => (side.eraCode ? m.eras[side.eraCode].name : null),
	period: (side) => side.period,
	location: (side) => side.location,
	notes: (side) => side.notes.trim()
};

export function fieldValues(field: MergeField, side: ComparedSide): string[] {
	if (field === 'authors') {
		return side.authorUnknown || side.authors.length === 0 ? [m.ui.unknownAuthor] : side.authors;
	}
	if (field === 'styles' || field === 'materials') return side[field];
	return single(SINGLE_VALUES[field](side));
}

export function wikidataOf(side: ComparedSide): string | null {
	for (const image of [side.image, ...side.images]) {
		if ((image?.kind === 'commons' || image?.kind === 'album') && image.wikidataId) {
			return image.wikidataId;
		}
	}
	return null;
}

function entryValues(entry: OwnEntry | undefined): string[] {
	if (entry === undefined || entry === false) return [];
	if (entry === true) return [m.ownFields.ticked];
	return Array.isArray(entry) ? entry : single(entry.trim() === '' ? null : entry.trim());
}

export function ownFieldRows(
	left: ComparedSide,
	right: ComparedSide,
	fields: readonly OwnFieldDefinition[]
): DisplayRow[] {
	return fields.flatMap((field) => {
		const mine = entryValues(left.own?.[field.id]);
		const theirs = entryValues(right.own?.[field.id]);
		if (mine.length + theirs.length === 0) return [];
		return [{ key: `own:${field.id}`, label: field.name, left: cells(mine), right: cells(theirs) }];
	});
}

export function wikidataRow(left: string | null, right: string | null): DisplayRow {
	return {
		key: 'wikidata',
		label: m.compare.wikidata,
		left: cells(single(left)),
		right: cells(single(right))
	};
}

export function comparisonRows(
	left: ComparedSide,
	right: ComparedSide,
	fields: readonly OwnFieldDefinition[]
): DisplayRow[] {
	return [
		...SHARED_FIELDS.map((field) => ({
			key: field,
			label: fieldLabel(field),
			left: cells(fieldValues(field, left)),
			right: cells(fieldValues(field, right))
		})),
		...ownFieldRows(left, right, fields),
		wikidataRow(wikidataOf(left), wikidataOf(right))
	];
}
