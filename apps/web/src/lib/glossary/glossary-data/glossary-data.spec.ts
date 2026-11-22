import { beforeEach, describe, expect, it, vi } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';
import { testEntry } from '#lib/testing/glossary/glossary.ts';
import { removeOwnImage } from '#lib/images/own-image-data/own-image-data.ts';
import { emptyFigureDraft } from '#lib/glossary/figure-form/figure-form.ts';
import { cached, forgetCached } from '#lib/shared/data/data-cache/data-cache.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import {
	deleteGlossaryEntry,
	loadGlossary,
	loadGlossaryEntry,
	loadTermDefinition,
	loadTermDefinitions,
	loadTermIndex,
	saveGlossaryEntry
} from './glossary-data.ts';
import { glossaryErrorMessage } from '#lib/glossary/errors/errors.ts';
import type { GlossaryDraft } from '#lib/glossary/types/glossary-draft.ts';

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { from: vi.fn(), auth: { signOut: vi.fn() } }
}));

vi.mock('#lib/images/own-image-data/own-image-data.ts', async (importOriginal) => ({
	...(await importOriginal<typeof import('#lib/images/own-image-data/own-image-data.ts')>()),
	removeOwnImage: vi.fn()
}));

const from = vi.mocked(supabase.from);

const ID = '3f2c1d4e-5a6b-4c7d-8e9f-0a1b2c3d4e5f';

