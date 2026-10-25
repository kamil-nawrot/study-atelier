import { describe, expect, it } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';
import {
	authorDetailsFromForm,
	authorFormFromDetails,
	emptyAuthorDetails,
	validateAuthorForm
} from './author-form.ts';

describe('authorFormFromDetails', () => {
	it('splits signed years into the year and its p.n.e. box and ticks the sort name', () => {
		const form = authorFormFromDetails({
			...emptyAuthorDetails(),
			birthYear: -480,
			deathYear: 20,
			sortName: 'Fidiasz'
		});

		expect(form).toMatchObject({
			birthYear: '480',
			birthBeforeCommonEra: true,
			deathYear: '20',
			deathBeforeCommonEra: false,
			sortByOther: true,
			sortName: 'Fidiasz'
		});
	});
});

describe('validateAuthorForm', () => {
	const form = authorFormFromDetails(emptyAuthorDetails());

	it('accepts empty years and either year alone', () => {
		expect(validateAuthorForm(form)).toEqual({});
		expect(validateAuthorForm({ ...form, birthYear: '1760' })).toEqual({});
		expect(validateAuthorForm({ ...form, deathYear: '1519' })).toEqual({});
	});

	it('rejects a year that is not a number', () => {
		expect(validateAuthorForm({ ...form, birthYear: 'około' })).toEqual({
			birthYear: m.artworkErrors.yearInvalid
		});
	});

	it('rejects a year beyond 3 000 000 BCE or after 2500', () => {
		expect(
			validateAuthorForm({ ...form, birthYear: '4000000', birthBeforeCommonEra: true })
		).toEqual({ birthYear: m.artworkErrors.yearTooEarly });
		expect(validateAuthorForm({ ...form, deathYear: '2600' })).toEqual({
			deathYear: m.artworkErrors.yearTooLate
		});
	});

	it('rejects a death before the birth, across the turn of the eras too', () => {
		expect(validateAuthorForm({ ...form, birthYear: '1519', deathYear: '1452' })).toEqual({
			deathYear: m.valueForm.lifeYearsOrder
		});
		expect(
			validateAuthorForm({ ...form, birthYear: '20', deathYear: '10', deathBeforeCommonEra: true })
		).toEqual({ deathYear: m.valueForm.lifeYearsOrder });
		expect(
			validateAuthorForm({ ...form, birthYear: '10', birthBeforeCommonEra: true, deathYear: '20' })
		).toEqual({});
	});
});

describe('authorDetailsFromForm', () => {
	const form = authorFormFromDetails(emptyAuthorDetails());

	it('signs the years and keeps "ok." only with a year', () => {
		expect(
			authorDetailsFromForm({
				...form,
				birthYear: '480',
				birthBeforeCommonEra: true,
				yearsApproximate: true
			})
		).toMatchObject({ birthYear: -480, deathYear: null, yearsApproximate: true });
		expect(authorDetailsFromForm({ ...form, yearsApproximate: true }).yearsApproximate).toBe(false);
	});

	it('clears the sort name when the box is unticked or the field is empty', () => {
		expect(
			authorDetailsFromForm({ ...form, sortByOther: false, sortName: 'Vinci, Leonardo da' })
				.sortName
		).toBeNull();
		expect(
			authorDetailsFromForm({ ...form, sortByOther: true, sortName: '  ' }).sortName
		).toBeNull();
		expect(
			authorDetailsFromForm({ ...form, sortByOther: true, sortName: ' Vinci, Leonardo da ' })
				.sortName
		).toBe('Vinci, Leonardo da');
	});
});
