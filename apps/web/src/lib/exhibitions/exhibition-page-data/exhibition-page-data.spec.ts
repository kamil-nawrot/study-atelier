import { beforeEach, describe, expect, it, vi } from 'vitest';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { loadArtworksByIds } from '#lib/exhibitions/exhibition-artworks-data/exhibition-artworks-data.ts';
import {
	loadExhibition,
	loadExhibitionSummaries
} from '#lib/exhibitions/exhibition-data/exhibition-data.ts';
import { loadTermIndex } from '#lib/glossary/glossary-data/glossary-data.ts';
import { loadSymbolOptions } from '#lib/symbols/symbols-data/symbols-data.ts';
import {
	loadArchivedExhibitions,
	loadExhibitionList,
	loadExhibitionPage
} from './exhibition-page-data.ts';

vi.mock('#lib/exhibitions/exhibition-data/exhibition-data.ts', () => ({
	loadExhibition: vi.fn(),
	loadExhibitionSummaries: vi.fn()
}));
vi.mock('#lib/exhibitions/exhibition-artworks-data/exhibition-artworks-data.ts', () => ({
	loadArtworksByIds: vi.fn()
}));
vi.mock('#lib/glossary/glossary-data/glossary-data.ts', () => ({
	loadTermIndex: vi.fn()
}));
vi.mock('#lib/symbols/symbols-data/symbols-data.ts', () => ({
	loadSymbolOptions: vi.fn()
}));

const skull = { id: 's1', name: 'Skull', meanings: [] };

import type { ExhibitionSummary } from '#lib/exhibitions/types/exhibition-summary.ts';

const ID = '3f2c1d4e-5a6b-4c7d-8e9f-0a1b2c3d4e5f';
const cover = testArtwork(1, 'Judith');

function summary(
	overrides: Partial<ExhibitionSummary & { deletedAt: string | null }> = {}
): ExhibitionSummary & { deletedAt: string | null } {
	return {
		id: ID,
		title: 'Light',
		updatedAt: '2026-11-01T10:00:00Z',
		deletedAt: null,
		artworkCount: 1,
		coverId: cover.id,
		...overrides
	};
}

beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(loadArtworksByIds).mockResolvedValue({ artworks: [cover] });
	vi.mocked(loadTermIndex).mockResolvedValue({ terms: [] } as never);
	vi.mocked(loadSymbolOptions).mockResolvedValue({ symbols: [skull] });
});

describe('loadExhibitionList', () => {
	it('loads the covers once for all exhibitions', async () => {
		vi.mocked(loadExhibitionSummaries).mockResolvedValue({
			exhibitions: [summary(), summary({ id: 'other' })]
		});

		const data = await loadExhibitionList();

		expect(loadArtworksByIds).toHaveBeenCalledWith([cover.id]);
		expect(data.covers).toEqual([cover]);
		expect(data.exhibitions).toHaveLength(2);
	});

	it('passes a failure on without asking for covers', async () => {
		vi.mocked(loadExhibitionSummaries).mockResolvedValue({ exhibitions: [], error: 'Boom' });

		const data = await loadExhibitionList();

		expect(data.error).toBe('Boom');
		expect(loadArtworksByIds).not.toHaveBeenCalled();
	});
});

describe('loadArchivedExhibitions', () => {
	it('dates each exhibition by the day it went to Archiwum', async () => {
		vi.mocked(loadExhibitionSummaries).mockResolvedValue({
			exhibitions: [summary({ deletedAt: '2026-11-05T09:00:00Z' })]
		});

		const data = await loadArchivedExhibitions();

		expect(loadExhibitionSummaries).toHaveBeenCalledWith(true);
		expect(data.archived[0].deletedAt).toBe('2026-11-05T09:00:00Z');
		expect(data.archivedCovers).toEqual([cover]);
	});
});

describe('loadExhibitionPage', () => {
	it('is not found for an id that is not an id, without asking the database', async () => {
		const data = await loadExhibitionPage('nope');

		expect(data.notFound).toBe(true);
		expect(loadExhibition).not.toHaveBeenCalled();
	});

	it('is not found when the exhibition is not there', async () => {
		vi.mocked(loadExhibition).mockResolvedValue({});

		expect((await loadExhibitionPage(ID)).notFound).toBe(true);
	});

	it('loads the artworks the document shows', async () => {
		const exhibition = {
			id: ID,
			title: 'Light',
			revision: 1,
			updatedAt: '2026-11-01T10:00:00Z',
			document: {
				type: 'doc',
				content: [{ type: 'artwork', attrs: { artworkId: cover.id } }]
			}
		};
		vi.mocked(loadExhibition).mockResolvedValue({ exhibition });

		const data = await loadExhibitionPage(ID);

		expect(loadArtworksByIds).toHaveBeenCalledWith([cover.id]);
		expect(data.exhibition).toEqual(exhibition);
		expect(data.artworks).toEqual([cover]);
		expect(data.symbols).toEqual([skull]);
	});

	it('passes a failure on', async () => {
		vi.mocked(loadExhibition).mockResolvedValue({ error: 'Boom' });

		expect((await loadExhibitionPage(ID)).error).toBe('Boom');
	});
});
