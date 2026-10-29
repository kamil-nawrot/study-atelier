import { beforeEach, describe, expect, it, vi } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { testOwnFields } from '#lib/testing/own-fields/own-fields.ts';
import { withOwnValues } from '#lib/card-index/own-fields/own-fields.ts';
import {
	addOwnValue,
	changeOwnValue,
	createOwnField,
	deleteOwnField,
	loadOwnFieldDefinitions,
	loadOwnFields,
	moveOwnField,
	updateOwnField
} from './own-fields-data.ts';

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { from: vi.fn(), rpc: vi.fn() }
}));

const rpc = vi.mocked(supabase.rpc);

const query = {
	select: vi.fn(),
	order: vi.fn(),
	insert: vi.fn(),
	update: vi.fn(),
	delete: vi.fn(),
	eq: vi.fn()
};

function rows(data: unknown[], error: unknown = null): never {
	const result = Promise.resolve({ data, error });
	return Object.assign(result, {
		in: vi.fn(() => ({ range: vi.fn().mockResolvedValue({ data, error }) }))
	}) as never;
}

describe('loadOwnFields', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(supabase.from).mockReturnValue(query as never);
		query.select.mockReturnValue(query);
	});

	it('gives every field its count without asking for the values again', async () => {
		query.order.mockResolvedValue({
			data: [
				{ id: 'lecture', name: 'Lecture', description: null, kind: 'list', multiple: false },
				{
					id: 'source',
					name: 'Source',
					description: 'Book and page',
					kind: 'text',
					multiple: false
				}
			],
			error: null
		});
		rpc.mockReturnValue(
			rows([
				{ field_id: 'lecture', artwork_count: 3 },
				{ field_id: 'source', artwork_count: 1 }
			])
		);

		const { fields } = await loadOwnFields();

		expect(fields.map((field) => [field.id, field.count, field.values])).toEqual([
			['lecture', 3, []],
			['source', 1, []]
		]);
		expect(query.order).toHaveBeenCalledWith('position');
		expect(rpc).toHaveBeenCalledTimes(1);
		expect(rpc).toHaveBeenCalledWith('artwork_field_usage');
	});

	it('puts the values of each list on its field in A to Z order', () => {
		const [lecture] = testOwnFields();

		expect(
			withOwnValues(
				[{ ...lecture, values: [] }],
				[
					{ id: 'v2', fieldId: 'lecture', name: 'Renaissance class', count: 1 },
					{ id: 'm1', fieldId: 'motifs', name: 'Angel', count: 2 },
					{ id: 'v1', fieldId: 'lecture', name: 'Baroque class', count: 2 }
				]
			)[0].values.map((value) => value.name)
		).toEqual(['Baroque class', 'Renaissance class']);
	});

	it('says the fields could not be loaded when a request fails', async () => {
		query.order.mockResolvedValue({ data: null, error: { message: 'TypeError: Failed to fetch' } });
		rpc.mockReturnValue(rows([]));

		await expect(loadOwnFields()).resolves.toEqual({
			fields: [],
			error: m.collectionErrors.network
		});
	});
});

describe('loadOwnFieldDefinitions', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(supabase.from).mockReturnValue(query as never);
		query.select.mockReturnValue(query);
	});

	it('reads the fields in their order without counts or values', async () => {
		query.order.mockResolvedValue({
			data: [{ id: 'seen', name: 'Seen', description: null, kind: 'flag', multiple: false }],
			error: null
		});

		await expect(loadOwnFieldDefinitions()).resolves.toEqual({
			fields: [{ id: 'seen', name: 'Seen', description: null, kind: 'flag', multiple: false }]
		});
		expect(query.order).toHaveBeenCalledWith('position');
		expect(rpc).not.toHaveBeenCalled();
	});
});

describe('own field actions', () => {
	const [lecture, motifs] = testOwnFields();

	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(supabase.from).mockReturnValue(query as never);
		query.insert.mockResolvedValue({ error: null });
		query.update.mockReturnValue(query);
		query.delete.mockReturnValue(query);
		query.eq.mockResolvedValue({ error: null });
		rpc.mockResolvedValue({ error: null } as never);
	});

	it('creates a field with a trimmed name and no empty description', async () => {
		await createOwnField({ name: ' Source ', description: '  ', kind: 'text', multiple: true });

		expect(supabase.from).toHaveBeenCalledWith('artwork_fields');
		expect(query.insert).toHaveBeenCalledWith({
			name: 'Source',
			description: null,
			kind: 'text',
			multiple: false
		});
	});

	it('changes the name and the description of a field', async () => {
		await updateOwnField(lecture, { name: 'Course', description: 'Which course' });

		expect(query.update).toHaveBeenCalledWith({ name: 'Course', description: 'Which course' });
		expect(query.eq).toHaveBeenCalledWith('id', 'lecture');
	});

	it('moves a field and deletes it', async () => {
		await moveOwnField(lecture, 1);
		await deleteOwnField(lecture);

		expect(rpc).toHaveBeenCalledWith('move_artwork_field', {
			target_field: 'lecture',
			direction: 1
		});
		expect(query.delete).toHaveBeenCalled();
		expect(query.eq).toHaveBeenCalledWith('id', 'lecture');
	});

	it('merges a value into another one of the field', async () => {
		const [angel, angle] = motifs.values;

		await changeOwnValue(angle, { kind: 'merge', target: angel });

		expect(rpc).toHaveBeenCalledWith('merge_category_values', {
			merged_id: 'angle',
			kept_id: 'angel'
		});
	});

	it('adds a value to the list of a field', async () => {
		await expect(addOwnValue(motifs, ' Putto ')).resolves.toEqual({});

		expect(supabase.from).toHaveBeenCalledWith('category_values');
		expect(query.insert).toHaveBeenCalledWith({ category_code: motifs.id, name: 'Putto' });
	});

	it('says something changed when another session took the name first', async () => {
		query.insert.mockResolvedValue({ error: { code: '23505', message: 'duplicate key' } });

		await expect(
			createOwnField({ name: 'Source', description: '', kind: 'text', multiple: false })
		).resolves.toEqual({ error: m.cardIndex.errors.changed });
	});
});
