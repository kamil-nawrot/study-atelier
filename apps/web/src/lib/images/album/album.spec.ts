import { describe, expect, it } from 'vitest';
import { albumFileUrl } from './album.ts';

describe('albumFileUrl', () => {
	it('points a path of an album file into the albums folder of the static files', () => {
		expect(albumFileUrl('sample-album/images/spiral.webp')).toMatch(
			/\/albums\/sample-album\/images\/spiral\.webp$/
		);
	});
});
