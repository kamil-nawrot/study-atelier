import { failureMessage } from '#lib/auth/expired-session-data/expired-session-data.ts';
import { cacheKeys, cached, forgetCached } from '#lib/shared/data/data-cache/data-cache.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { cardIndexErrorMessage, collectionErrorMessage } from '#lib/catalogue/errors/errors.ts';
import type { OwnField } from '#lib/card-index/types/own-field.ts';
import type { OwnFieldDefinition } from '#lib/card-index/types/own-field-definition.ts';
import type { OwnFieldInput } from '#lib/card-index/types/own-field-input.ts';
import type { OwnFieldKind } from '#lib/card-index/types/own-field-kind.ts';
import type { OwnValue } from '#lib/card-index/types/own-value.ts';
import type { OwnValueChange } from '#lib/card-index/types/own-value-change.ts';
import { OWN_FIELD_KINDS, chosenTypes } from '#lib/card-index/own-fields/own-fields.ts';
import { isArtworkTypeCode } from '#lib/catalogue/artwork-types/artwork-types.ts';

type OwnFieldDefinitionsResult = {
	fields: OwnFieldDefinition[];
	error?: string;
};

type OwnFieldsResult = {
	fields: OwnField[];
	error?: string;
};

type FieldRow = {
	id: string;
	name: string;
	description: string | null;
	kind: string;
	multiple: boolean;
	type_codes: string[];
};

type UsageRow = { field_id: string; artwork_count: number };

type ActionResult = { error?: string };

function isOwnFieldKind(value: string): value is OwnFieldKind {
	return (OWN_FIELD_KINDS as readonly string[]).includes(value);
}

function definitionOf(row: FieldRow): OwnFieldDefinition {
	return {
		id: row.id,
		name: row.name,
		description: row.description,
		kind: row.kind as OwnFieldKind,
		multiple: row.multiple,
		typeCodes: (row.type_codes ?? []).filter(isArtworkTypeCode)
	};
}

function fieldsQuery(): PromiseLike<{
	data: FieldRow[] | null;
	error: { message: string } | null;
}> {
	return supabase
		.from('artwork_fields')
		.select('id, name, description, kind, multiple, type_codes')
		.order('position');
}

export function loadOwnFieldDefinitions(): Promise<OwnFieldDefinitionsResult> {
	return cached(cacheKeys.ownFields, fetchOwnFieldDefinitions);
}

async function fetchOwnFieldDefinitions(): Promise<OwnFieldDefinitionsResult> {
	const { data, error } = await fieldsQuery();
	if (error) return { fields: [], error: collectionErrorMessage(error) };
	return {
		fields: (data ?? []).filter((row) => isOwnFieldKind(row.kind)).map(definitionOf)
	};
}

export async function loadOwnFields(): Promise<OwnFieldsResult> {
	const [fields, usage] = await Promise.all([fieldsQuery(), supabase.rpc('artwork_field_usage')]);
	const error = fields.error ?? usage.error;
	if (error) return { fields: [], error: collectionErrorMessage(error) };

	const counts = new Map(((usage.data ?? []) as UsageRow[]).map((row) => [row.field_id, row]));
	return {
		fields: (fields.data ?? [])
			.filter((row) => isOwnFieldKind(row.kind))
			.map((row): OwnField => ({
				...definitionOf(row),
				count: counts.get(row.id)?.artwork_count ?? 0,
				values: []
			}))
	};
}

function cleanDescription(input: string): string | null {
	return input.trim() || null;
}

async function run(call: PromiseLike<{ error: { code?: string } | null }>): Promise<ActionResult> {
	const { error } = await call;
	forgetCached([
		cacheKeys.atelier,
		cacheKeys.cardIndex,
		cacheKeys.categoryValues,
		cacheKeys.ownFields
	]);
	return error ? { error: await failureMessage(error, cardIndexErrorMessage) } : {};
}

export function createOwnField(input: OwnFieldInput): Promise<ActionResult> {
	return run(
		supabase.from('artwork_fields').insert({
			name: input.name.trim(),
			description: cleanDescription(input.description),
			kind: input.kind,
			multiple: input.kind === 'list' && input.multiple,
			type_codes: chosenTypes(input)
		})
	);
}

export function updateOwnField(
	field: OwnField,
	input: Pick<OwnFieldInput, 'name' | 'description' | 'limited' | 'typeCodes'>
): Promise<ActionResult> {
	return run(
		supabase
			.from('artwork_fields')
			.update({
				name: input.name.trim(),
				description: cleanDescription(input.description),
				type_codes: chosenTypes(input)
			})
			.eq('id', field.id)
	);
}

export async function countArtworksOutsideTypes(
	field: OwnField,
	input: Pick<OwnFieldInput, 'limited' | 'typeCodes'>
): Promise<{ count: number; error?: string }> {
	const { data, error } = await supabase.rpc('artwork_field_type_impact', {
		target_field: field.id,
		type_codes: chosenTypes(input)
	});
	if (error) return { count: 0, error: await failureMessage(error, cardIndexErrorMessage) };
	return { count: data ?? 0 };
}

export function moveOwnField(field: OwnField, direction: -1 | 1): Promise<ActionResult> {
	return run(supabase.rpc('move_artwork_field', { target_field: field.id, direction }));
}

export function deleteOwnField(field: OwnField): Promise<ActionResult> {
	return run(supabase.from('artwork_fields').delete().eq('id', field.id));
}

export function changeOwnValue(value: OwnValue, change: OwnValueChange): Promise<ActionResult> {
	if (change.kind === 'merge') {
		return run(
			supabase.rpc('merge_category_values', { merged_id: value.id, kept_id: change.target.id })
		);
	}
	if (change.kind === 'rename') {
		return run(supabase.from('category_values').update({ name: change.name }).eq('id', value.id));
	}
	return Promise.resolve({});
}

export function addOwnValue(field: OwnField, name: string): Promise<ActionResult> {
	return run(
		supabase.from('category_values').insert({ category_code: field.id, name: name.trim() })
	);
}
