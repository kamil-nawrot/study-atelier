import { describe, expect, it } from 'vitest';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { blanksOf } from './blanks.ts';

describe('blanksOf', () => {
	it('counts the gaps of the wall filter and leaves out those with none', () => {
		const blanks = blanksOf([
			testArtwork(1, 'A', {
				hasImage: false,
				yearTo: null,
				eraCode: null,
				period: null,
				typeCode: null
			}),
			testArtwork(2, 'B', { eraCode: 'modern', period: 'Romanticism', typeCode: 'painting' })
		]);

		expect(blanks).toEqual([
			{ kind: 'image', count: 1 },
			{ kind: 'year', count: 1 },
			{ kind: 'era', count: 1 },
			{ kind: 'period', count: 1 },
			{ kind: 'type', count: 1 }
		]);
	});

	it('finds nothing when every artwork is described', () => {
		expect(
			blanksOf([
				testArtwork(1, 'A', { eraCode: 'modern', period: 'Romanticism', typeCode: 'painting' })
			])
		).toEqual([]);
	});
});
