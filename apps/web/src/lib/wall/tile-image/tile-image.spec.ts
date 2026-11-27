import { describe, expect, it } from 'vitest';
import { albumImage, DEFAULT_IMAGE_SIZE } from './tile-image.ts';

describe('albumImage', () => {
	it('shows an album image at once from the albums folder in its stored size', () => {
		expect(albumImage('sample-album/images/spiral.webp', { width: 600, height: 900 })).toEqual({
			src: expect.stringMatching(/\/albums\/sample-album\/images\/spiral\.webp$/),
			width: 600,
			height: 900
		});
	});

	it('takes the default size of a tile when the size is unknown', () => {
		expect(albumImage('sample-album/images/spiral.webp', undefined)).toMatchObject(
			DEFAULT_IMAGE_SIZE
		);
	});
});