function row(overrides: Record<string, unknown> = {}): Record<string, unknown> {
	return {
		id: ID,
		owner_id: 'owner',
		name: 'Tympanum',
		kind: 'term',
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
	kind: 'term',
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
	},
	figure: emptyFigureDraft()
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
				{ ...row({ id: 'other', category: 'music' }), has_definition: true },
				{ ...row({ id: 'none', category: null, kind: 'figure' }), has_definition: false }
			],
			error: null
		});

		const first = await loadTermIndex();
		await loadTermIndex();

		expect(query.select).toHaveBeenCalledWith(
			'id, name, kind, category, synonyms, forms, has_definition'
		);
		expect(query.select).toHaveBeenCalledOnce();
		expect(first.terms).toEqual([
			{
				id: ID,
				name: 'Tympanum',
				kind: 'term',
				category: 'architecture',
				synonyms: ['tympan'],
				forms: ['tympana'],
				hasDefinition: true
			},
			{
				id: 'none',
				name: 'Tympanum',
				kind: 'figure',
				category: null,
				synonyms: ['tympan'],
				forms: ['tympana'],
				hasDefinition: false
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

describe('loadTermDefinitions', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('reads the definitions of the given terms in one request', async () => {
		const query = chain({ data: [{ id: ID, definition: 'A definition.' }], error: null });
		query.in = vi
			.fn()
			.mockResolvedValue({ data: [{ id: ID, definition: 'A definition.' }], error: null });

		const result = await loadTermDefinitions([ID, 'gone']);

		expect(query.select).toHaveBeenCalledWith('id, definition');
		expect(query.in).toHaveBeenCalledWith('id', [ID, 'gone']);
		expect(result).toEqual({ definitions: new Map([[ID, 'A definition.']]) });
	});

	it('sends no request without terms', async () => {
		await expect(loadTermDefinitions([])).resolves.toEqual({ definitions: new Map() });
		expect(from).not.toHaveBeenCalled();
	});

	it('gives a message and no definitions when loading fails', async () => {
		const query = chain({ data: null, error: { code: '500', message: 'boom' } });
		query.in = vi.fn().mockResolvedValue({ data: null, error: { code: '500', message: 'boom' } });

		await expect(loadTermDefinitions([ID])).resolves.toEqual({
			definitions: new Map(),
			error: glossaryErrorMessage({ code: '500', message: 'boom' })
		});
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
				kind: 'term',
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
				},
				createdAt: '2026-10-17T00:00:00Z'
			},
			{
				id: 'other',
				name: 'Tympanum',
				kind: 'term',
				category: 'architecture',
				definition: '',
				synonyms: ['tympan'],
				forms: ['tympana'],
				hasDefinition: false,
				sortName: 'Tympanum, the',
				source: null,
				createdAt: '2026-10-17T00:00:00Z'
			}
		]);
	});

	it('leaves out a row with a category or a kind it does not know, or a category of the other kind', async () => {
		chain({
			data: [
				row({ category: 'music' }),
				row({ kind: 'person' }),
				row({ kind: 'figure', category: 'painting' })
			],
			error: null
		});

		expect((await loadGlossary()).entries).toEqual([]);
	});

	it('keeps a term and a figure without a category', async () => {
		chain({
			data: [row({ id: 'a', category: null }), row({ id: 'b', kind: 'figure', category: null })],
			error: null
		});

		const { entries } = await loadGlossary();

		expect(entries.map(({ id, kind, category }) => ({ id, kind, category }))).toEqual([
			{ id: 'a', kind: 'term', category: null },
			{ id: 'b', kind: 'figure', category: null }
		]);
		expect(entries[1].figure).toBeDefined();
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

	it('loads the life years, country and portrait of a figure and none for a term', async () => {
		chain({
			data: row({
				kind: 'figure',
				category: 'artist',
				birth_year: 1511,
				death_year: 1574,
				years_approximate: false,
				country: 'Włochy',
				own_image_url: 'https://example.test/vasari.jpg',
				image_width: 3,
				image_height: 4
			}),
			error: null
		});

		const figure = (await loadGlossaryEntry(ID)).entry?.figure;

		expect(figure).toMatchObject({
			birthYear: 1511,
			deathYear: 1574,
			country: 'Włochy',
			image: { kind: 'url', url: 'https://example.test/vasari.jpg' }
		});

		chain({ data: row(), error: null });

		expect((await loadGlossaryEntry(ID)).entry?.figure).toBeUndefined();
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
			kind: 'term',
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

	it('writes the life years, country and commons portrait of a figure', async () => {
		const query = chain({ data: { id: ID }, error: null });

		await saveGlossaryEntry({
			...draft,
			name: 'Pheidias',
			kind: 'figure',
			category: 'artist',
			figure: {
				...emptyFigureDraft(),
				birthYear: '490',
				birthBeforeCommonEra: true,
				deathYear: '430',
				deathBeforeCommonEra: true,
				yearsApproximate: true,
				country: ' Grecja ',
				image: {
					kind: 'commons',
					wikidataId: 'Q1',
					file: 'Pheidias.jpg',
					licence: 'CC BY',
					licenceUrl: null,
					attribution: 'Someone',
					width: 3,
					height: 4
				}
			}
		});

		expect(query.insert).toHaveBeenCalledWith(
			expect.objectContaining({
				birth_year: -490,
				death_year: -430,
				years_approximate: true,
				country: 'Grecja',
				source_wikidata_id: 'Q1',
				source_image_file: 'Pheidias.jpg',
				own_image_path: null,
				image_width: 3,
				image_height: 4
			})
		);
	});

	it('removes the uploaded portrait a saved figure no longer uses', async () => {
		chain({ data: { id: ID }, error: null });
		const previous = {
			...testEntry('a-vasari', 'Pheidias', { category: 'artist' }),
			figure: {
				birthYear: null,
				deathYear: null,
				yearsApproximate: false,
				country: null,
				image: { kind: 'upload' as const, path: 'owner/old.webp', width: 3, height: 4 }
			}
		};

		await saveGlossaryEntry(
			{
				...draft,
				name: 'Pheidias',
				kind: 'figure',
				category: 'artist',
				figure: emptyFigureDraft()
			},
			ID,
			previous
		);

		expect(removeOwnImage).toHaveBeenCalledWith('owner/old.webp');
	});

	it('leaves the figure columns out when a term is saved', async () => {
		const query = chain({ data: { id: ID }, error: null });

		await saveGlossaryEntry(draft);

		expect(query.insert).toHaveBeenCalledWith(
			expect.not.objectContaining({ birth_year: expect.anything() })
		);
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

	it('saves an entry without a category', async () => {
		const query = chain({ data: { id: ID }, error: null });

		await saveGlossaryEntry({ ...draft, category: null });

		expect(query.insert).toHaveBeenCalledWith(
			expect.objectContaining({ kind: 'term', category: null })
		);
	});

	it('sends the kind only with a new entry, never with an edit', async () => {
		const query = chain({ data: { id: ID }, error: null });

		await saveGlossaryEntry({ ...draft, category: null }, ID);

		expect(query.update).toHaveBeenCalledWith(expect.not.objectContaining({ kind: 'term' }));
		expect(query.update).toHaveBeenCalledWith(expect.objectContaining({ category: null }));
	});

	it('does not save a category of the other kind', async () => {
		expect((await saveGlossaryEntry({ ...draft, kind: 'figure' })).error).toBe(
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
