import { beforeEach, describe, expect, it, vi } from 'vitest';
import { m } from '#lib/i18n/index.ts';
import { supabase } from '#lib/supabase.ts';
import {
	deleteGlossaryEntry,
	loadGlossary,
	loadGlossaryEntry,
	saveGlossaryEntry
} from './glossary-data.ts';
import { glossaryErrorMessage } from './errors.ts';
import type { GlossaryDraft } from './types.ts';

vi.mock('#lib/supabase.ts', () => ({
	supabase: { from: vi.fn(), auth: { signOut: vi.fn() } }
}));

const from = vi.mocked(supabase.from);

const ID = '3f2c1d4e-5a6b-4c7d-8e9f-0a1b2c3d4e5f';

function row(overrides: Record<string, unknown> = {}): Record<string, unknown> {
	return {
		id: ID,
		owner_id: 'owner',
		name: 'Tympanum',
		category: 'architecture',
		definition: 'A definition.',
		forms: ['tympana'],
		source_title: 'Tympanum',
		source_url: 'https://pl.wikipedia.org/wiki/Tympanum',
		source_licence: 'CC BY-SA 4.0',
		source_fetched_on: '2026-10-17',
		created_at: '2026-10-17T00:00:00Z',
		updated_at: '2026-10-17T00:00:00Z',
		...overrides
	};
}

function chain(result: unknown): Record<string, ReturnType<typeof vi.fn>> {
	const query: Record<string, ReturnType<typeof vi.fn>> = {};
	for (const name of ['select', 'order', 'eq', 'insert', 'update', 'delete']) {
		query[name] = vi.fn().mockReturnValue(query);
	}
	for (const name of ['range', 'maybeSingle', 'single']) {
		query[name] = vi.fn().mockResolvedValue(result);
	}
	query.then = vi.fn((resolve: (value: unknown) => unknown) => resolve(result));
	from.mockReturnValue(query as never);
	return query;
}

const draft: GlossaryDraft = {
	name: '  Tympanum ',
	category: 'architecture',
	definition: ' A definition. ',
	forms: ['tympana', ' ', 'Tympana'],
	source: {
		title: 'Tympanum',
		url: 'https://pl.wikipedia.org/wiki/Tympanum',
		licence: 'CC BY-SA 4.0',
		fetchedOn: '2026-10-17'
	}
};

describe('loadGlossary', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('maps the rows to entries ordered by name', async () => {
		const query = chain({
			data: [
				row(),
				row({
					id: 'other',
					definition: null,
					source_title: null,
					source_url: null,
					source_licence: null,
					source_fetched_on: null
				})
			],
			error: null
		});

		const result = await loadGlossary();

		expect(from).toHaveBeenCalledWith('glossary_entries');
		expect(query.order).toHaveBeenCalledWith('name');
		expect(result.entries).toEqual([
			{
				id: ID,
				name: 'Tympanum',
				category: 'architecture',
				definition: 'A definition.',
				forms: ['tympana'],
				source: {
					title: 'Tympanum',
					url: 'https://pl.wikipedia.org/wiki/Tympanum',
					licence: 'CC BY-SA 4.0',
					fetchedOn: '2026-10-17'
				}
			},
			{
				id: 'other',
				name: 'Tympanum',
				category: 'architecture',
				definition: '',
				forms: ['tympana'],
				source: null
			}
		]);
	});

	it('leaves out a row with a category it does not know', async () => {
		chain({ data: [row({ category: 'music' })], error: null });

		expect((await loadGlossary()).entries).toEqual([]);
	});

	it('gives a message and no entries when loading fails', async () => {
		chain({ data: null, error: { code: '500', message: 'boom' } });

		expect(await loadGlossary()).toEqual({ entries: [], error: m.common.unexpectedError });
	});
});

