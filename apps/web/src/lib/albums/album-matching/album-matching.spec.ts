import { describe, expect, it } from 'vitest';
import {
	artworkState,
	compareWithAlbumHref,
	galleryQuery,
	listQuery,
	ownedCount
} from './album-matching.ts';
import type { Album } from '#lib/albums/types/album.ts';
import type { AlbumArtwork } from '#lib/albums/types/album-artwork.ts';
import type { AtelierMatch } from '#lib/albums/types/atelier-match.ts';

function artwork(id: string, title: string, wikidataId: string | null = null): AlbumArtwork {
	return {
		id,
		revision: 1,
		wikidataId,
		typeCode: null,
		eraCode: null,
		yearFrom: null,
		yearTo: null,
		yearApproximate: false,
		valueIds: [],
		termIds: [],
		eventIds: [],
		images: [
			{
				path: `a/images/${id}.webp`,
				width: 3,
				height: 4,
				licence: 'CC0',
				licenceUrl: null,
				attribution: null
			}
		],
		title,
		alternativeTitles: [],
		description: null
	};
}

function album(slug: string, artworks: AlbumArtwork[]): Album {
	return {
		slug,
		language: 'pl',
		eraCode: 'prehistory',
		title: slug,
		description: '',
		artworks,
		values: [],
		terms: [],
		events: []
	};
}

function match(number: number, title: string, extra: Partial<AtelierMatch> = {}): AtelierMatch {
	return { id: `id-${number}`, number, title, albumEntry: null, wikidataIds: [], ...extra };
}

const venus = artwork('venus', 'Venus of Willendorf', 'Q131397');
const lion = artwork('lion', 'Lion Man');
const horse = artwork('horse', 'Vogelherd Horse');
const sample = album('sample', [venus, lion, horse]);

describe('artworkState', () => {
	it('finds an artwork taken from the entry, whatever its title', () => {
		const matches = [match(3, 'My Venus', { albumEntry: 'sample/venus' })];

		expect(artworkState('sample', venus, matches)).toEqual({ kind: 'owned', number: 3 });
	});

	it('finds an artwork with the Wikidata id of the album artwork', () => {
		const matches = [match(5, 'Statuette', { wikidataIds: ['Q131397'] })];

		expect(artworkState('sample', venus, matches)).toEqual({ kind: 'owned', number: 5 });
	});

	it('does not take an entry of another album for this one', () => {
		const matches = [match(3, 'Other', { albumEntry: 'other/venus' })];

		expect(artworkState('sample', venus, matches)).toEqual({ kind: 'new' });
	});

	it('only marks an equal title ignoring letter case as similar', () => {
		const matches = [match(7, 'lion man '), match(8, 'Lion Man of Hohlenstein')];

		expect(artworkState('sample', lion, matches)).toEqual({ kind: 'similar', number: 7 });
		expect(artworkState('sample', horse, matches)).toEqual({ kind: 'new' });
	});

	it('prefers a sure match to a similar title', () => {
		const matches = [
			match(2, 'Venus of Willendorf'),
			match(9, 'Mine', { albumEntry: 'sample/venus' })
		];

		expect(artworkState('sample', venus, matches)).toEqual({ kind: 'owned', number: 9 });
	});
});

describe('ownedCount', () => {
	it('counts the album artworks found for sure, not the similar ones', () => {
		const matches = [
			match(1, 'x', { albumEntry: 'sample/lion' }),
			match(2, 'y', { wikidataIds: ['Q131397'] }),
			match(3, 'Vogelherd Horse')
		];

		expect(ownedCount(sample, matches)).toBe(2);
	});
});

describe('queries', () => {
	it('asks for every listed album by entry and Wikidata id, without titles', () => {
		const other = album('other', [artwork('cave', 'Cave', 'Q1'), artwork('copy', 'Copy', 'Q1')]);

		expect(listQuery([sample, other])).toEqual({
			slugs: ['sample', 'other'],
			wikidataIds: ['Q131397', 'Q1'],
			titles: []
		});
	});

	it('asks for one album with the titles of its artworks', () => {
		expect(galleryQuery(sample)).toEqual({
			slugs: ['sample'],
			wikidataIds: ['Q131397'],
			titles: ['Venus of Willendorf', 'Lion Man', 'Vogelherd Horse']
		});
	});
});

describe('compareWithAlbumHref', () => {
	it('links the learner artwork with the album entry in the comparison', () => {
		expect(compareWithAlbumHref(3, 'sample', 'venus')).toBe(
			'/atelier/compare?left=3&album=sample%2Fvenus'
		);
	});
});
