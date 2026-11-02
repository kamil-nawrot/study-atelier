import { beforeEach, describe, expect, it, vi } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';
import { cached, forgetCached } from '#lib/shared/data/data-cache/data-cache.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import {
	deleteGlossaryEntry,
	loadGlossary,
	loadGlossaryEntry,
	loadTermDefinition,
	loadTermIndex,
	saveGlossaryEntry
} from './glossary-data.ts';
import { glossaryErrorMessage } from '#lib/glossary/errors/errors.ts';
import type { GlossaryDraft } from '#lib/glossary/types/glossary-draft.ts';

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
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
		synonyms: ['tympan'],
		forms: ['tympana'],
		sort_name: null,
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

async function keepsGlossaryCached(): Promise<boolean> {
	const reload = vi.fn().mockResolvedValue({ entries: [], error: undefined });
	await cached('glossary', reload);
	return reload.mock.calls.length === 0;
}

const draft: GlossaryDraft = {
	name: '  Tympanum ',
	category: 'architecture',
	definition: ' A definition. ',
	synonyms: [' tympan ', 'Tympan'],
	forms: ['tympana', ' ', 'Tympana'],
	sortByOther: false,
	sortName: 'Ignored',
	source: {
		title: 'Tympanum',
		url: 'https://pl.wikipedia.org/wiki/Tympanum',
		licence: 'CC BY-SA 4.0',
		fetchedOn: '2026-10-17'
	}
};

describe('loadTermIndex', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		forgetCached();
	});

	it('reads only the columns that mark the terms, once per session', async () => {
		const query = chain({
			data: [
				{ ...row(), has_definition: true },
				{ ...row({ id: 'other', category: 'music' }), has_definition: true }
			],
			error: null
		});

		const first = await loadTermIndex();
		await loadTermIndex();

		expect(query.select).toHaveBeenCalledWith(
			'id, name, category, synonyms, forms, has_definition'
		);
		expect(query.select).toHaveBeenCalledOnce();
		expect(first.terms).toEqual([
			{
				id: ID,
				name: 'Tympanum',
				category: 'architecture',
				synonyms: ['tympan'],
				forms: ['tympana'],
				hasDefinition: true
			}
		]);
	});

	it('reads the index again after a glossary write', async () => {
		const query = chain({ data: [], error: null });
		await loadTermIndex();

		await deleteGlossaryEntry(ID);
		await loadTermIndex();

		expect(query.range).toHaveBeenCalledTimes(2);
	});
});

describe('loadTermDefinition', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		forgetCached();
	});

	it('reads the definition and the source of one term by id, once', async () => {
		const query = chain({ data: row(), error: null });

		const result = await loadTermDefinition(ID);
		await loadTermDefinition(ID);

		expect(query.select).toHaveBeenCalledWith(
			'definition, source_title, source_url, source_licence, source_fetched_on'
		);
		expect(query.eq).toHaveBeenCalledWith('id', ID);
		expect(query.maybeSingle).toHaveBeenCalledOnce();
		expect(result).toEqual({
			definition: 'A definition.',
			source: {
				title: 'Tympanum',
				url: 'https://pl.wikipedia.org/wiki/Tympanum',
				licence: 'CC BY-SA 4.0',
				fetchedOn: '2026-10-17'
			}
		});
	});

	it('says when the term no longer exists', async () => {
		chain({ data: null, error: null });

		await expect(loadTermDefinition(ID)).resolves.toEqual({ notFound: true });
	});

	it('keeps no failed load, so the next opening tries again', async () => {
		const query = chain({ data: null, error: { code: '500', message: 'boom' } });

		await expect(loadTermDefinition(ID)).resolves.toEqual({
			error: glossaryErrorMessage({ code: '500', message: 'boom' })
		});
		await loadTermDefinition(ID);

		expect(query.maybeSingle).toHaveBeenCalledTimes(2);
	});

	it('forgets the definitions after a glossary write', async () => {
		const query = chain({ data: row(), error: null });
		await loadTermDefinition(ID);

		await deleteGlossaryEntry(ID);
		await loadTermDefinition(ID);

		expect(query.maybeSingle).toHaveBeenCalledTimes(2);
	});
});

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
					sort_name: 'Tympanum, the',
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
				synonyms: ['tympan'],
				forms: ['tympana'],
				hasDefinition: true,
				sortName: null,
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
				synonyms: ['tympan'],
				forms: ['tympana'],
				hasDefinition: false,
				sortName: 'Tympanum, the',
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

	it('inserts a new entry with a trimmed name and definition, clean synonyms and forms and its source', async () => {
		const query = chain({ data: { id: ID }, error: null });

		const result = await saveGlossaryEntry(draft);

		expect(query.insert).toHaveBeenCalledWith({
			name: 'Tympanum',
			category: 'architecture',
			definition: 'A definition.',
			synonyms: ['tympan'],
			forms: ['tympana'],
			sort_name: null,
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
				sort_name: null,
				source_title: null,
				source_url: null,
				source_licence: null,
				source_fetched_on: null
			})
		);
		expect(query.eq).toHaveBeenCalledWith('id', ID);
	});

	it('saves a trimmed sort name only when sorting by another name is chosen', async () => {
		const query = chain({ data: { id: ID }, error: null });

		await saveGlossaryEntry({ ...draft, sortByOther: true, sortName: '  Medici,   Lorenzo ' });
		await saveGlossaryEntry({ ...draft, sortByOther: true, sortName: '   ' });

		expect(query.insert).toHaveBeenNthCalledWith(
			1,
			expect.objectContaining({ sort_name: 'Medici, Lorenzo' })
		);
		expect(query.insert).toHaveBeenNthCalledWith(2, expect.objectContaining({ sort_name: null }));
	});

	it('forgets the cached glossary after a save', async () => {
		chain({ data: { id: ID }, error: null });
		await cached('glossary', async () => ({ entries: [], error: undefined }));

		await saveGlossaryEntry(draft);

		expect(await keepsGlossaryCached()).toBe(false);
	});

	it('keeps the cached glossary when a save fails', async () => {
		chain({ data: null, error: { code: '23514' } });
		await cached('glossary', async () => ({ entries: [], error: undefined }));

		await saveGlossaryEntry(draft);

		expect(await keepsGlossaryCached()).toBe(true);
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

	it('forgets the cached glossary after a delete', async () => {
		chain({ error: null });
		await cached('glossary', async () => ({ entries: [], error: undefined }));

		await deleteGlossaryEntry(ID);

		expect(await keepsGlossaryCached()).toBe(false);
	});

	it('gives a message when deleting fails and keeps the cached glossary', async () => {
		chain({ error: { code: '500' } });
		await cached('glossary', async () => ({ entries: [], error: undefined }));

		expect(await deleteGlossaryEntry(ID)).toEqual({ error: m.common.unexpectedError });
		expect(await keepsGlossaryCached()).toBe(true);
	});
});

describe('glossaryErrorMessage', () => {
	it('picks a message by code and falls back to a general one', () => {
		expect(glossaryErrorMessage({ code: 'PGRST116' })).toBe(m.glossary.errors.notFound);
		expect(glossaryErrorMessage({ code: '23502' })).toBe(m.glossary.errors.invalid);
		expect(glossaryErrorMessage({ message: 'TypeError: Failed to fetch' })).toBe(m.common.network);
		expect(glossaryErrorMessage({ code: '99999' })).toBe(m.common.unexpectedError);
	});
});
