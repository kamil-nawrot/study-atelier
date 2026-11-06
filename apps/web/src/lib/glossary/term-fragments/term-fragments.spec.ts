import { beforeEach, describe, expect, it, vi } from 'vitest';
import { termFragments } from './term-fragments.ts';
import { ownImageUrls } from '#lib/images/own-image-data/own-image-data.ts';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import type { PinFragment } from '#lib/pins/types/pin-fragment.ts';

vi.mock('#lib/images/own-image-data/own-image-data.ts', () => ({ ownImageUrls: vi.fn() }));

function artwork(id: string, number: number, title: string): WallArtwork {
	return {
		id,
		number,
		title,
		authors: [],
		yearFrom: null,
		yearTo: null,
		eraCode: null,
		typeCode: null,
		period: null,
		styles: [],
		materials: [],
		location: null,
		hasImage: true,
		favourite: false
	};
}

function fragment(pinId: string, artworkId: string, extra: Partial<PinFragment> = {}): PinFragment {
	return {
		pinId,
		artworkId,
		x: 0.25,
		y: 0.75,
		viewWidth: 0.1,
		text: 'Apsyda od wschodu',
		image: { kind: 'upload', path: 'owner/main.jpg', width: 800, height: 400, id: 'image-1' },
		...extra
	};
}

describe('termFragments', () => {
	beforeEach(() => {
		vi.mocked(ownImageUrls).mockResolvedValue(
			new Map([
				['owner/pin-1-crop-a.jpg', 'https://storage.test/crop'],
				['owner/main-thumb.jpg', 'https://storage.test/thumbnail']
			])
		);
	});

	it('signs the crops and the fallback thumbnails in one request', async () => {
		const fragments = await termFragments(
			[fragment('pin-1', 'artwork-1', { cropPath: 'owner/pin-1-crop-a.jpg' })],
			[artwork('artwork-1', 12, 'Katedra')]
		);

		expect(ownImageUrls).toHaveBeenCalledTimes(1);
		expect(fragments).toEqual([
			{
				pinId: 'pin-1',
				number: 12,
				title: 'Katedra',
				text: 'Apsyda od wschodu',
				crop: 'https://storage.test/crop',
				thumbnail: {
					src: 'https://storage.test/thumbnail',
					left: -200,
					top: -325,
					width: 1000,
					height: 500
				}
			}
		]);
	});

	it('cuts the view of the pin from a medium image when the crop is missing', async () => {
		const [shown] = await termFragments(
			[
				fragment('pin-2', 'artwork-1', {
					image: {
						kind: 'commons',
						wikidataId: 'Q1',
						file: 'Apse.jpg',
						licence: null,
						licenceUrl: null,
						attribution: null,
						width: null,
						height: null
					}
				})
			],
			[artwork('artwork-1', 12, 'Katedra')]
		);

		expect(shown?.crop).toBeUndefined();
		expect(shown?.thumbnail).toEqual({
			src: expect.stringContaining('Apse.jpg'),
			left: -200,
			top: -700,
			width: 1000,
			height: 1000
		});
	});

	it('leaves out the pins of artworks that are not shown', async () => {
		const fragments = await termFragments(
			[fragment('pin-1', 'artwork-1'), fragment('pin-3', 'artwork-trashed')],
			[artwork('artwork-1', 12, 'Katedra')]
		);

		expect(fragments.map((shown) => shown.pinId)).toEqual(['pin-1']);
	});
});
