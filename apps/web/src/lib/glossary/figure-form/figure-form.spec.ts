import { describe, expect, it } from 'vitest';
import {
	emptyFigureDraft,
	figureDetailsOf,
	figureDraftChanged,
	figureDraftOf
} from './figure-form.ts';

describe('figure form', () => {
	it('starts empty', () => {
		expect(figureDetailsOf(emptyFigureDraft())).toEqual({
			birthYear: null,
			deathYear: null,
			yearsApproximate: false,
			country: null,
			image: null
		});
	});

	it('turns stored details into a draft and back', () => {
		const details = {
			birthYear: -490,
			deathYear: -430,
			yearsApproximate: true,
			country: 'Grecja',
			image: null
		};
		const draft = figureDraftOf(details);

		expect(draft).toMatchObject({
			birthYear: '490',
			birthBeforeCommonEra: true,
			deathYear: '430',
			country: 'Grecja'
		});
		expect(figureDetailsOf(draft)).toEqual(details);
	});

	it('drops the approximate mark when there are no years', () => {
		const draft = { ...emptyFigureDraft(), yearsApproximate: true, country: '  ' };

		expect(figureDetailsOf(draft)).toMatchObject({ yearsApproximate: false, country: null });
	});

	it('notices a changed country', () => {
		const reference = emptyFigureDraft();

		expect(figureDraftChanged({ ...reference, country: 'Włochy' }, reference)).toBe(true);
		expect(figureDraftChanged({ ...reference, country: ' ' }, reference)).toBe(false);
	});
});
