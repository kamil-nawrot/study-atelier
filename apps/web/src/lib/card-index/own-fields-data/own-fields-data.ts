import { failureMessage } from '#lib/auth/expired-session/expired-session.svelte.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { cardIndexErrorMessage, collectionErrorMessage } from '#lib/catalogue/errors/errors.ts';
import type { OwnField } from '#lib/card-index/types/own-field.ts';
import type { OwnFieldDefinition } from '#lib/card-index/types/own-field-definition.ts';
import type { OwnFieldInput } from '#lib/card-index/types/own-field-input.ts';
import type { OwnFieldKind } from '#lib/card-index/types/own-field-kind.ts';
import type { OwnValue } from '#lib/card-index/types/own-value.ts';
import type { OwnValueChange } from '#lib/card-index/types/own-value-change.ts';
import { OWN_FIELD_KINDS } from '#lib/card-index/own-fields/own-fields.ts';

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
		multiple: row.multiple
	};
}

function fieldsQuery(): PromiseLike<{
	data: FieldRow[] | null;
	error: { message: string } | null;
}> {
	return supabase
		.from('artwork_fields')
		.select('id, name, description, kind, multiple')
		.order('position');
}

export async function loadOwnFieldDefinitions(): Promise<OwnFieldDefinitionsResult> {
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
	return error ? { error: await failureMessage(error, cardIndexErrorMessage) } : {};
}

export function createOwnField(input: OwnFieldInput): Promise<ActionResult> {
	return run(
		supabase.from('artwork_fields').insert({
			name: input.name.trim(),
			description: cleanDescription(input.description),
			kind: input.kind,
			multiple: input.kind === 'list' && input.multiple
		})
	);
}

export function updateOwnField(
	field: OwnField,
	input: Pick<OwnFieldInput, 'name' | 'description'>
): Promise<ActionResult> {
	return run(
		supabase
			.from('artwork_fields')
			.update({ name: input.name.trim(), description: cleanDescription(input.description) })
			.eq('id', field.id)
	);
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
