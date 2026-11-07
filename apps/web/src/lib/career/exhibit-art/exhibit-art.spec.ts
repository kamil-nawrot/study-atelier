import { describe, expect, it } from 'vitest';
import { artOf, credits, imageOf, pageOf } from './exhibit-art.ts';

describe('exhibit art', () => {
	it('finds the engraving of an exhibit and its image in a metal', () => {
		expect(artOf('memory')?.credit).toBe('Albrecht Dürer, „Święty Hieronim w pracowni”, 1514');
		expect(artOf('unknown')).toBeUndefined();
		expect(imageOf('memory', 'gold')).toBe('exhibits/memory/gold.webp');
	});

	it('credits only the engravings that are shown, in their order', () => {
		expect(credits(['regular', 'unknown', 'collection']).map(pageOf)).toEqual([
			'https://commons.wikimedia.org/wiki/File:Albrecht_D%C3%BCrer%2C_Melencolia_I%2C_1514%2C_NGA_6640.jpg',
			'https://commons.wikimedia.org/wiki/File:1655_-_Frontispiece_of_Museum_Wormiani_Historia.jpg'
		]);
	});

	it('links an engraving from a museum to its page', () => {
		expect(credits(['figure_alphabet']).map(pageOf)).toEqual([
			'https://id.smb.museum/object/1543315'
		]);
	});
});
