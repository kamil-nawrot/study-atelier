import { describe, expect, it } from 'vitest';
import { authArtworks, commonsImageUrl, pickArtwork } from './auth-artworks';

describe('commonsImageUrl', () => {
	it('builds a Wikimedia Commons thumbnail URL', () => {
		expect(commonsImageUrl('Tsunami_by_hokusai_19th_century.jpg', 1280)).toBe(
			'https://commons.wikimedia.org/wiki/Special:FilePath/Tsunami_by_hokusai_19th_century.jpg?width=1280'
		);
	});
});

describe('pickArtwork', () => {
	it('picks the first and last artwork at the ends of the range', () => {
		expect(pickArtwork(() => 0)).toBe(authArtworks[0]);
		expect(pickArtwork(() => 0.999)).toBe(authArtworks[authArtworks.length - 1]);
	});
});
