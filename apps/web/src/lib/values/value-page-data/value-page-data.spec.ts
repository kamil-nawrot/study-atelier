import { beforeEach, describe, expect, it, vi } from 'vitest';
import { m } from '#lib/i18n/index.ts';
import { testArtwork } from '#lib/testing/artworks.ts';
import { testCardIndex } from '#lib/testing/card-index.ts';
import { loadAtelier } from '#lib/wall/wall-data/wall-data.ts';
import { loadCardIndex } from '#lib/card-index/card-index-data/card-index-data.ts';
import { loadMentions } from '#lib/notes/mentions-data/mentions-data.ts';
import { loadNoteLinks } from '#lib/notes/note-link-data/note-link-data.ts';
import { loadValueDetails } from '#lib/values/value-details-data/value-details-data.ts';
import { loadValuePage } from './value-page-data.ts';

vi.mock('#lib/wall/wall-data/wall-data.ts', () => ({ loadAtelier: vi.fn() }));
vi.mock('#lib/card-index/card-index-data/card-index-data.ts', () => ({ loadCardIndex: vi.fn() }));
vi.mock('#lib/notes/mentions-data/mentions-data.ts', () => ({ loadMentions: vi.fn() }));
vi.mock('#lib/notes/note-link-data/note-link-data.ts', async (importOriginal) => ({
	...(await importOriginal<typeof import('#lib/notes/note-link-data/note-link-data.ts')>()),
	loadNoteLinks: vi.fn()
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
		vi.mocked(loadAtelier).mockResolvedValue({ artworks });
		vi.mocked(loadNoteLinks).mockResolvedValue(undefined);
		vi.mocked(loadMentions).mockResolvedValue([]);
		vi.mocked(loadValueDetails).mockResolvedValue({
			details: { summary: 'Plain capitals.', notes: '' }
		});
	});

	it('loads the value, the collection and the details', async () => {
		const result = await loadValuePage('style', 'style-doric', true);

		expect(result.subject).toEqual({
			kind: 'style',
			record: expect.objectContaining({ id: 'style-doric' })
		});
		expect(result.artworks).toEqual(artworks);
		expect(result.details.summary).toBe('Plain capitals.');
		expect(result.error).toBeUndefined();
	});

	it('does not load the collection for the form', async () => {
		const result = await loadValuePage('era', 'antiquity', false);

		expect(loadAtelier).not.toHaveBeenCalled();
		expect(result.subject).toEqual({ kind: 'era', code: 'antiquity' });
	});

	it('resolves note links from the loaded collection on the page', async () => {
		const result = await loadValuePage('style', 'style-doric', true);

		expect(loadNoteLinks).not.toHaveBeenCalled();
		expect(result.noteLinks?.resolve('/atelier/1')).toBe('#0001 Parthenon');
		expect(result.noteLinks?.resolve('/atelier/values/style/style-doric')).toBe('Doric');
	});

	it('loads the mentions of the value on the page only', async () => {
		const mention = { href: '/atelier/1', name: '#0001 Parthenon', kind: 'Dzieło' } as never;
		vi.mocked(loadMentions).mockResolvedValue([mention]);

		const page = await loadValuePage('style', 'style-doric', true);
		const form = await loadValuePage('style', 'style-doric', false);

		expect(page.mentions).toEqual([mention]);
		expect(loadMentions).toHaveBeenCalledTimes(1);
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
		vi.mocked(loadAtelier).mockResolvedValue({ artworks: [], error: m.collectionErrors.network });

		await expect(loadValuePage('style', 'style-doric', true)).resolves.toMatchObject({
			error: m.collectionErrors.network,
			notFound: false
		});
	});
});
