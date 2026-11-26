import type { Album } from '#lib/albums/types/album.ts';
import type { AlbumArtwork } from '#lib/albums/types/album-artwork.ts';

export function albumArtwork(id: string, extra: Partial<AlbumArtwork> = {}): AlbumArtwork {
	return {
		id,
		revision: 1,
		wikidataId: null,
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
				path: `sample-album/images/${id}.webp`,
				width: 3,
				height: 4,
				licence: 'CC0',
				licenceUrl: null,
				attribution: null
			}
		],
		title: id,
		alternativeTitles: [],
		description: null,
		...extra
	};
}

export function testAlbum(extra: Partial<Album> = {}): Album {
	return {
		slug: 'sample-album',
		language: 'pl',
		eraCode: 'prehistory',
		title: 'Paleolithic Venuses',
		description: 'Small figures carved in the Stone Age.',
		artworks: [
			albumArtwork('venus', {
				title: 'Venus of Willendorf',
				valueIds: ['carver'],
				yearTo: -25000,
				yearApproximate: true
			}),
			albumArtwork('lion', { title: 'Lion Man' }),
			albumArtwork('horse', { title: 'Vogelherd Horse', alternativeTitles: ['Ivory horse'] })
		],
		values: [
			{
				id: 'carver',
				revision: 1,
				category: 'author',
				wikidataId: null,
				birthYear: null,
				deathYear: null,
				yearsApproximate: false,
				countryCode: null,
				placeType: null,
				name: 'Unknown Carver',
				alternativeNames: [],
				summary: null,
				description: null,
				country: null
			}
		],
		terms: [],
		events: [],
		...extra
	};
}
