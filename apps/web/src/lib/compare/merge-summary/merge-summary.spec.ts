import { describe, expect, it } from 'vitest';
import type { ArtworkImageInput } from '#lib/catalogue/types/artwork-image-input.ts';
import type { ComparedSide } from '#lib/compare/types/compared-side.ts';
import { emptyArtworkInput } from '#lib/testing/artwork-input/artwork-input.ts';
import { removedParts, takenParts } from './merge-summary.ts';

function side(overrides: Partial<ComparedSide>): ComparedSide {
	return { ...emptyArtworkInput(), title: 'A', ...overrides };
}

function ownImage(id: string): ArtworkImageInput {
	return { kind: 'url', url: `https://example.org/${id}.jpg`, width: 10, height: 10, id };
}

const MINE = side({ authors: ['Uczeń'], image: ownImage('a') });
const ALBUM = side({ location: 'NHM', yearTo: 1500, authors: ['Mistrz', 'Czeladnik'] });

describe('takenParts', () => {
	it('names the picked fields, then the added items and images', () => {
		expect(
			takenParts(MINE, ALBUM, {
				fields: ['location', 'date'],
				added: ['authors/Mistrz', 'authors/Czeladnik'],
				dropped: [],
				images: ['x'],
				droppedImages: []
			})
		).toEqual(['rok powstania', 'miejsce', '2 autorów', '1 obraz']);
	});
});

describe('removedParts', () => {
	it('names the unticked items and counts the unticked images', () => {
		expect(
			removedParts(MINE, {
				fields: [],
				added: [],
				dropped: ['authors/Uczeń'],
				images: [],
				droppedImages: ['a']
			})
		).toEqual(['Uczeń', '1 obraz']);
	});
});
