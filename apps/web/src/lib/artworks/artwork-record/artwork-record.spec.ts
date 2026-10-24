import { describe, expect, it } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';
import { emptyArtworkInput, validateArtwork } from './artwork-record.ts';
import type { ArtworkInput } from '#lib/artworks/types/artwork-input.ts';

function input(overrides: Partial<ArtworkInput> = {}): ArtworkInput {
	return {
		...emptyArtworkInput(),
		title: 'The Test Painting',
		authors: ['Test Painter'],
		...overrides
	};
}

describe('validateArtwork', () => {
	it('accepts a title with an author', () => {
		expect(validateArtwork(input())).toEqual({});
	});

	it('asks for a title that is more than spaces', () => {
		expect(validateArtwork(input({ title: '   ' }))).toEqual({
			title: m.artworkErrors.titleRequired
		});
	});

	it('asks for an author unless the author is unknown', () => {
		expect(validateArtwork(input({ authors: [' '] }))).toEqual({
			authors: m.artworkErrors.authorRequired
		});
		expect(validateArtwork(input({ authors: [], authorUnknown: true }))).toEqual({});
	});

	it('asks for a year when it is marked as before the common era or approximate', () => {
		expect(validateArtwork(input({ toBeforeCommonEra: true }))).toEqual({
			yearTo: m.artworkErrors.yearRequired
		});
		expect(validateArtwork(input({ yearApproximate: true }))).toEqual({
			yearTo: m.artworkErrors.yearRequired
		});
	});

	it('accepts a year span inside one era and across the turn of the eras', () => {
		expect(validateArtwork(input({ yearFrom: 1503, yearTo: 1519 }))).toEqual({});
		expect(
			validateArtwork(
				input({ yearFrom: 450, fromBeforeCommonEra: true, yearTo: 420, toBeforeCommonEra: true })
			)
		).toEqual({});
		expect(validateArtwork(input({ yearFrom: 50, fromBeforeCommonEra: true, yearTo: 20 }))).toEqual(
			{}
		);
	});

	it('rejects a year span whose end is earlier than its start', () => {
		const order = { yearTo: m.artworkErrors.spanOrder };
		expect(validateArtwork(input({ yearFrom: 1519, yearTo: 1503 }))).toEqual(order);
		expect(validateArtwork(input({ yearFrom: 20, yearTo: 50, toBeforeCommonEra: true }))).toEqual(
			order
		);
		expect(
			validateArtwork(
				input({ yearFrom: 420, fromBeforeCommonEra: true, yearTo: 450, toBeforeCommonEra: true })
			)
		).toEqual(order);
	});

	it('asks for the end of a year span and rejects a start that is not a year', () => {
		expect(validateArtwork(input({ yearFrom: 1503 }))).toEqual({
			yearTo: m.artworkErrors.spanEndRequired
		});
		expect(validateArtwork(input({ fromBeforeCommonEra: true, yearTo: 1519 }))).toEqual({
			yearFrom: m.artworkErrors.yearRequired
		});
		expect(validateArtwork(input({ yearFrom: Number.NaN, yearTo: 1519 }))).toEqual({
			yearFrom: m.artworkErrors.yearInvalid
		});
	});

	it('accepts years from 3 000 000 BCE to 2500 and rejects the rest', () => {
		expect(validateArtwork(input({ yearTo: 3_000_000, toBeforeCommonEra: true }))).toEqual({});
		expect(validateArtwork(input({ yearTo: 2500 }))).toEqual({});
		expect(validateArtwork(input({ yearTo: 3_000_001, toBeforeCommonEra: true }))).toEqual({
			yearTo: m.artworkErrors.yearTooEarly
		});
		expect(validateArtwork(input({ yearFrom: 2020, yearTo: 2501 }))).toEqual({
			yearTo: m.artworkErrors.yearTooLate
		});
		expect(validateArtwork(input({ yearFrom: 3_000_000_000, yearTo: 1500 }))).toEqual({
			yearFrom: m.artworkErrors.yearTooLate
		});
	});

	it('rejects a year that is not a whole number from 1', () => {
		for (const year of [0, -5, 1.5]) {
			expect(validateArtwork(input({ yearTo: year }))).toEqual({
				yearTo: m.artworkErrors.yearInvalid
			});
		}
	});
});
