import { valueKey } from '#lib/albums/album-version/album-version.ts';
import { sameName } from '#lib/albums/album-values/album-values.ts';
import type { CategoryCode } from '#lib/catalogue/types/category-code.ts';
import {
	MERGE_FIELDS,
	isListField,
	itemKey,
	listOf,
	missingFrom,
	pickable,
	type ListField
} from '#lib/compare/album-merge/album-merge.ts';
import { fieldLabel, fieldValues } from '#lib/compare/comparison-rows/comparison-rows.ts';
import type { ComparedSide } from '#lib/compare/types/compared-side.ts';
import type { DisplayRow } from '#lib/compare/types/display-row.ts';
import type { MergeChanges } from '#lib/compare/types/merge-changes.ts';
import type { MergeField } from '#lib/compare/types/merge-field.ts';
import type { MergeRow, TickItem } from '#lib/compare/types/merge-row.ts';
import type { RowCellItem } from '#lib/compare/types/row-cell-item.ts';

export type MergeHandlers = {
	pick: (field: MergeField, fromAlbum: boolean) => void;
	toggleAdded: (field: ListField, name: string) => void;
	toggleDropped: (field: ListField, name: string) => void;
};

export type MergeSides = {
	mine: ComparedSide;
	album: ComparedSide;
	newValues: readonly string[];
	changes: MergeChanges;
	handlers: MergeHandlers;
};

const CATEGORIES: Partial<Record<MergeField, CategoryCode>> = {
	authors: 'author',
	period: 'period',
	styles: 'style',
	materials: 'material',
	location: 'location'
};

function isNew(field: MergeField, text: string, newValues: readonly string[]): boolean {
	const category = CATEGORIES[field];
	return category !== undefined && newValues.includes(valueKey(category, text));
}

function items(field: MergeField, side: ComparedSide, newValues: readonly string[]): RowCellItem[] {
	return fieldValues(field, side).map((text) => ({
		text,
		...(isNew(field, text, newValues) ? { isNew: true } : {})
	}));
}

function sameValues(left: readonly RowCellItem[], right: readonly RowCellItem[]): boolean {
	return (
		left.length === right.length &&
		left.every((item, index) => sameName(item.text, right[index].text))
	);
}

export function fixedRow(row: DisplayRow): MergeRow {
	const mine = row.left;
	const album = row.right;
	const base = { key: row.key, label: row.label, ...(row.text ? { text: true } : {}) };
	return sameValues(mine, album)
		? { ...base, kind: 'same', value: mine }
		: { ...base, kind: 'plain', mine, album };
}

function listRow(field: ListField, sides: MergeSides): MergeRow {
	const { mine, album, changes, handlers, newValues } = sides;
	const missing = missingFrom(field, mine, album);
	const own: TickItem[] = listOf(field, mine).map((text) => ({
		text,
		ticked: !changes.dropped.includes(itemKey(field, text)),
		ontoggle: () => handlers.toggleDropped(field, text)
	}));
	const theirs: TickItem[] = listOf(field, album).map((text) =>
		missing.includes(text)
			? {
					text,
					...(isNew(field, text, newValues) ? { isNew: true } : {}),
					ticked: changes.added.includes(itemKey(field, text)),
					ontoggle: () => handlers.toggleAdded(field, text)
				}
			: { text }
	);
	return { key: field, label: fieldLabel(field), kind: 'tick', mine: own, album: theirs };
}

function notesRow(sides: MergeSides): MergeRow {
	const { mine, album, changes, handlers } = sides;
	const own = mine.notes.trim();
	return {
		key: 'notes',
		label: fieldLabel('notes'),
		text: true,
		kind: 'tick',
		mine: own === '' ? [] : [{ text: own }],
		album: [
			{
				text: album.notes.trim(),
				ticked: changes.fields.includes('notes'),
				ontoggle: () => handlers.pick('notes', !changes.fields.includes('notes'))
			}
		]
	};
}

export function mergeRow(field: MergeField, sides: MergeSides): MergeRow {
	const { mine, album, changes, handlers, newValues } = sides;
	if (!pickable(field, mine, album)) {
		return fixedRow({
			key: field,
			label: fieldLabel(field),
			left: items(field, mine, []),
			right: items(field, album, newValues),
			...(field === 'notes' ? { text: true } : {})
		});
	}
	if (field === 'notes') return notesRow(sides);
	if (isListField(field)) return listRow(field, sides);
	return {
		key: field,
		label: fieldLabel(field),
		kind: 'pick',
		mine: items(field, mine, []),
		album: items(field, album, newValues),
		fromAlbum: changes.fields.includes(field),
		onpick: (fromAlbum) => handlers.pick(field, fromAlbum)
	};
}

export function mergeRows(sides: MergeSides): MergeRow[] {
	return MERGE_FIELDS.map((field) => mergeRow(field, sides)).filter(
		(row) => row.kind !== 'same' || row.value.length > 0
	);
}
