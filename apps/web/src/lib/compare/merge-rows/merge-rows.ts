import { valueKey } from '#lib/albums/album-version/album-version.ts';
import type { CategoryCode } from '#lib/catalogue/types/category-code.ts';
import { MERGE_FIELDS, offeredAction } from '#lib/compare/album-merge/album-merge.ts';
import { fieldLabel, fieldValues } from '#lib/compare/comparison-rows/comparison-rows.ts';
import type { ComparedSide } from '#lib/compare/types/compared-side.ts';
import type { DisplayRow } from '#lib/compare/types/display-row.ts';
import type { MergeAction } from '#lib/compare/types/merge-action.ts';
import type { MergeChanges } from '#lib/compare/types/merge-changes.ts';
import type { MergeField } from '#lib/compare/types/merge-field.ts';
import type { RowAction } from '#lib/compare/types/row-action.ts';
import type { RowCellItem } from '#lib/compare/types/row-cell-item.ts';
import { m } from '#lib/i18n/i18n.ts';

type MergeSides = {
	mine: ComparedSide;
	album: ComparedSide;
	merged: ComparedSide;
	newValues: readonly string[];
	changes: MergeChanges;
	ontoggle: (field: MergeField) => void;
};

const CATEGORIES: Partial<Record<MergeField, CategoryCode>> = {
	authors: 'author',
	period: 'period',
	styles: 'style',
	materials: 'material',
	location: 'location'
};

const ACTION_LABELS: Record<MergeAction, string> = {
	move: m.compare.move,
	add: m.compare.add,
	replace: m.compare.replace,
	append: m.compare.appendNote
};

function items(field: MergeField, side: ComparedSide, newValues: readonly string[]): RowCellItem[] {
	const category = CATEGORIES[field];
	return fieldValues(field, side).map((text) => ({
		text,
		...(category && newValues.includes(valueKey(category, text)) ? { isNew: true } : {})
	}));
}

function leftItems(field: MergeField, sides: MergeSides, action: MergeAction): RowCellItem[] {
	if (action !== 'replace') return items(field, sides.merged, sides.newValues);
	return [
		...fieldValues(field, sides.mine).map((text) => ({ text, struck: true })),
		...items(field, sides.album, sides.newValues)
	];
}

function actionOf(field: MergeField, action: MergeAction, sides: MergeSides): RowAction {
	const applied = sides.changes.fields.includes(field);
	return {
		label: applied ? m.compare.withdraw : ACTION_LABELS[action],
		toward: !applied,
		side: applied ? 'left' : 'right',
		onclick: () => sides.ontoggle(field)
	};
}

export function mergeRow(field: MergeField, sides: MergeSides): DisplayRow {
	const action = offeredAction(field, sides.mine, sides.album);
	const applied = action !== null && sides.changes.fields.includes(field);
	return {
		key: field,
		label: fieldLabel(field),
		left: applied ? leftItems(field, sides, action) : items(field, sides.mine, []),
		right: items(field, sides.album, sides.newValues),
		...(field === 'notes' ? { text: true } : {}),
		...(action ? { actions: [actionOf(field, action, sides)] } : {})
	};
}

export function mergeRows(sides: MergeSides): DisplayRow[] {
	return MERGE_FIELDS.map((field) => mergeRow(field, sides));
}
