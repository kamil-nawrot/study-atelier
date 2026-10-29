import { describe, expect, it } from 'vitest';
import { artOf, credits } from './exhibit-art.ts';

describe('exhibit art', () => {
	it('finds the engraving of an exhibit', () => {
		expect(artOf('collection')?.file).toBe('exhibits/collection.jpg');
		expect(artOf('unknown')).toBeUndefined();
	});

	it('credits only the engravings that are shown, in their order', () => {
		expect(credits(['regular', 'unknown', 'collection']).map((art) => art.file)).toEqual([
			'exhibits/regular.jpg',
			'exhibits/collection.jpg'
		]);
	});
});
