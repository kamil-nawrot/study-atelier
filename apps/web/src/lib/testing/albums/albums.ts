import type { Album } from '#lib/albums/types/album.ts';
import type { AlbumArtwork } from '#lib/albums/types/album-artwork.ts';
import type { AlbumEvent } from '#lib/albums/types/album-event.ts';
import type { AlbumTerm } from '#lib/albums/types/album-term.ts';
import type { AlbumValue } from '#lib/albums/types/album-value.ts';

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

export function albumTerm(id: string, extra: Partial<AlbumTerm> = {}): AlbumTerm {
	return {
		id,
		revision: 1,
		kind: 'term',
		category: 'technique',
		wikidataId: null,
		birthYear: null,
		deathYear: null,
		yearsApproximate: false,
		name: id,
		alternativeNames: [],
		definition: `${id} definition.`,
		country: null,
		source: { title: id, url: `https://pl.wikipedia.org/wiki/${id}`, licence: 'CC BY-SA 4.0' },
		...extra
	};
}

export function albumEvent(id: string, extra: Partial<AlbumEvent> = {}): AlbumEvent {
	return {
		id,
		revision: 1,
		yearFrom: null,
		yearTo: -25000,
		yearApproximate: true,
		name: id,
		description: `${id} description.`,
		source: null,
		...extra
	};
}

export function albumValue(id: string, extra: Partial<AlbumValue> = {}): AlbumValue {
	return {
		id,
		revision: 1,
		category: 'author',
		wikidataId: null,
		birthYear: null,
		deathYear: null,
		yearsApproximate: false,
		countryCode: null,
		placeType: null,
		name: id,
		alternativeNames: [],
		summary: `${id} summary.`,
		description: null,
		country: null,
		...extra
	};
}

export function albumWithItems(): Album {
	const base = testAlbum();
	return {
		...base,
		artworks: [
			albumArtwork('venus', {
				title: 'Venus of Willendorf',
				termIds: ['carving'],
				eventIds: ['discovery'],
				valueIds: ['carver']
			}),
			albumArtwork('lion', { title: 'Lion Man', termIds: ['sculptor'] })
		],
		terms: [
			albumTerm('carving', { name: 'Carving' }),
			albumTerm('sculptor', {
				name: 'Sculptor',
				kind: 'figure',
				category: 'artist',
				birthYear: -500,
				deathYear: -430
			}),
			albumTerm('unrelated', { name: 'Unrelated' })
		],
		events: [albumEvent('discovery', { name: 'Discovery' })],
		values: [
			albumValue('carver', { name: 'Unknown Carver', description: 'A carver of figures.' }),
			albumValue('cave', { category: 'location', name: 'Cave', countryCode: 'DE' }),
			albumValue('bare', { category: 'material', name: 'Ivory' })
		]
	};
}
