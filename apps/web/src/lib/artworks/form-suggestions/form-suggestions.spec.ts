import { beforeEach, describe, expect, it, vi } from 'vitest';
import { emptyCategoryValues } from '#lib/card-index/category-values/category-values.ts';
import { loadCategoryValues } from '#lib/card-index/category-values-data/category-values-data.ts';
import { emptyPlaceStarter } from '#lib/card-index/place-starter/place-starter.ts';
import { loadPlaceStarter } from '#lib/card-index/place-starter-data/place-starter-data.ts';
import { emptyValueLinks } from '#lib/card-index/value-links/value-links.ts';
import { loadValueLinks } from '#lib/card-index/value-links-data/value-links-data.ts';
import { loadGlossary } from '#lib/glossary/glossary-data/glossary-data.ts';
import { loadNoteLinks } from '#lib/notes/note-link-data/note-link-data.ts';
import { forgetCached } from '#lib/shared/data/data-cache/data-cache.ts';
import type { NoteLinks } from '@study-atelier/ui';
import { FormSuggestions } from './form-suggestions.svelte.ts';

vi.mock('#lib/card-index/category-values-data/category-values-data.ts', () => ({
	loadCategoryValues: vi.fn()
}));
vi.mock('#lib/card-index/value-links-data/value-links-data.ts', () => ({
	loadValueLinks: vi.fn()
}));
vi.mock('#lib/card-index/place-starter-data/place-starter-data.ts', () => ({
	loadPlaceStarter: vi.fn()
}));
vi.mock('#lib/glossary/glossary-data/glossary-data.ts', () => ({ loadGlossary: vi.fn() }));
vi.mock('#lib/notes/note-link-data/note-link-data.ts', () => ({ loadNoteLinks: vi.fn() }));

const links = { minQueryLength: 1 } as unknown as NoteLinks;
const entry = { id: 'entry-1', name: 'Sfumato' } as never;

describe('form suggestions', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		forgetCached();
		vi.mocked(loadCategoryValues).mockResolvedValue({
			values: { ...emptyCategoryValues(), author: ['Rembrandt'] },
			ownValues: { lecture: ['Baroque'] }
		});
		vi.mocked(loadValueLinks).mockResolvedValue({ links: emptyValueLinks() });
		vi.mocked(loadPlaceStarter).mockResolvedValue(emptyPlaceStarter());
		vi.mocked(loadGlossary).mockResolvedValue({ entries: [entry] });
		vi.mocked(loadNoteLinks).mockResolvedValue(links);
	});

	it('loads nothing until it is first needed, then everything once', async () => {
		const suggestions = new FormSuggestions();
		expect(loadCategoryValues).not.toHaveBeenCalled();

		await Promise.all([suggestions.load(), suggestions.load()]);

		expect(loadCategoryValues).toHaveBeenCalledOnce();
		expect(suggestions.categoryValues.author).toEqual(['Rembrandt']);
		expect(suggestions.ownValues).toEqual({ lecture: ['Baroque'] });
		expect(suggestions.glossary).toEqual([entry]);
		expect(suggestions.noteLinks).toBe(links);
	});

	it('shares the loaded values with the next form', async () => {
		await new FormSuggestions().load();
		await new FormSuggestions().load();

		expect(loadCategoryValues).toHaveBeenCalledOnce();
	});

	it('keeps the note links it was given', async () => {
		const given = { minQueryLength: 2 } as unknown as NoteLinks;
		const suggestions = new FormSuggestions({ noteLinks: given });
		await suggestions.load();

		expect(loadNoteLinks).not.toHaveBeenCalled();
		expect(suggestions.noteLinks).toBe(given);
	});

	it('tries again on the next need after a failed load', async () => {
		vi.mocked(loadCategoryValues).mockResolvedValueOnce({
			values: emptyCategoryValues(),
			ownValues: {},
			error: 'Brak połączenia'
		});
		const suggestions = new FormSuggestions();
		await suggestions.load();
		await suggestions.load();

		expect(loadCategoryValues).toHaveBeenCalledTimes(2);
	});
});
