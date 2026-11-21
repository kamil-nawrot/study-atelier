import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadCardIndex } from '#lib/card-index/card-index-data/card-index-data.ts';
import { emptyCardIndex } from '#lib/card-index/card-index/card-index.ts';
import { loadGlossaryEntry, loadTermIndex } from '#lib/glossary/glossary-data/glossary-data.ts';
import { testEntry } from '#lib/testing/glossary/glossary.ts';
import { loadGlossaryForm, requestedKind } from './glossary-page-data.ts';

vi.mock('#lib/glossary/glossary-data/glossary-data.ts', () => ({
	loadGlossaryEntry: vi.fn(),
	loadTermIndex: vi.fn()
}));
vi.mock('#lib/card-index/card-index-data/card-index-data.ts', () => ({ loadCardIndex: vi.fn() }));

const entry = testEntry('a-apse', 'Apse');

describe('loadGlossaryForm', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(loadTermIndex).mockResolvedValue({ terms: [entry] });
		vi.mocked(loadCardIndex).mockResolvedValue({ index: emptyCardIndex(), ownValues: [] });
		vi.mocked(loadGlossaryEntry).mockResolvedValue({ entry });
	});

	it('takes the names for the duplicate check from the index, without reading an entry', async () => {
		await expect(loadGlossaryForm()).resolves.toEqual({
			entry: undefined,
			entries: [entry],
			index: emptyCardIndex(),
			kind: 'term'
		});
		expect(loadGlossaryEntry).not.toHaveBeenCalled();
	});

	it('gives a new entry the kind of the tab it came from', async () => {
		await expect(loadGlossaryForm(undefined, 'figure')).resolves.toMatchObject({ kind: 'figure' });
		expect(requestedKind('figure')).toBe('figure');
		expect(requestedKind('person')).toBe('term');
		expect(requestedKind(null)).toBe('term');
	});

	it('gives an edited entry the kind of its category', async () => {
		vi.mocked(loadGlossaryEntry).mockResolvedValue({
			entry: { ...entry, category: 'artist' }
		});

		await expect(loadGlossaryForm('a-apse', 'term')).resolves.toMatchObject({ kind: 'figure' });
	});

	it('reads the edited entry by its id', async () => {
		const result = await loadGlossaryForm('a-apse');

		expect(loadGlossaryEntry).toHaveBeenCalledWith('a-apse');
		expect(result.entry).toEqual(entry);
	});

	it('says when the edited entry does not exist', async () => {
		vi.mocked(loadGlossaryEntry).mockResolvedValue({ notFound: true });

		await expect(loadGlossaryForm('missing')).resolves.toMatchObject({ notFound: true });
	});

	it('gives the first error', async () => {
		vi.mocked(loadTermIndex).mockResolvedValue({ terms: [], error: 'Brak sieci.' });

		await expect(loadGlossaryForm('a-apse')).resolves.toEqual({
			entries: [],
			index: emptyCardIndex(),
			kind: 'term',
			error: 'Brak sieci.'
		});
	});
});
