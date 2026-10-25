import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadCategoryValues } from '#lib/card-index/category-values-data/category-values-data.ts';
import { loadPlaceStarter } from '#lib/card-index/place-starter-data/place-starter-data.ts';
import { emptyPlaceStarter } from '#lib/card-index/place-starter/place-starter.ts';
import { loadVisit } from '#lib/chronicle/chronicle-data/chronicle-data.ts';
import { loadNoteLinks } from '#lib/notes/note-link-data/note-link-data.ts';
import { testVisit } from '#lib/testing/chronicle/chronicle.ts';
import { loadAtelier } from '#lib/wall/wall-data/wall-data.ts';
import { loadVisitForm } from './visit-form-data.ts';

vi.mock('#lib/card-index/category-values-data/category-values-data.ts', () => ({
	loadCategoryValues: vi.fn()
}));
vi.mock('#lib/card-index/place-starter-data/place-starter-data.ts', () => ({
	loadPlaceStarter: vi.fn()
}));
vi.mock('#lib/chronicle/chronicle-data/chronicle-data.ts', () => ({ loadVisit: vi.fn() }));
vi.mock('#lib/notes/note-link-data/note-link-data.ts', () => ({ loadNoteLinks: vi.fn() }));
vi.mock('#lib/wall/wall-data/wall-data.ts', () => ({ loadAtelier: vi.fn() }));

beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(loadAtelier).mockResolvedValue({ artworks: [] });
	vi.mocked(loadCategoryValues).mockResolvedValue({
		values: { author: [], period: [], style: [], material: [], location: ['Orsay'] },
		ownValues: {}
	} as never);
	vi.mocked(loadPlaceStarter).mockResolvedValue(emptyPlaceStarter());
	vi.mocked(loadNoteLinks).mockResolvedValue(undefined);
});

describe('loadVisitForm', () => {
	it('gives an empty form the places, the artworks and no visit', async () => {
		const data = await loadVisitForm();

		expect(loadVisit).not.toHaveBeenCalled();
		expect(data.places).toEqual(['Orsay']);
		expect(data.visit).toBeUndefined();
	});

	it('loads the visit to edit and passes on an error of the collection', async () => {
		vi.mocked(loadVisit).mockResolvedValue({ visit: testVisit() });
		vi.mocked(loadAtelier).mockResolvedValue({ artworks: [], error: 'offline' });

		const data = await loadVisitForm('id');

		expect(data.visit).toEqual(testVisit());
		expect(data.error).toBe('offline');
	});
});