describe('loadGlossaryEntry', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('loads one entry by its id', async () => {
		const query = chain({ data: row(), error: null });

		const result = await loadGlossaryEntry(ID);

		expect(query.eq).toHaveBeenCalledWith('id', ID);
		expect(result.entry?.name).toBe('Tympanum');
	});

	it('says an entry does not exist without asking for an id that is not one', async () => {
		expect(await loadGlossaryEntry('not-an-id')).toEqual({ notFound: true });
		expect(from).not.toHaveBeenCalled();
	});

	it('says an entry does not exist when the database has none', async () => {
		chain({ data: null, error: null });

		expect(await loadGlossaryEntry(ID)).toEqual({ notFound: true });
	});

	it('gives a message when loading fails', async () => {
		chain({ data: null, error: { code: '500' } });

		expect((await loadGlossaryEntry(ID)).error).toBe(m.common.unexpectedError);
	});
});

describe('saveGlossaryEntry', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('inserts a new entry with a trimmed name and definition, clean forms and its source', async () => {
		const query = chain({ data: { id: ID }, error: null });

		const result = await saveGlossaryEntry(draft);

		expect(query.insert).toHaveBeenCalledWith({
			name: 'Tympanum',
			category: 'architecture',
			definition: 'A definition.',
			forms: ['tympana'],
			source_title: 'Tympanum',
			source_url: 'https://pl.wikipedia.org/wiki/Tympanum',
			source_licence: 'CC BY-SA 4.0',
			source_fetched_on: '2026-10-17'
		});
		expect(result).toEqual({ id: ID });
	});

	it('updates an existing entry and clears an empty definition and a removed source', async () => {
		const query = chain({ data: { id: ID }, error: null });

		await saveGlossaryEntry({ ...draft, definition: '  ', source: null }, ID);

		expect(query.update).toHaveBeenCalledWith(
			expect.objectContaining({
				definition: null,
				source_title: null,
				source_url: null,
				source_licence: null,
				source_fetched_on: null
			})
		);
		expect(query.eq).toHaveBeenCalledWith('id', ID);
	});

	it('says the name is taken when the unique name is violated', async () => {
		chain({ data: null, error: { code: '23505' } });

		expect(await saveGlossaryEntry(draft)).toEqual({ nameTaken: true });
	});

	it('gives a message for any other error', async () => {
		chain({ data: null, error: { code: '23514' } });

		expect(await saveGlossaryEntry(draft)).toEqual({ error: m.glossary.errors.invalid });
	});

	it('does not save an entry without a category', async () => {
		expect((await saveGlossaryEntry({ ...draft, category: null })).error).toBe(
			m.glossary.errors.invalid
		);
		expect(from).not.toHaveBeenCalled();
	});

	it('signs the learner out when the session has ended', async () => {
		chain({ data: null, error: { code: 'PGRST301', status: 401 } });

		expect((await saveGlossaryEntry(draft)).error).toBe(m.authErrors.sessionEnded);
		expect(supabase.auth.signOut).toHaveBeenCalled();
	});
});

describe('deleteGlossaryEntry', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('deletes the entry by its id', async () => {
		const query = chain({ error: null });

		expect(await deleteGlossaryEntry(ID)).toEqual({});
		expect(query.delete).toHaveBeenCalled();
		expect(query.eq).toHaveBeenCalledWith('id', ID);
	});

	it('gives a message when deleting fails', async () => {
		chain({ error: { code: '500' } });

		expect(await deleteGlossaryEntry(ID)).toEqual({ error: m.common.unexpectedError });
	});
});

describe('glossaryErrorMessage', () => {
	it('picks a message by code and falls back to a general one', () => {
		expect(glossaryErrorMessage({ code: 'PGRST116' })).toBe(m.glossary.errors.notFound);
		expect(glossaryErrorMessage({ code: '23502' })).toBe(m.glossary.errors.invalid);
		expect(glossaryErrorMessage({ message: 'TypeError: Failed to fetch' })).toBe(
			m.glossary.errors.network
		);
		expect(glossaryErrorMessage({ code: '99999' })).toBe(m.common.unexpectedError);
	});
});
