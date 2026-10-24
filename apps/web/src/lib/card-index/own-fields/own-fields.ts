import { m } from '#lib/i18n/i18n.ts';
import { compareSortKeys } from '#lib/catalogue/author-sort/author-sort.ts';
import { valueKey } from '#lib/card-index/value-suggestions/value-suggestions.ts';
import type { OwnField } from '#lib/card-index/types/own-field.ts';
import type { OwnFieldKind } from '#lib/card-index/types/own-field-kind.ts';
import type { OwnValue } from '#lib/card-index/types/own-value.ts';
import type { OwnValueChange } from '#lib/card-index/types/own-value-change.ts';

export const FIELD_NAME_MAX_LENGTH = 60;
export const FIELD_DESCRIPTION_MAX_LENGTH = 150;
export const OWN_TEXT_MAX_LENGTH = 200;
export const OWN_FIELD_KINDS: readonly OwnFieldKind[] = ['text', 'list', 'flag'];

function byName(a: OwnValue, b: OwnValue): number {
	return compareSortKeys(a.name, b.name);
}

export function withOwnValues(fields: OwnField[], values: readonly OwnValue[]): OwnField[] {
	return fields.map((field) => ({
		...field,
		values: values.filter((value) => value.fieldId === field.id).sort(byName)
	}));
}

export function builtInFieldNames(): string[] {
	const form = m.artworkForm;
	return [
		form.image,
		form.title,
		form.authors,
		form.year,
		form.type,
		form.era,
		form.period,
		form.style,
		form.material,
		form.location,
		form.notes
	];
}

export function fieldNameError(
	input: string,
	fields: readonly OwnField[],
	editedId?: string
): string | undefined {
	const name = input.trim();
	if (!name) return m.ownFields.errors.nameRequired;
	const key = name.toLocaleLowerCase('pl');
	const builtIn = builtInFieldNames().find((label) => label.toLocaleLowerCase('pl') === key);
	if (builtIn) return m.ownFields.errors.builtInName(builtIn);
	const own = fields.find(
		(field) => field.id !== editedId && field.name.toLocaleLowerCase('pl') === key
	);
	if (own) return m.ownFields.errors.ownName(own.name);
	return undefined;
}

export function planOwnValueChange(
	value: OwnValue,
	input: string,
	field: OwnField
): OwnValueChange {
	const name = input.trim();
	if (!name) return { kind: 'empty' };
	const key = valueKey(name);
	const same = field.values.find((other) => other.id !== value.id && valueKey(other.name) === key);
	if (same) return { kind: 'merge', target: same };
	return name === value.name ? { kind: 'unchanged' } : { kind: 'rename', name };
}
