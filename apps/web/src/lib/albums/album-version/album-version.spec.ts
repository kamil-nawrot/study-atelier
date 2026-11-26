import { describe, expect, it } from 'vitest';
import type { Album } from '#lib/albums/types/album.ts';
import type { AlbumValue } from '#lib/albums/types/album-value.ts';
import { albumVersion, newValueMarks } from './album-version.ts';

function value(id: string, category: AlbumValue['category'], name: string): AlbumValue {
	return {
		id,
		revision: 1,
		category,
		wikidataId: null,
		birthYear: null,
		deathYear: null,
		yearsApproximate: false,
		countryCode: null,
		placeType: null,
		name,
		alternativeNames: [],
		summary: null,
		description: null,
		country: null
	};
}

const album: Album = {
	slug: 'venus',
	language: 'pl',
	eraCode: 'prehistory',
	title: 'Wenus paleolityczne',
	description: 'Album.',
	values: [
		value('gravettian', 'period', 'kultura grawecka'),
		value('limestone', 'material', 'wapień oolitowy'),
		value('ivory', 'material', 'kość słoniowa'),
		value('museum', 'location', 'Naturhistorisches Museum')
	],
	terms: [],
	events: [],
	artworks: [
		{
			id: 'willendorf',
			revision: 3,
			wikidataId: 'Q131397',
			typeCode: 'sculpture',
			eraCode: 'prehistory',
			yearFrom: -29500,
			yearTo: -25000,
			yearApproximate: true,
			valueIds: ['gravettian', 'limestone', 'museum'],
			termIds: [],
			eventIds: [],
			images: [
				{
					path: 'venus/images/willendorf.webp',
					width: 600,
					height: 800,
					licence: 'CC BY-SA 4.0',
					licenceUrl: null,
					attribution: 'Photo'
				}
			],
			title: 'Wenus z Willendorfu',
			alternativeTitles: [],
			description: 'Figurka z wapienia.'
		}
	]
};

describe('albumVersion', () => {
	it('turns an album artwork into an artwork with the learner names of matched values', () => {
		const version = albumVersion(album, album.artworks[0], [
			{ category: 'period', name: 'Kultura grawecka', wikidataId: null }
		]);

		expect(version).toMatchObject({
			slug: 'venus',
			entryId: 'willendorf',
			albumTitle: 'Wenus paleolityczne',
			revision: 3,
			wikidataId: 'Q131397',
			newValues: ['material:wapień oolitowy', 'location:Naturhistorisches Museum']
		});
		expect(version.artwork).toMatchObject({
			title: 'Wenus z Willendorfu',
			authors: [],
			authorUnknown: true,
			yearFrom: 29500,
			fromBeforeCommonEra: true,
			yearTo: 25000,
			toBeforeCommonEra: true,
			yearApproximate: true,
			typeCode: 'sculpture',
			period: 'Kultura grawecka',
			materials: ['wapień oolitowy'],
			location: 'Naturhistorisches Museum',
			notes: 'Figurka z wapienia.',
			images: []
		});
		expect(version.artwork.image).toEqual({
			kind: 'album',
			path: 'venus/images/willendorf.webp',
			wikidataId: 'Q131397',
			licence: 'CC BY-SA 4.0',
			licenceUrl: null,
			attribution: 'Photo',
			width: 600,
			height: 800
		});
	});
});

describe('newValueMarks', () => {
	it('sorts the new values of a version into their categories', () => {
		const marks = newValueMarks([
			'material:wapień oolitowy',
			'location:Muzeum: Wiedeń',
			'author:Ktoś'
		]);

		expect(marks).toEqual({
			author: ['Ktoś'],
			period: [],
			style: [],
			material: ['wapień oolitowy'],
			location: ['Muzeum: Wiedeń']
		});
	});

	it('marks nothing when no value is new', () => {
		expect(newValueMarks([]).material).toEqual([]);
	});
});
