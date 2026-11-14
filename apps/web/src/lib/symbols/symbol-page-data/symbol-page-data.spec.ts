import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadCardIndex } from '#lib/card-index/card-index-data/card-index-data.ts';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { loadTermIndex } from '#lib/glossary/glossary-data/glossary-data.ts';
import { fragmentLenses } from '#lib/pins/fragment-lenses/fragment-lenses.ts';
import { loadSymbol, loadSymbolPins } from '#lib/symbols/symbols-data/symbols-data.ts';
import { testLens, testSymbol } from '#lib/testing/symbols/symbols.ts';
import { loadArtworksOfSymbol } from '#lib/wall/wall-data/wall-data.ts';
import { loadSymbolForm, loadSymbolPage } from './symbol-page-data.ts';

vi.mock('#lib/symbols/symbols-data/symbols-data.ts', () => ({
	loadSymbol: vi.fn(),
	loadSymbolPins: vi.fn()
}));
vi.mock('#lib/wall/wall-data/wall-data.ts', () => ({ loadArtworksOfSymbol: vi.fn() }));
vi.mock('#lib/pins/fragment-lenses/fragment-lenses.ts', () => ({ fragmentLenses: vi.fn() }));
vi.mock('#lib/card-index/card-index-data/card-index-data.ts', () => ({ loadCardIndex: vi.fn() }));
vi.mock('#lib/glossary/glossary-data/glossary-data.ts', () => ({ loadTermIndex: vi.fn() }));

const fragment = {
	pinId: 'pin-1',
	artworkId: 'artwork-12',
	x: 0.5,
	y: 0.5,
	viewWidth: 0.2,
	text: '',
	image: null
};

describe('symbol page data', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(loadSymbol).mockResolvedValue({ symbol: testSymbol });
		vi.mocked(loadSymbolPins).mockResolvedValue({
			pins: [
				{ pinId: 'pin-1', artworkId: 'artwork-12', meaningId: 'penance', fragment },
				{ pinId: 'pin-2', artworkId: 'artwork-12', meaningId: null }
			]
		});
		vi.mocked(loadArtworksOfSymbol).mockResolvedValue({
			artworks: [testArtwork(12, 'Saint Jerome Writing', { eraCode: 'early_modern' })]
		});
		vi.mocked(fragmentLenses).mockResolvedValue(new Map([['pin-1', testLens]]));
	});

	it('groups the details of the symbol under its meanings', async () => {
		const result = await loadSymbolPage('skull');

		expect(fragmentLenses).toHaveBeenCalledWith([fragment]);
		expect(result.sections[1].details.map((detail) => detail.pinId)).toEqual(['pin-1']);
		expect(result.withoutMeaning.map((detail) => detail.pinId)).toEqual(['pin-2']);
		expect(result.details).toHaveLength(2);
	});

	it('shows the meanings when the details fail to load', async () => {
		vi.mocked(loadSymbolPins).mockResolvedValue({ pins: [], error: 'Offline.' });

		const result = await loadSymbolPage('skull');

		expect(result.detailsError).toBe('Offline.');
		expect(result.sections).toHaveLength(2);
	});

	it('passes on a missing symbol', async () => {
		vi.mocked(loadSymbol).mockResolvedValue({ notFound: true });

		await expect(loadSymbolPage('gone')).resolves.toMatchObject({ notFound: true });
	});

	it('loads the labels to suggest in the form', async () => {
		vi.mocked(loadCardIndex).mockResolvedValue({
			index: { values: [], periodEras: [], stylePeriods: [] }
		} as never);
		vi.mocked(loadTermIndex).mockResolvedValue({ terms: [] } as never);

		const form = await loadSymbolForm('skull');
		expect(form.symbol).toEqual(testSymbol);
		expect(form.candidates).toEqual([]);
		expect(loadCardIndex).not.toHaveBeenCalled();
		expect(loadTermIndex).not.toHaveBeenCalled();

		await expect(loadSymbolForm()).resolves.toEqual({ candidates: expect.any(Array) });
		expect(loadCardIndex).toHaveBeenCalledOnce();

		vi.mocked(loadSymbol).mockResolvedValue({ notFound: true });
		await expect(loadSymbolForm('gone')).resolves.toEqual({ candidates: [], notFound: true });

		vi.mocked(loadTermIndex).mockResolvedValue({ terms: [], error: 'Offline.' } as never);
		await expect(loadSymbolForm()).resolves.toEqual({ candidates: [], error: 'Offline.' });
	});
});
