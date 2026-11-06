import { describe, expect, it } from 'vitest';
import { DEFAULT_ERA_JUNCTIONS } from '#lib/catalogue/era-bounds/era-bounds.svelte.ts';
import { m } from '#lib/i18n/i18n.ts';
import {
	eraBoundsForm,
	eraHasEnd,
	eraHasStart,
	junctionsOf,
	newlyOutside,
	neighbourNotes,
	validateEraBounds
} from './era-bounds-form.ts';

describe('eraBoundsForm', () => {
	it('fills the start and end of an era from the junctions', () => {
		expect(eraBoundsForm('antiquity', DEFAULT_ERA_JUNCTIONS)).toEqual({
			startYear: '3000',
			startBeforeCommonEra: true,
			endYear: '476',
			endBeforeCommonEra: false
		});
	});

	it('leaves out the start of prehistory and the end of the present', () => {
		expect(eraHasStart('prehistory')).toBe(false);
		expect(eraHasEnd('contemporary')).toBe(false);
		expect(eraBoundsForm('contemporary', DEFAULT_ERA_JUNCTIONS).endYear).toBe('');
	});
});

describe('junctionsOf', () => {
	it('moves the junctions shared with the neighbouring eras', () => {
		const form = { ...eraBoundsForm('early_modern', DEFAULT_ERA_JUNCTIONS), startYear: '1400' };

		expect(junctionsOf('early_modern', form, DEFAULT_ERA_JUNCTIONS)).toEqual([
			-3000, 476, 1400, 1789, 1945
		]);
	});

	it('gives nothing back for a year that is not a number', () => {
		const form = { ...eraBoundsForm('modern', DEFAULT_ERA_JUNCTIONS), endYear: 'abc' };

		expect(junctionsOf('modern', form, DEFAULT_ERA_JUNCTIONS)).toBeUndefined();
	});
});

describe('validateEraBounds', () => {
	it('accepts the default bounds', () => {
		expect(
			validateEraBounds(
				'modern',
				eraBoundsForm('modern', DEFAULT_ERA_JUNCTIONS),
				DEFAULT_ERA_JUNCTIONS
			)
		).toEqual({});
	});

	it('keeps a bound between the neighbouring junctions', () => {
		const form = {
			...eraBoundsForm('early_modern', DEFAULT_ERA_JUNCTIONS),
			startYear: '400',
			endYear: '1950'
		};

		expect(validateEraBounds('early_modern', form, DEFAULT_ERA_JUNCTIONS)).toEqual({
			start: m.eraBounds.after(m.atelier.year(476, false)),
			end: m.eraBounds.before(m.atelier.year(1945, false))
		});
	});

	it('keeps the start of the present no later than the latest end of the modern era', () => {
		const form = { ...eraBoundsForm('contemporary', DEFAULT_ERA_JUNCTIONS), startYear: '9999' };

		expect(validateEraBounds('contemporary', form, DEFAULT_ERA_JUNCTIONS).start).toBe(
			m.eraBounds.before(m.atelier.year(3001, false))
		);
		expect(
			validateEraBounds('contemporary', { ...form, startYear: '3000' }, DEFAULT_ERA_JUNCTIONS).start
		).toBeUndefined();
	});

	it('asks for the end to come after the start and for both years', () => {
		const late = { ...eraBoundsForm('early_modern', DEFAULT_ERA_JUNCTIONS), endYear: '1400' };
		const empty = { ...eraBoundsForm('early_modern', DEFAULT_ERA_JUNCTIONS), startYear: '' };

		expect(validateEraBounds('early_modern', late, DEFAULT_ERA_JUNCTIONS).end).toBe(
			m.eraBounds.afterStart
		);
		expect(validateEraBounds('early_modern', empty, DEFAULT_ERA_JUNCTIONS).start).toBe(
			m.eraBounds.yearRequired
		);
	});
});

describe('neighbourNotes', () => {
	it('says which neighbouring era moves with a changed bound', () => {
		const next = [-3000, 476, 1560, 1789, 1945];

		expect(neighbourNotes('early_modern', DEFAULT_ERA_JUNCTIONS, next)).toEqual([
			m.eraBounds.previousMoves(m.eras.middle_ages.name, m.atelier.year(1560, false))
		]);
		expect(neighbourNotes('early_modern', DEFAULT_ERA_JUNCTIONS, DEFAULT_ERA_JUNCTIONS)).toEqual(
			[]
		);
		expect(neighbourNotes('early_modern', DEFAULT_ERA_JUNCTIONS, undefined)).toEqual([]);
	});
});

describe('newlyOutside', () => {
	it('counts only the artworks the change pushes outside their era, in any era', () => {
		const moved = [-3000, 476, 1520, 1789, 1945];
		const artworks = [
			{ eraCode: 'early_modern' as const, yearFrom: null, yearTo: 1503 },
			{ eraCode: 'early_modern' as const, yearFrom: null, yearTo: 1450 },
			{ eraCode: 'middle_ages' as const, yearFrom: null, yearTo: 1510 },
			{ eraCode: 'early_modern' as const, yearFrom: null, yearTo: 1600 },
			{ eraCode: 'middle_ages' as const, yearFrom: null, yearTo: 1485 }
		];

		expect(newlyOutside(artworks, DEFAULT_ERA_JUNCTIONS, moved)).toBe(1);
		expect(newlyOutside(artworks, DEFAULT_ERA_JUNCTIONS, [-3000, 476, 1480, 1789, 1945])).toBe(1);
	});
});
