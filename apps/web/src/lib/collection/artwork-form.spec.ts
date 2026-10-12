import { describe, expect, it } from 'vitest';
import {
	artworkInputFromForm,
	canSearchImage,
	emptyArtworkForm,
	formHasChanges,
	parseYear
} from './artwork-form.ts';

describe('parseYear', () => {
	it('reads an empty field as no year', () => {
		expect(parseYear('  ')).toBeNull();
	});

	it('reads whole numbers', () => {
		expect(parseYear(' 1665 ')).toBe(1665);
	});

	it('marks anything other than digits as not a number', () => {
		expect(parseYear('1665a')).toBeNaN();
		expect(parseYear('-5')).toBeNaN();
		expect(parseYear('16.5')).toBeNaN();
	});
});

describe('artworkInputFromForm', () => {
	it('builds the artwork input from the form fields', () => {
		const form = emptyArtworkForm();
		form.title = 'Girl with a Pearl Earring';
		form.values.author = ['Johannes Vermeer'];
		form.values.style = ['baroque'];
		form.values.location = ['Mauritshuis'];
		form.year = '1665';
		form.yearApproximate = true;
		form.notes = 'Seen in The Hague.';

		expect(artworkInputFromForm(form)).toEqual({
			title: 'Girl with a Pearl Earring',
			authors: ['Johannes Vermeer'],
			authorUnknown: false,
			year: 1665,
			beforeCommonEra: false,
			yearApproximate: true,
			typeCode: null,
			periods: [],
			styles: ['baroque'],
			materials: [],
			location: 'Mauritshuis',
			notes: 'Seen in The Hague.',
			image: null
		});
	});

	it('drops the authors when the author is unknown', () => {
		const form = emptyArtworkForm();
		form.values.author = ['Johannes Vermeer'];
		form.authorUnknown = true;

		expect(artworkInputFromForm(form).authors).toEqual([]);
	});

	it('leaves the location empty when none is chosen', () => {
		expect(artworkInputFromForm(emptyArtworkForm()).location).toBeNull();
	});
});

describe('formHasChanges', () => {
	it('sees no change in an untouched form', () => {
		expect(formHasChanges(emptyArtworkForm(), emptyArtworkForm())).toBe(false);
	});

	it('counts text typed in a value field that was not picked yet', () => {
		const form = emptyArtworkForm();
		form.queries.style = 'baro';

		expect(formHasChanges(form, emptyArtworkForm())).toBe(true);
	});
});

describe('canSearchImage', () => {
	it('needs a title and an author', () => {
		const form = emptyArtworkForm();
		form.title = 'Night Watch';
		expect(canSearchImage(form)).toBe(false);

		form.values.author = ['Rembrandt'];
		expect(canSearchImage(form)).toBe(true);
	});

	it('accepts an unknown author instead of a name', () => {
		const form = emptyArtworkForm();
		form.title = 'Venus of Willendorf';
		form.authorUnknown = true;

		expect(canSearchImage(form)).toBe(true);
	});

	it('ignores a title made of spaces', () => {
		const form = emptyArtworkForm();
		form.title = '   ';
		form.authorUnknown = true;

		expect(canSearchImage(form)).toBe(false);
	});
});
