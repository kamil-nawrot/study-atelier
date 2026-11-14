import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	loadTripVisits,
	loadVisit,
	loadVisits
} from '#lib/chronicle/chronicle-data/chronicle-data.ts';
import { loadTermIndex } from '#lib/glossary/glossary-data/glossary-data.ts';
import { loadNoteLinkLabels } from '#lib/notes/note-link-data/note-link-data.ts';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { testTrip, testVisit } from '#lib/testing/chronicle/chronicle.ts';
import { loadArtworksOfVisit, loadAtelier } from '#lib/wall/wall-data/wall-data.ts';
import { loadChronicle, loadVisitPage } from './chronicle-page-data.ts';

vi.mock('#lib/chronicle/chronicle-data/chronicle-data.ts', () => ({
	loadTripVisits: vi.fn(),
	loadVisit: vi.fn(),
	loadVisits: vi.fn()
}));
vi.mock('#lib/glossary/glossary-data/glossary-data.ts', () => ({ loadTermIndex: vi.fn() }));
vi.mock('#lib/notes/note-link-data/note-link-data.ts', async (original) => ({
	...(await original<object>()),
	loadNoteLinkLabels: vi.fn()
}));
vi.mock('#lib/wall/wall-data/wall-data.ts', () => ({
	loadArtworksOfVisit: vi.fn(),
	loadAtelier: vi.fn()
}));

const lilies = testArtwork(1, 'Water Lilies');

beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(loadAtelier).mockResolvedValue({ artworks: [lilies] });
	vi.mocked(loadArtworksOfVisit).mockResolvedValue({ artworks: [lilies] });
	vi.mocked(loadTermIndex).mockResolvedValue({ terms: [] });
	vi.mocked(loadNoteLinkLabels).mockResolvedValue(undefined);
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

	it('shows no artworks for a visit without artworks', async () => {
		vi.mocked(loadVisit).mockResolvedValue({ visit: testVisit({ artworkIds: [] }) });

		const data = await loadVisitPage('id');

		expect(loadAtelier).not.toHaveBeenCalled();
		expect(data.artworks).toEqual([]);
	});

	it('loads the note links only for a note that links, and the glossary for any note', async () => {
		vi.mocked(loadVisit).mockResolvedValue({ visit: testVisit({ artworkIds: [lilies.id] }) });

		const data = await loadVisitPage('id');

		expect(loadNoteLinkLabels).not.toHaveBeenCalled();
		expect(loadTermIndex).toHaveBeenCalled();
		expect(loadArtworksOfVisit).toHaveBeenCalledWith('id');
		expect(loadAtelier).not.toHaveBeenCalled();
		expect(data.artworks).toEqual([lilies]);
		expect(data.glossary).toEqual([]);
	});

	it('loads the note links for a note with a link and nothing more without a note', async () => {
		vi.mocked(loadVisit).mockResolvedValue({
			visit: testVisit({ notes: 'Obok [#0001 Water Lilies](/atelier/1).' })
		});
		await loadVisitPage('id');
		expect(loadNoteLinkLabels).toHaveBeenCalledExactlyOnceWith({ visitId: 'id' });

		vi.clearAllMocks();
		vi.mocked(loadArtworksOfVisit).mockResolvedValue({ artworks: [] });
		vi.mocked(loadVisit).mockResolvedValue({ visit: testVisit({ notes: '' }) });
		await loadVisitPage('id');
		expect(loadTermIndex).not.toHaveBeenCalled();
	});

	it('keeps a failed load of the visits of a trip apart from its artworks', async () => {
		vi.mocked(loadVisit).mockResolvedValue({ visit: testTrip({ artworkIds: [lilies.id] }) });
		vi.mocked(loadTripVisits).mockResolvedValue({ visits: [], error: 'offline' });

		const data = await loadVisitPage('trip');

		expect(data.tripVisitsError).toBe('offline');
		expect(data.artworksError).toBeUndefined();
		expect(data.artworks).toEqual([lilies]);
	});
});
