import { describe, expect, it } from 'vitest';
import type { ArtworkImageInput } from '#lib/catalogue/types/artwork-image-input.ts';
import type { ComparedSide } from '#lib/compare/types/compared-side.ts';
import { emptyArtworkInput } from '#lib/testing/artwork-input/artwork-input.ts';
import { changeCount, imageAttachable, mergedArtwork, offeredAction } from './album-merge.ts';

function side(overrides: Partial<ComparedSide>): ComparedSide {
	return { ...emptyArtworkInput(), title: 'Wenus z Willendorfu', ...overrides };
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

const NONE = { fields: [], images: [] };

describe('offeredAction', () => {
	it('moves a value into an empty field', () => {
		expect(offeredAction('period', side({}), side({ period: 'kultura grawecka' }))).toBe('move');
		expect(offeredAction('materials', side({}), side({ materials: ['wapień'] }))).toBe('move');
		expect(offeredAction('date', side({}), side({ yearTo: 25000, toBeforeCommonEra: true }))).toBe(
			'move'
		);
	});

	it('adds the missing values to a list', () => {
		expect(
			offeredAction(
				'materials',
				side({ materials: ['wapień'] }),
				side({ materials: ['Wapień', 'ochra'] })
			)
		).toBe('add');
	});

	it('replaces a different single value', () => {
		expect(offeredAction('location', side({ location: 'Wiedeń' }), side({ location: 'NHM' }))).toBe(
			'replace'
		);
		expect(offeredAction('title', side({}), side({ title: 'Venus of Willendorf' }))).toBe(
			'replace'
		);
	});

	it('offers nothing when the values agree or the album has none', () => {
		expect(offeredAction('title', side({}), side({ title: 'wenus z willendorfu' }))).toBeNull();
		expect(offeredAction('period', side({ period: 'X' }), side({}))).toBeNull();
		expect(
			offeredAction('styles', side({ styles: ['A', 'B'] }), side({ styles: ['b'] }))
		).toBeNull();
	});

	it('appends a description that the note does not hold yet', () => {
		expect(offeredAction('notes', side({ notes: 'Moje.' }), side({ notes: 'Opis.' }))).toBe(
			'append'
		);
		expect(
			offeredAction('notes', side({ notes: 'Moje.\n\nOpis.' }), side({ notes: 'Opis.' }))
		).toBeNull();
	});

	it('moves the authors into an artwork of an unknown author', () => {
		expect(
			offeredAction('authors', side({ authorUnknown: true }), side({ authors: ['Mistrz'] }))
		).toBe('move');
	});
});

describe('mergedArtwork', () => {
	const mine = side({
		authorUnknown: true,
		materials: ['wapień'],
		location: 'Wiedeń',
		notes: 'Moja notatka.',
		image: ownImage('a')
	});
	const album = side({
		authors: ['Mistrz'],
		yearFrom: 29500,
		fromBeforeCommonEra: true,
		yearTo: 25000,
		toBeforeCommonEra: true,
		yearApproximate: true,
		materials: ['Wapień', 'ochra'],
		location: 'Naturhistorisches Museum',
		notes: 'Opis z albumu.',
		image: albumImage('front'),
		images: [albumImage('back')]
	});

	it('changes nothing without a change', () => {
		expect(mergedArtwork(mine, album, NONE)).toEqual(mine);
	});

	it('takes only the chosen fields', () => {
		const merged = mergedArtwork(mine, album, {
			fields: ['authors', 'date', 'materials', 'location', 'notes'],
			images: []
		});

		expect(merged).toMatchObject({
			authors: ['Mistrz'],
			authorUnknown: false,
			yearFrom: 29500,
			fromBeforeCommonEra: true,
			yearTo: 25000,
			yearApproximate: true,
			materials: ['wapień', 'ochra'],
			location: 'Naturhistorisches Museum',
			notes: 'Moja notatka.\n\nOpis z albumu.'
		});
	});

	it('adds the chosen album images after the own ones', () => {
		const merged = mergedArtwork(mine, album, { fields: [], images: ['venus/images/back.webp'] });

		expect(merged.image).toEqual(ownImage('a'));
		expect(merged.images).toEqual([albumImage('back')]);
	});

	it('makes the first chosen image the main one of an artwork without images', () => {
		const merged = mergedArtwork(side({}), album, {
			fields: [],
			images: ['venus/images/back.webp']
		});

		expect(merged.image).toEqual(albumImage('back'));
	});
});

describe('imageAttachable', () => {
	it('offers an image within the limit of five', () => {
		const four = side({ image: ownImage('a'), images: ['b', 'c', 'd'].map(ownImage) });
		const five = side({ image: ownImage('a'), images: ['b', 'c', 'd', 'e'].map(ownImage) });

		expect(imageAttachable(four, NONE, 'venus/images/front.webp')).toBe(true);
		expect(imageAttachable(five, NONE, 'venus/images/front.webp')).toBe(false);
		expect(
			imageAttachable(
				four,
				{ fields: [], images: ['venus/images/back.webp'] },
				'venus/images/front.webp'
			)
		).toBe(false);
		expect(
			imageAttachable(
				four,
				{ fields: [], images: ['venus/images/back.webp'] },
				'venus/images/back.webp'
			)
		).toBe(true);
	});

	it('does not offer an image the artwork already has', () => {
		expect(
			imageAttachable(side({ image: albumImage('front') }), NONE, 'venus/images/front.webp')
		).toBe(false);
	});
});

describe('changeCount', () => {
	it('counts the fields and the images', () => {
		expect(changeCount({ fields: ['title', 'notes'], images: ['x'] })).toBe(3);
	});
});
