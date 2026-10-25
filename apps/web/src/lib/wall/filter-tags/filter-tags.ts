import { eraName } from '#lib/catalogue/eras/eras.ts';
import { m } from '#lib/i18n/i18n.ts';
import type { OwnFieldDefinition } from '#lib/card-index/types/own-field-definition.ts';
import type { ArtworkTypeCode } from '#lib/catalogue/types/artwork-type-code.ts';
import type { CollectionFilter } from '#lib/catalogue/types/collection-filter.ts';
import type { EraCode } from '#lib/catalogue/types/era-code.ts';
import type { FilterTag } from '#lib/catalogue/types/filter-tag.ts';
import type { MissingData } from '#lib/catalogue/types/missing-data.ts';
import type { TagParts } from '#lib/catalogue/types/tag-parts.ts';
import type { FilterValueField } from '#lib/wall/types/filter-value-field.ts';
import {
	FILTER_FIELDS,
	UNKNOWN_AUTHOR,
	chosenValues,
	clearField,
	hasYears,
	isFlagField,
	setOwnText,
	toggleOwnValue,
	toggleTicked,
	toggleValue
} from '#lib/wall/filter/filter.ts';
import { RANGE_SEPARATOR, yearsParam } from '#lib/wall/filter-params/filter-params.ts';

function ownTags(filter: CollectionFilter, fields: readonly OwnFieldDefinition[]): FilterTag[] {
	const names = new Map(fields.map((field) => [field.id, field.name]));
	const nameOf = (id: string): string => names.get(id) ?? m.atelier.filters.ownField;
	const tag = (field: 'own' | 'ownText' | 'ticked', id: string, value: string): FilterTag => ({
		id: `${field}:${id}${field === 'own' ? `:${value}` : ''}`,
		field,
		fieldId: id,
		value,
		parts: { field: nameOf(id), value }
	});
	return [
		...Object.entries(filter.own).flatMap(([id, values]) =>
			values.map((value) => tag('own', id, value))
		),
		...Object.entries(filter.ownTexts).flatMap(([id, text]) =>
			text.trim() ? [tag('ownText', id, text.trim())] : []
		),
		...filter.ticked.map((id) => tag('ticked', id, ''))
	];
}

export function filterTags(
	filter: CollectionFilter,
	fields: readonly OwnFieldDefinition[] = []
): FilterTag[] {
	const tags: FilterTag[] = [];
	for (const field of FILTER_FIELDS) {
		if (field === 'missing') tags.push(...ownTags(filter, fields));
		if (field === 'years') {
			if (hasYears(filter))
				tags.push({ id: 'years', field, value: yearsParam(filter.yearFrom, filter.yearTo) });
			continue;
		}
		if (isFlagField(field)) {
			if (filter[field]) tags.push({ id: field, field, value: '' });
			continue;
		}
		for (const value of chosenValues(filter, field))
			tags.push({ id: `${field}:${value}`, field, value });
	}
	return tags;
}

export function removeTag(filter: CollectionFilter, tag: FilterTag): CollectionFilter {
	if (tag.field === 'own') return toggleOwnValue(filter, tag.fieldId ?? '', tag.value);
	if (tag.field === 'ownText') return setOwnText(filter, tag.fieldId ?? '', '');
	if (tag.field === 'ticked') return toggleTicked(filter, tag.fieldId ?? '');
	if (tag.field === 'years' || isFlagField(tag.field)) return clearField(filter, tag.field);
	return toggleValue(filter, tag.field, tag.value);
}

export function optionLabel(field: FilterValueField, value: string): string {
	if (field === 'eras') return eraName(value as EraCode);
	if (field === 'types') return m.artworkTypes[value as ArtworkTypeCode];
	if (field === 'missing') return m.atelier.filters.missing[value as MissingData];
	return value === UNKNOWN_AUTHOR ? m.atelier.filters.unknownAuthor : value;
}

export function tagParts(tag: FilterTag): TagParts {
	if (tag.parts) return tag.parts;
	if (tag.field === 'own' || tag.field === 'ownText' || tag.field === 'ticked') {
		return { field: '', value: tag.value };
	}
	const field = m.atelier.filters.tagFields[tag.field];
	if (isFlagField(tag.field)) return { field, value: '' };
	if (tag.field !== 'years') return { field, value: optionLabel(tag.field, tag.value) };
	const [from, to] = tag.value.split(RANGE_SEPARATOR).map((part) => (part ? Number(part) : null));
	return { field, value: yearsLabel(from, to) };
}

export function tagLabel(tag: FilterTag): string {
	const { field, value } = tagParts(tag);
	return value ? m.atelier.filters.tag(field, value) : field;
}

function yearsLabel(from: number | null, to: number | null): string {
	if (from !== null && to !== null) return m.atelier.filters.yearsBetween(from, to);
	if (from !== null) return m.atelier.filters.yearsFrom(from);
	return m.atelier.filters.yearsTo(to as number);
}
