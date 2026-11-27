import { describe, expect, it } from 'vitest';
import type { ArtworkImageInput } from '#lib/catalogue/types/artwork-image-input.ts';
import type { ComparedSide } from '#lib/compare/types/compared-side.ts';
import { emptyArtworkInput } from '#lib/testing/artwork-input/artwork-input.ts';
import { imageSelectable, offeredImages, ownImageSelectable } from './album-merge-images.ts';

function side(overrides: Partial<ComparedSide>): ComparedSide {
	return { ...emptyArtworkInput(), title: 'Wenus', ...overrides };
}

function albumImage(name: string): ArtworkImageInput {
	return {
		kind: 'album',
		path: `venus/images/${name}.webp`,
		wikidataId: null,
		licence: 'CC0',
		licenceUrl: null,
		attribution: null,
		width: 600,
		height: 800
	};
}

function ownImage(id: string): ArtworkImageInput {
	return { kind: 'url', url: `https://example.org/${id}.jpg`, width: 10, height: 10, id };
}

const NONE = { images: [], droppedImages: [] };
const FOUR = side({ image: ownImage('a'), images: ['b', 'c', 'd'].map(ownImage) });
const FIVE = side({ image: ownImage('a'), images: ['b', 'c', 'd', 'e'].map(ownImage) });

describe('imageSelectable', () => {
	it('offers an album image within the limit of five', () => {
		expect(imageSelectable(FOUR, NONE, 'venus/images/front.webp')).toBe(true);
		expect(imageSelectable(FIVE, NONE, 'venus/images/front.webp')).toBe(false);
		expect(
			imageSelectable(
				FOUR,
				{ images: ['venus/images/back.webp'], droppedImages: [] },
				'venus/images/front.webp'
			)
		).toBe(false);
		expect(
			imageSelectable(
				FOUR,
				{ images: ['venus/images/back.webp'], droppedImages: [] },
				'venus/images/back.webp'
			)
		).toBe(true);
	});

	it('makes room when an own image is unticked', () => {
		expect(
			imageSelectable(FIVE, { images: [], droppedImages: ['a'] }, 'venus/images/front.webp')
		).toBe(true);
	});
});

describe('ownImageSelectable', () => {
	it('lets an unticked own image back only within the limit', () => {
		const full = { images: ['venus/images/front.webp'], droppedImages: ['a'] };

		expect(ownImageSelectable(FIVE, full, 'a')).toBe(false);
		expect(ownImageSelectable(FIVE, full, 'b')).toBe(true);
	});
});

describe('offeredImages', () => {
	it('leaves out an album image the artwork already has', () => {
		expect(
			offeredImages(
				side({ image: albumImage('front') }),
				side({ image: albumImage('front'), images: [albumImage('back')] })
			)
		).toEqual([albumImage('back')]);
	});
});
