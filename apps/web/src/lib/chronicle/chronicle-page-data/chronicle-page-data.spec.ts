import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadVisit, loadVisits } from '#lib/chronicle/chronicle-data/chronicle-data.ts';
import { loadGlossary } from '#lib/glossary/glossary-data/glossary-data.ts';
import { loadNoteLinks } from '#lib/notes/note-link-data/note-link-data.ts';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { testVisit } from '#lib/testing/chronicle/chronicle.ts';
import { loadAtelier } from '#lib/wall/wall-data/wall-data.ts';
import { loadChronicle, loadVisitPage } from './chronicle-page-data.ts';

vi.mock('#lib/chronicle/chronicle-data/chronicle-data.ts', () => ({
	loadVisit: vi.fn(),
	loadVisits: vi.fn()
}));
vi.mock('#lib/glossary/glossary-data/glossary-data.ts', () => ({ loadGlossary: vi.fn() }));
vi.mock('#lib/notes/note-link-data/note-link-data.ts', async (original) => ({
	...(await original<object>()),
	loadNoteLinks: vi.fn()
}));
vi.mock('#lib/wall/wall-data/wall-data.ts', () => ({ loadAtelier: vi.fn() }));

const lilies = testArtwork(1, 'Water Lilies');

beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(loadAtelier).mockResolvedValue({ artworks: [lilies] });
	vi.mocked(loadGlossary).mockResolvedValue({ entries: [] });
	vi.mocked(loadNoteLinks).mockResolvedValue(undefined);
});

describe('loadChronicle', () => {
	it('gives the visits with the artworks of the collection', async () => {
		vi.mocked(loadVisits).mockResolvedValue({ visits: [testVisit()] });

		expect(await loadChronicle()).toEqual({
			visits: [testVisit()],
			artworks: [lilies],
			error: undefined
		});
	});

	it('passes on an error of either load', async () => {
		vi.mocked(loadVisits).mockResolvedValue({ visits: [] });
		vi.mocked(loadAtelier).mockResolvedValue({ artworks: [], error: 'offline' });

		expect((await loadChronicle()).error).toBe('offline');
	});
});

describe('loadVisitPage', () => {
	it('stops at a visit that is not there', async () => {
		vi.mocked(loadVisit).mockResolvedValue({ notFound: true });

		expect(await loadVisitPage('nope')).toEqual({ notFound: true, artworks: [] });
		expect(loadAtelier).not.toHaveBeenCalled();
	});

	it('loads the note links only for a note that links, and the glossary for any note', async () => {
		vi.mocked(loadVisit).mockResolvedValue({ visit: testVisit() });

		const data = await loadVisitPage('id');

		expect(loadNoteLinks).not.toHaveBeenCalled();
		expect(loadGlossary).toHaveBeenCalled();
		expect(data.artworks).toEqual([lilies]);
		expect(data.glossary).toEqual([]);
	});

	it('loads the note links for a note with a link and nothing more without a note', async () => {
		vi.mocked(loadVisit).mockResolvedValue({
			visit: testVisit({ notes: 'Obok [#0001 Water Lilies](/atelier/1).' })
		});
		await loadVisitPage('id');
		expect(loadNoteLinks).toHaveBeenCalled();

		vi.clearAllMocks();
		vi.mocked(loadAtelier).mockResolvedValue({ artworks: [] });
		vi.mocked(loadVisit).mockResolvedValue({ visit: testVisit({ notes: '' }) });
		await loadVisitPage('id');
		expect(loadGlossary).not.toHaveBeenCalled();
	});
});
