import { describe, expect, it } from 'vitest';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { dimensionsOf, type Dimension } from '#lib/statistics/dimensions/dimensions.ts';
import { rankingOf } from './rankings.ts';

const authors = dimensionsOf().find((dimension) => dimension.key === 'authors') as Dimension;

function works(...names: string[]): ReturnType<typeof testArtwork>[] {
	return names.map((name, index) =>
		testArtwork(index + 1, `Work ${index}`, { authors: name ? [name] : [] })
	);
}

describe('rankingOf', () => {
	it('waits until three values have at least two artworks each', () => {
		expect(rankingOf(works('A', 'A', 'B', 'B', 'C', 'D'), authors)).toBeNull();
	});

	it('lists the top values and counts the values with a single artwork, without unknown authors', () => {
		const ranking = rankingOf(
			works('A', 'A', 'A', 'B', 'B', 'C', 'C', 'D', '', '', '', ''),
			authors
		);

		expect(ranking?.top.map((row) => [row.value, row.count])).toEqual([
			['A', 3],
			['B', 2],
			['C', 2],
			['D', 1]
		]);
		expect(ranking?.values).toBe(4);
		expect(ranking?.single).toBe(1);
	});
});
