import { describe, expect, it } from 'vitest';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { m } from '#lib/i18n/i18n.ts';
import type { SymbolMeaning } from '#lib/symbols/types/symbol-meaning.ts';
import type { SymbolPin } from '#lib/symbols/types/symbol-pin.ts';
import { detailsWithoutMeaning, meaningSections, symbolDetails } from './symbol-page.ts';

const holbein = testArtwork(1, 'The Ambassadors', {
	authors: ['Hans Holbein'],
	date: '1533',
	yearFrom: null,
	yearTo: 1533,
	eraCode: 'early_modern',
	period: 'Renaissance'
});
const caravaggio = testArtwork(2, 'Saint Jerome Writing', {
	authors: ['Caravaggio'],
	date: '1605–1606',
	yearFrom: 1605,
	yearTo: 1606,
	eraCode: 'early_modern',
	period: 'Baroque',
	styles: ['Tenebrism']
});
const cezanne = testArtwork(3, 'Pyramid of Skulls', {
	authors: [],
	date: undefined,
	yearTo: 1901,
	eraCode: 'modern'
});

const meanings: SymbolMeaning[] = [
	{ id: 'transience', text: 'transience', contexts: [] },
	{ id: 'penance', text: 'penance', contexts: [] }
];

const lens = { thumbnail: { left: 0, top: 0, width: 100, height: 100 } };

const pins: SymbolPin[] = [
	{ pinId: 'p1', artworkId: holbein.id, meaningId: 'transience' },
	{ pinId: 'p2', artworkId: caravaggio.id, meaningId: 'penance' },
	{ pinId: 'p3', artworkId: cezanne.id, meaningId: null },
	{ pinId: 'p4', artworkId: 'artwork-in-trash', meaningId: 'transience' },
	{ pinId: 'p5', artworkId: holbein.id, meaningId: 'removed' }
];

describe('symbolDetails', () => {
	it('names each pin by its artwork and leaves out artworks not shown', () => {
		const details = symbolDetails(pins, [holbein, caravaggio, cezanne], new Map([['p1', lens]]));

		expect(details.map((detail) => detail.pinId)).toEqual(['p1', 'p2', 'p3', 'p5']);
		expect(details[0]).toEqual({
			pinId: 'p1',
			meaningId: 'transience',
			artworkId: holbein.id,
			number: 1,
			title: 'The Ambassadors',
			byline: 'Hans Holbein, 1533',
			year: 1533,
			lens
		});
		expect(details[1].year).toBe(1605);
		expect(details[2].byline).toBe(m.ui.unknownAuthor);
		expect(details[2].lens).toBeUndefined();
	});
});

describe('meaning sections', () => {
	it('groups the details under their meanings ', () => {
		const artworks = [holbein, caravaggio, cezanne];
		const details = symbolDetails(pins, artworks, new Map());
		const sections = meaningSections(meanings, details);

		expect(sections.map((section) => section.details.map((detail) => detail.pinId))).toEqual([
			['p1'],
			['p2']
		]);
		expect(detailsWithoutMeaning(meanings, details).map((detail) => detail.pinId)).toEqual([
			'p3',
			'p5'
		]);
	});
});
