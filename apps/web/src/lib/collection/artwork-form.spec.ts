import { describe, expect, it } from 'vitest';
import {
	artworkFormFromRecord,
	artworkImageAlt,
	artworkInputFromForm,
	canSearchImage,
	emptyArtworkForm,
	formHasChanges,
	imageFromCandidate,
	parseYear
} from './artwork-form.ts';
import type { ArtworkRecord } from './types.ts';

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
		form.yearTo = '1665';
		form.yearApproximate = true;
		form.typeCode = 'painting';
		form.notes = 'Seen in The Hague.';

		expect(artworkInputFromForm(form)).toEqual({
			title: 'Girl with a Pearl Earring',
			authors: ['Johannes Vermeer'],
			authorUnknown: false,
			yearFrom: null,
			fromBeforeCommonEra: false,
			yearTo: 1665,
			toBeforeCommonEra: false,
			yearApproximate: true,
			typeCode: 'painting',
			eraCode: null,
			period: null,
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

	it('leaves the location and the type empty when none is chosen', () => {
		const input = artworkInputFromForm(emptyArtworkForm());

		expect(input.location).toBeNull();
		expect(input.typeCode).toBeNull();
	});
});

describe('artworkFormFromRecord', () => {
	const record: ArtworkRecord = {
		id: 'artwork-1',
		number: 7,
		favourite: false,
		title: 'The Thinker',
		authors: ['Auguste Rodin'],
		authorUnknown: false,
		yearFrom: null,
		fromBeforeCommonEra: false,
		yearTo: 1904,
		toBeforeCommonEra: false,
		yearApproximate: true,
		typeCode: 'sculpture',
		eraCode: 'modern',
		period: '19th century',
		styles: ['Impressionism', 'Symbolism'],
		materials: ['Bronze'],
		location: 'Musée Rodin',
		notes: 'Seen in Paris.',
		image: { kind: 'upload', path: 'user-id/thinker.jpg', width: 3, height: 4 }
	};

	it('fills every field from the saved artwork with empty queries', () => {
		expect(artworkFormFromRecord(record)).toEqual({
			title: 'The Thinker',
			values: {
				author: ['Auguste Rodin'],
				period: ['19th century'],
				style: ['Impressionism', 'Symbolism'],
				material: ['Bronze'],
				location: ['Musée Rodin']
			},
			queries: { author: '', period: '', style: '', material: '', location: '' },
			authorUnknown: false,
			spanMode: false,
			yearFrom: '',
			fromBeforeCommonEra: false,
			yearTo: '1904',
			toBeforeCommonEra: false,
			yearApproximate: true,
			typeCode: 'sculpture',
			eraCode: 'modern',
			notes: 'Seen in Paris.',
			image: { kind: 'upload', path: 'user-id/thinker.jpg', width: 3, height: 4 }
		});
	});

	it('leaves the year, type and location empty when the artwork has none', () => {
		const form = artworkFormFromRecord({
			...record,
			yearTo: null,
			typeCode: null,
			location: null,
			authors: [],
			authorUnknown: true
		});

		expect(form.yearTo).toBe('');
		expect(form.typeCode).toBe('');
		expect(form.values.location).toEqual([]);
		expect(form.authorUnknown).toBe(true);
	});

	it('gives back the same artwork input when nothing changes', () => {
		const input = artworkInputFromForm(artworkFormFromRecord(record));

		expect({ ...record, ...input }).toEqual(record);
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

describe('artworkImageAlt', () => {
	it('names the image by title and authors', () => {
		const form = emptyArtworkForm();
		form.title = ' The Milkmaid ';
		form.values.author = ['Johannes Vermeer', 'Test Painter'];

		expect(artworkImageAlt(form)).toBe('The Milkmaid, Johannes Vermeer, Test Painter');
	});

	it('leaves out what is not filled in yet', () => {
		const form = emptyArtworkForm();
		expect(artworkImageAlt(form)).toBe('');

		form.title = 'The Milkmaid';
		form.authorUnknown = true;
		form.values.author = ['Leftover Author'];
		expect(artworkImageAlt(form)).toBe('The Milkmaid');
	});
});

describe('imageFromCandidate', () => {
	const image = {
		file: 'The Milkmaid.jpg',
		src: 'https://upload.wikimedia.org/330px-The_Milkmaid.jpg',
		width: 2000,
		height: 2250,
		licence: 'Public domain',
		licenceUrl: null,
		attribution: 'Johannes Vermeer'
	};

	it('stores the Wikidata id, the file, its licence and its size', () => {
		expect(
			imageFromCandidate({ wikidataId: 'Q167605', title: 'The Milkmaid', authors: [], image })
		).toEqual({
			kind: 'commons',
			wikidataId: 'Q167605',
			file: 'The Milkmaid.jpg',
			licence: 'Public domain',
			licenceUrl: null,
			attribution: 'Johannes Vermeer',
			width: 2000,
			height: 2250
		});
	});
});

describe('year span in the form', () => {
	const record: ArtworkRecord = {
		id: 'artwork-1',
		number: 7,
		favourite: false,
		title: 'The Test Painting',
		authors: [],
		authorUnknown: true,
		yearFrom: 50,
		fromBeforeCommonEra: true,
		yearTo: 20,
		toBeforeCommonEra: false,
		yearApproximate: false,
		typeCode: null,
		eraCode: null,
		period: null,
		styles: [],
		materials: [],
		location: null,
		notes: '',
		image: null
	};

	it('opens a record with a year span in the span mode', () => {
		const form = artworkFormFromRecord(record);

		expect(form.spanMode).toBe(true);
		expect(form.yearFrom).toBe('50');
		expect(form.fromBeforeCommonEra).toBe(true);
		expect(form.yearTo).toBe('20');
		expect(artworkFormFromRecord({ ...record, yearFrom: null }).spanMode).toBe(false);
	});

	it('reads the start of the year span only in the span mode', () => {
		const form = artworkFormFromRecord(record);

		expect(artworkInputFromForm(form)).toEqual(
			expect.objectContaining({
				yearFrom: 50,
				fromBeforeCommonEra: true,
				yearTo: 20,
				toBeforeCommonEra: false
			})
		);

		form.spanMode = false;
		expect(artworkInputFromForm(form)).toEqual(
			expect.objectContaining({ yearFrom: null, fromBeforeCommonEra: false, yearTo: 20 })
		);
	});
});
