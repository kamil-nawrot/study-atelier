import { beforeEach, describe, expect, it, vi } from 'vitest';
import { m } from '#lib/i18n/index.ts';
import { supabase } from '#lib/supabase.ts';
import { testOwnFields } from '#lib/testing/own-fields.ts';
import {
	changeOwnValue,
	createOwnField,
	deleteOwnField,
	fieldNameError,
	loadOwnFieldDefinitions,
	loadOwnFields,
	moveOwnField,
	planOwnValueChange,
	updateOwnField
} from './own-fields.ts';

vi.mock('#lib/supabase.ts', () => ({ supabase: { from: vi.fn(), rpc: vi.fn() } }));

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

	it('gives every field its count and the values of a list in A to Z order', async () => {
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
		rpc.mockImplementation(((name: string) =>
			name === 'artwork_field_usage'
				? rows([
						{ field_id: 'lecture', artwork_count: 3 },
						{ field_id: 'source', artwork_count: 1 }
					])
				: rows([
						{ id: 'v2', category_code: 'lecture', name: 'Renaissance', artwork_count: 1 },
						{ id: 'v1', category_code: 'lecture', name: 'Baroque', artwork_count: 2 }
					])) as never);

		await expect(loadOwnFields()).resolves.toEqual({
			fields: [
				{
					id: 'lecture',
					name: 'Lecture',
					description: null,
					kind: 'list',
					multiple: false,
					count: 3,
					values: [
						{ id: 'v1', fieldId: 'lecture', name: 'Baroque', count: 2 },
						{ id: 'v2', fieldId: 'lecture', name: 'Renaissance', count: 1 }
					]
				},
				{
					id: 'source',
					name: 'Source',
					description: 'Book and page',
					kind: 'text',
					multiple: false,
					count: 1,
					values: []
				}
			]
		});
		expect(query.order).toHaveBeenCalledWith('position');
	});

	it('does not ask for values when there is no list field', async () => {
		query.order.mockResolvedValue({
			data: [{ id: 'seen', name: 'Seen', description: null, kind: 'flag', multiple: false }],
			error: null
		});
		rpc.mockImplementation(((name: string) =>
			name === 'artwork_field_usage' ? rows([]) : rows([])) as never);

		const { fields } = await loadOwnFields();

		expect(fields).toHaveLength(1);
		expect(rpc).not.toHaveBeenCalledWith('value_usage');
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

describe('fieldNameError', () => {
	const fields = testOwnFields();

	it('asks for a name', () => {
		expect(fieldNameError('   ', fields)).toBe(m.ownFields.errors.nameRequired);
	});

	it('refuses the label of a built-in field in any letter case', () => {
		expect(fieldNameError('styl', fields)).toBe(
			m.ownFields.errors.builtInName(m.artworkForm.style)
		);
	});

	it('accepts a form of a built-in label that is not the label itself', () => {
		expect(fieldNameError('Autor', fields)).toBeUndefined();
	});

	it('refuses the name of another own field in any letter case', () => {
		expect(fieldNameError(' lecture ', fields)).toBe(m.ownFields.errors.ownName('Lecture'));
	});

	it('lets a field keep its own name', () => {
		expect(fieldNameError('LECTURE', fields, 'lecture')).toBeUndefined();
	});
});

describe('planOwnValueChange', () => {
	const motifs = testOwnFields()[1];
	const angle = motifs.values[1];

	it('merges a value renamed to another value of the field', () => {
		expect(planOwnValueChange(angle, ' angel ', motifs)).toEqual({
			kind: 'merge',
			target: motifs.values[0]
		});
	});

	it('renames a value to a new name', () => {
		expect(planOwnValueChange(angle, 'Lily', motifs)).toEqual({ kind: 'rename', name: 'Lily' });
	});

	it('treats a blank name as empty and the same name as unchanged', () => {
		expect(planOwnValueChange(angle, ' ', motifs)).toEqual({ kind: 'empty' });
		expect(planOwnValueChange(angle, 'Angle', motifs)).toEqual({ kind: 'unchanged' });
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

	it('says something changed when another session took the name first', async () => {
		query.insert.mockResolvedValue({ error: { code: '23505', message: 'duplicate key' } });

		await expect(
			createOwnField({ name: 'Source', description: '', kind: 'text', multiple: false })
		).resolves.toEqual({ error: m.cardIndex.errors.changed });
	});
});
