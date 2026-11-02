import { beforeEach, describe, expect, it, vi } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { testCardIndex } from '#lib/testing/card-index/card-index.ts';
import { loadArtworksOfValue } from '#lib/wall/wall-data/wall-data.ts';
import { loadCardIndex } from '#lib/card-index/card-index-data/card-index-data.ts';
import { loadMentions } from '#lib/notes/mentions-data/mentions-data.ts';
import { loadNoteLinkLabels, loadNoteLinks } from '#lib/notes/note-link-data/note-link-data.ts';
import { loadValueDetails } from '#lib/values/value-details-data/value-details-data.ts';
import { loadPlaceVisits } from '#lib/chronicle/chronicle-data/chronicle-data.ts';
import { testVisit } from '#lib/testing/chronicle/chronicle.ts';
import { loadValuePage } from './value-page-data.ts';

vi.mock('#lib/wall/wall-data/wall-data.ts', () => ({ loadArtworksOfValue: vi.fn() }));
vi.mock('#lib/card-index/card-index-data/card-index-data.ts', () => ({ loadCardIndex: vi.fn() }));
vi.mock('#lib/chronicle/chronicle-data/chronicle-data.ts', () => ({ loadPlaceVisits: vi.fn() }));
vi.mock('#lib/glossary/glossary-data/glossary-data.ts', () => ({
	loadTermIndex: vi.fn(async () => ({ terms: [] }))
}));
vi.mock('#lib/notes/mentions-data/mentions-data.ts', () => ({ loadMentions: vi.fn() }));
vi.mock('#lib/notes/note-link-data/note-link-data.ts', async (importOriginal) => ({
	...(await importOriginal<typeof import('#lib/notes/note-link-data/note-link-data.ts')>()),
	loadNoteLinks: vi.fn(),
	loadNoteLinkLabels: vi.fn()
}));
vi.mock('#lib/values/value-details-data/value-details-data.ts', async (importOriginal) => ({
	...(await importOriginal<
		typeof import('#lib/values/value-details-data/value-details-data.ts')
	>()),
	loadValueDetails: vi.fn()
}));

const artworks = [testArtwork(1, 'Parthenon')];

describe('loadValuePage', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(loadCardIndex).mockResolvedValue({ index: testCardIndex(), ownValues: [] });
		vi.mocked(loadArtworksOfValue).mockResolvedValue({ artworks });
		vi.mocked(loadNoteLinks).mockResolvedValue(undefined);
		vi.mocked(loadMentions).mockResolvedValue([]);
		vi.mocked(loadValueDetails).mockResolvedValue({
			details: { summary: 'Plain capitals.', notes: '' }
		});
	});

	it('loads the value, its own artworks and the details', async () => {
		const result = await loadValuePage('style', 'style-doric', true);

		expect(loadArtworksOfValue).toHaveBeenCalledWith({ valueId: 'style-doric' });
		expect(result.subject).toEqual({
			kind: 'style',
			record: expect.objectContaining({ id: 'style-doric' })
		});
		expect(result.artworks).toEqual(artworks);
		expect(result.details.summary).toBe('Plain capitals.');
		expect(result.error).toBeUndefined();
	});

	it('loads the visits to a place on its page only', async () => {
		const visits = [testVisit()];
		vi.mocked(loadPlaceVisits).mockResolvedValue({ visits });

		const place = await loadValuePage('location', 'location-athens', true);
		const form = await loadValuePage('location', 'location-athens', false);
		const style = await loadValuePage('style', 'style-doric', true);

		expect(loadPlaceVisits).toHaveBeenCalledExactlyOnceWith('location-athens');
		expect(place.visits).toEqual(visits);
		expect(form.visits).toBeUndefined();
		expect(style.visits).toBeUndefined();
	});

	it('shows the place without its visits when they cannot be loaded', async () => {
		vi.mocked(loadPlaceVisits).mockResolvedValue({ visits: [], error: 'Brak sieci.' });

		const result = await loadValuePage('location', 'location-athens', true);

		expect(result.error).toBeUndefined();
		expect(result.visits).toBeUndefined();
	});

	it('filters the artworks of an era by its code', async () => {
		await loadValuePage('era', 'antiquity', true);

		expect(loadArtworksOfValue).toHaveBeenCalledWith({ eraCode: 'antiquity' });
	});

	it('does not load the artworks for the form', async () => {
		const result = await loadValuePage('era', 'antiquity', false);

		expect(loadArtworksOfValue).not.toHaveBeenCalled();
		expect(result.subject).toEqual({ kind: 'era', code: 'antiquity' });
	});

	it('loads the note link labels on the page only for notes that link', async () => {
		const noteLinks = { suggest: vi.fn(), resolve: vi.fn() };
		vi.mocked(loadNoteLinkLabels).mockResolvedValue(noteLinks);

		const plain = await loadValuePage('style', 'style-doric', true);
		expect(loadNoteLinkLabels).not.toHaveBeenCalled();
		expect(plain.noteLinks).toBeUndefined();

		vi.mocked(loadValueDetails).mockResolvedValue({
			details: { summary: '', notes: 'See [x](/atelier/1).' }
		});
		const linking = await loadValuePage('style', 'style-doric', true);

		expect(loadNoteLinkLabels).toHaveBeenCalledExactlyOnceWith({ valueId: 'style-doric' });
		expect(loadNoteLinks).not.toHaveBeenCalled();
		expect(linking.noteLinks).toBe(noteLinks);
	});

	it('loads the mentions of the value on the page only', async () => {
		const mention = { href: '/atelier/1', name: '#0001 Parthenon', kind: 'Dzieło' } as never;
		vi.mocked(loadMentions).mockResolvedValue([mention]);

		const page = await loadValuePage('style', 'style-doric', true);
		const form = await loadValuePage('style', 'style-doric', false);

		expect(page.mentions).toEqual([mention]);
		expect(loadMentions).toHaveBeenCalledExactlyOnceWith(
			{ valueId: 'style-doric' },
			'/atelier/values/style/style-doric'
		);
		expect(form.mentions).toBeUndefined();
	});

	it('loads the sources of note links for the form', async () => {
		const noteLinks = { suggest: vi.fn(), resolve: vi.fn() };
		vi.mocked(loadNoteLinks).mockResolvedValue(noteLinks);

		const result = await loadValuePage('style', 'style-doric', false);

		expect(result.noteLinks).toBe(noteLinks);
	});

	it('says an unknown kind or value does not exist', async () => {
		await expect(loadValuePage('type', 'x', true)).resolves.toMatchObject({
			notFound: true,
			error: m.valuePage.notFound
		});
		await expect(loadValuePage('style', 'period-classical', true)).resolves.toMatchObject({
			notFound: true
		});
	});

	it('reports a failed load', async () => {
		vi.mocked(loadArtworksOfValue).mockResolvedValue({
			artworks: [],
			error: m.collectionErrors.network
		});

		await expect(loadValuePage('style', 'style-doric', true)).resolves.toMatchObject({
			error: m.collectionErrors.network,
			notFound: false
		});
	});
});
