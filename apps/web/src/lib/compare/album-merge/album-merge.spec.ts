import { describe, expect, it } from 'vitest';
import type { ArtworkImageInput } from '#lib/catalogue/types/artwork-image-input.ts';
import type { ComparedSide } from '#lib/compare/types/compared-side.ts';
import type { MergeChanges } from '#lib/compare/types/merge-changes.ts';
import { emptyArtworkInput } from '#lib/testing/artwork-input/artwork-input.ts';
import { changeCount, initialChanges, mergedArtwork, pickable } from './album-merge.ts';

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

function changes(overrides: Partial<MergeChanges>): MergeChanges {
	return { fields: [], added: [], dropped: [], images: [], droppedImages: [], ...overrides };
}

describe('pickable', () => {
	it('offers an album value that differs from the own one', () => {
		expect(pickable('period', side({}), side({ period: 'kultura grawecka' }))).toBe(true);
		expect(pickable('location', side({ location: 'Wiedeń' }), side({ location: 'NHM' }))).toBe(
			true
		);
		expect(
			pickable('materials', side({ materials: ['wapień'] }), side({ materials: ['ochra'] }))
		).toBe(true);
	});

	it('offers nothing when the values agree or the album has none', () => {
		expect(pickable('title', side({}), side({ title: 'wenus z willendorfu' }))).toBe(false);
		expect(pickable('period', side({ period: 'X' }), side({}))).toBe(false);
		expect(pickable('styles', side({ styles: ['A', 'B'] }), side({ styles: ['b'] }))).toBe(false);
	});

	it('offers a description that the note does not hold yet', () => {
		expect(pickable('notes', side({ notes: 'Moje.' }), side({ notes: 'Opis.' }))).toBe(true);
		expect(pickable('notes', side({ notes: 'Moje.\n\nOpis.' }), side({ notes: 'Opis.' }))).toBe(
			false
		);
	});
});

describe('initialChanges', () => {
	it('picks the album only where the own field is empty', () => {
		const mine = side({ location: 'Wiedeń', materials: ['wapień'], image: ownImage('a') });
		const album = side({
			location: 'NHM',
			period: 'kultura grawecka',
			authors: ['Mistrz'],
			materials: ['ochra'],
			notes: 'Opis.',
			image: albumImage('front')
		});

		expect(initialChanges(mine, album)).toEqual(
			changes({ fields: ['period', 'notes'], added: ['authors/Mistrz'] })
		);
	});

	it('picks the album images for an artwork without images', () => {
		expect(
			initialChanges(side({}), side({ image: albumImage('front'), images: [albumImage('back')] }))
				.images
		).toEqual(['venus/images/front.webp', 'venus/images/back.webp']);
	});
});

describe('mergedArtwork', () => {
	const mine = side({
		authors: ['Uczeń'],
		materials: ['wapień'],
		location: 'Wiedeń',
		notes: 'Moja notatka.',
		image: ownImage('a'),
		images: [ownImage('b')]
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
		expect(mergedArtwork(mine, album, changes({}))).toEqual(mine);
	});

	it('takes the picked values and keeps exactly the ticked items', () => {
		const merged = mergedArtwork(
			mine,
			album,
			changes({
				fields: ['date', 'location', 'notes'],
				added: ['authors/Mistrz', 'materials/ochra'],
				dropped: ['authors/Uczeń']
			})
		);

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

	it('marks the author unknown when every author is unticked', () => {
		expect(mergedArtwork(mine, album, changes({ dropped: ['authors/Uczeń'] }))).toMatchObject({
			authors: [],
			authorUnknown: true
		});
	});

	it('drops the unticked own images and adds the ticked album images after the rest', () => {
		const merged = mergedArtwork(
			mine,
			album,
			changes({ images: ['venus/images/back.webp'], droppedImages: ['a'] })
		);

		expect(merged.image).toEqual(ownImage('b'));
		expect(merged.images).toEqual([albumImage('back')]);
	});
});

describe('changeCount', () => {
	it('counts every picked value, item and image', () => {
		expect(
			changeCount(
				changes({
					fields: ['title', 'notes'],
					added: ['styles/barok'],
					dropped: ['authors/X'],
					images: ['x'],
					droppedImages: ['a']
				})
			)
		).toBe(6);
	});
});
