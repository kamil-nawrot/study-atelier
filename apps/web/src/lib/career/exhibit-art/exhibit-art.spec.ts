import { describe, expect, it } from 'vitest';
import { artOf, credits, imageOf } from './exhibit-art.ts';

describe('exhibit art', () => {
	it('finds the engraving of an exhibit and its image in a metal', () => {
		expect(artOf('memory')?.credit).toBe('Albrecht Dürer, „Święty Hieronim w pracowni”, 1514');
		expect(artOf('unknown')).toBeUndefined();
		expect(imageOf('memory', 'gold')).toBe('exhibits/memory/gold.webp');
	});

	it('credits only the engravings that are shown, in their order', () => {
		expect(credits(['regular', 'unknown', 'collection']).map((art) => art.commonsFile)).toEqual([
			'Albrecht Dürer, Melencolia I, 1514, NGA 6640.jpg',
			'1655 - Frontispiece of Museum Wormiani Historia.jpg'
		]);
	});
});
