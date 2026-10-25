import { describe, expect, it } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { testCardIndex } from '#lib/testing/card-index/card-index.ts';
import {
	artworksOfValue,
	findSubject,
	isValueKind,
	subjectName,
	valueEditPath,
	valueParents,
	valuePath
} from './value-pages.ts';

describe('isValueKind', () => {
	it('accepts the six kinds of values and nothing else', () => {
		for (const kind of ['era', 'period', 'style', 'material', 'author', 'location']) {
			expect(isValueKind(kind)).toBe(true);
		}
		expect(isValueKind('type')).toBe(false);
	});
});

describe('value paths', () => {
	it('builds the page and form paths of a value', () => {
		expect(valuePath('style', 'style-doric')).toBe('/atelier/values/style/style-doric');
		expect(valueEditPath('era', 'antiquity')).toBe('/atelier/values/era/antiquity/edit');
	});
});

describe('findSubject', () => {
	it('finds a category value of the given kind', () => {
		const subject = findSubject(testCardIndex(), 'style', 'style-doric');

		expect(subject?.kind).toBe('style');
		expect(subject && subjectName(subject)).toBe('Doric');
	});

	it('refuses a value of another kind under the given kind', () => {
		expect(findSubject(testCardIndex(), 'period', 'style-doric')).toBeUndefined();
	});

	it('finds an era by its code and names it', () => {
		const subject = findSubject(testCardIndex(), 'era', 'antiquity');

		expect(subject).toEqual({ kind: 'era', code: 'antiquity' });
		expect(subject && subjectName(subject)).toBe(m.eras.antiquity.name);
		expect(findSubject(testCardIndex(), 'era', 'bronze_age')).toBeUndefined();
	});
});

describe('valueParents', () => {
	it('gives the eras of a period and the periods of a style', () => {
		const index = testCardIndex();
		const period = findSubject(index, 'period', 'period-classical');
		const style = findSubject(index, 'style', 'style-ionic');

		expect(period && valueParents(index, period).map((parent) => parent.id)).toEqual([
			'antiquity',
			'early_modern'
		]);
		expect(style && valueParents(index, style).map((parent) => parent.name)).toEqual([
			'Classical',
			'Gothic'
		]);
	});

	it('gives no parent to other kinds', () => {
		const index = testCardIndex();
		const author = findSubject(index, 'author', 'author-phidias');

		expect(author && valueParents(index, author)).toEqual([]);
	});
});

describe('artworksOfValue', () => {
	const artworks = [
		testArtwork(1, 'Late', { yearTo: 1600, authors: ['Phidias'], eraCode: 'antiquity' }),
		testArtwork(2, 'Undated', { yearTo: null, authors: ['Phidias'] }),
		testArtwork(3, 'Early', { yearTo: -440, authors: ['Phidias'], eraCode: 'antiquity' }),
		testArtwork(4, 'Other', { yearTo: -500, authors: ['Myron'], location: 'Athens' })
	];

	it('picks the artworks of an author in chronological order, undated last', () => {
		const author = findSubject(testCardIndex(), 'author', 'author-phidias');

		expect(author && artworksOfValue(artworks, author).map((artwork) => artwork.title)).toEqual([
			'Early',
			'Late',
			'Undated'
		]);
	});

	it('picks the artworks of an era by its code', () => {
		expect(
			artworksOfValue(artworks, { kind: 'era', code: 'antiquity' }).map((artwork) => artwork.number)
		).toEqual([3, 1]);
	});

	it('picks the artworks of a location by its name', () => {
		const location = findSubject(testCardIndex(), 'location', 'location-athens');

		expect(
			location && artworksOfValue(artworks, location).map((artwork) => artwork.number)
		).toEqual([4]);
	});
});
