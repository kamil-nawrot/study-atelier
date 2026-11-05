import { m } from '#lib/i18n/i18n.ts';
import { compareSortKeys } from '#lib/catalogue/author-sort/author-sort.ts';
import { valueKey } from '#lib/card-index/value-suggestions/value-suggestions.ts';
import type { ArtworkTypeCode } from '#lib/catalogue/types/artwork-type-code.ts';
import type { OwnField } from '#lib/card-index/types/own-field.ts';
import type { OwnFieldDefinition } from '#lib/card-index/types/own-field-definition.ts';
import type { OwnFieldInput } from '#lib/card-index/types/own-field-input.ts';
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

export function fieldKindLine(field: OwnField): string {
	const { ownFields } = m;
	const kind =
		field.kind === 'list'
			? `${ownFields.kinds.list}, ${field.multiple ? ownFields.manyValues : ownFields.oneValue}`
			: ownFields.kinds[field.kind];
	return ownFields.summary([ownFields.page.kind, kind, m.atelier.count(field.count)]);
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
		m.common.notes
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

export function chosenTypes(
	input: Pick<OwnFieldInput, 'limited' | 'typeCodes'>
): ArtworkTypeCode[] {
	return input.limited ? [...input.typeCodes] : [];
}

export function fieldApplies(
	field: Pick<OwnFieldDefinition, 'typeCodes'>,
	typeCode: ArtworkTypeCode | '' | null
): boolean {
	return field.typeCodes.length === 0 || (!!typeCode && field.typeCodes.includes(typeCode));
}

export function narrowsTypes(
	field: Pick<OwnFieldDefinition, 'typeCodes'>,
	input: Pick<OwnFieldInput, 'limited' | 'typeCodes'>
): boolean {
	const next = chosenTypes(input);
	if (next.length === 0) return false;
	return field.typeCodes.length === 0 || field.typeCodes.some((code) => !next.includes(code));
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
