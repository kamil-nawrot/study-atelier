import { describe, expect, it } from 'vitest';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import {
	band,
	boundsOf,
	pageStep,
	placeOf,
	sliderStart,
	stepYear,
	withoutZero,
	yearItems,
	yearOutcome,
	yearsOf
} from './year-guess.ts';

const today = new Date('2026-11-04T12:00:00.000Z');
const earlyModern: [number, number] = [1492, 1789];

function dated(yearFrom: number | null, yearTo: number | null): WallArtwork {
	return { ...testArtwork(1, 'Mona Lisa'), eraCode: 'early_modern', yearFrom, yearTo };
}

describe('yearsOf', () => {
	it('reads a single year or a span of years, and nothing without a year', () => {
		expect(yearsOf(dated(null, 1503))).toEqual([1503, 1503]);
		expect(yearsOf(dated(1503, 1519))).toEqual([1503, 1519]);
		expect(yearsOf(dated(null, null))).toBeNull();
	});
});

describe('boundsOf', () => {
	it('takes the years of the artwork’s era and nothing without an era', () => {
		expect(boundsOf(dated(null, 1503), today)).toEqual(earlyModern);
		expect(boundsOf({ ...dated(null, 1503), eraCode: null }, today)).toBeNull();
	});
});

describe('the slider', () => {
	it('starts in the middle of the era', () => {
		expect(sliderStart(earlyModern)).toBe(1641);
	});

	it('moves a page by a tenth of the era', () => {
		expect(pageStep(earlyModern)).toBe(30);
		expect(stepYear(1641, 30, earlyModern)).toBe(1671);
		expect(stepYear(1780, 30, earlyModern)).toBe(1789);
		expect(stepYear(1500, -30, earlyModern)).toBe(1492);
	});

	it('skips the year 0, which does not exist', () => {
		expect(withoutZero(0, -1)).toBe(1);
		expect(withoutZero(0, 1)).toBe(-1);
		expect(withoutZero(5, 4)).toBe(5);
		expect(stepYear(-1, 1, [-3000, 476])).toBe(1);
		expect(sliderStart([-1, 1])).toBe(1);
	});

	it('places a year along the era', () => {
		expect(placeOf(1492, earlyModern)).toBe(0);
		expect(placeOf(1789, earlyModern)).toBe(1);
		expect(placeOf(1300, earlyModern)).toBe(0);
	});
});

describe('yearOutcome', () => {
	it('knows a guess within 5% of the era, is close within 15% and far beyond', () => {
		expect(yearOutcome(1517, [1503, 1503], earlyModern)).toEqual({
			rating: 3,
			miss: 14,
			direction: 'late'
		});
		expect(yearOutcome(1518, [1503, 1503], earlyModern).rating).toBe(2);
		expect(yearOutcome(1460, [1503, 1503], earlyModern).rating).toBe(2);
		expect(yearOutcome(1503 - 44, [1503, 1503], earlyModern).rating).toBe(2);
		expect(yearOutcome(1503 - 45, [1503, 1503], earlyModern)).toEqual({
			rating: 1,
			miss: 45,
			direction: 'early'
		});
	});

	it('knows any guess inside the span of years', () => {
		expect(yearOutcome(1510, [1503, 1519], earlyModern)).toEqual({
			rating: 3,
			miss: 0,
			direction: 'inside'
		});
	});

	it('counts the years across the turn of the eras without a year 0', () => {
		expect(yearOutcome(-10, [10, 10], [-3000, 476]).miss).toBe(19);
	});
});

describe('band', () => {
	it('reaches 5% and 15% of the era around the real years, inside the era', () => {
		const [knowFrom, knowTo] = band([1503, 1519], earlyModern, 'know');
		const [closeFrom, closeTo] = band([1503, 1519], earlyModern, 'close');
		expect(knowFrom).toBe(1492);
		expect(knowTo).toBeCloseTo(1533.85);
		expect(closeFrom).toBe(1492);
		expect(closeTo).toBeCloseTo(1563.55);
		expect(band([1700, 1780], earlyModern, 'know')[1]).toBe(1789);
	});
});

describe('yearItems', () => {
	it('turns the year rows into questions with their date card and leaves out the rest', () => {
		const artwork = dated(1503, 1519);
		const undated = { ...dated(null, null), id: 'artwork-2' };
		const items = yearItems(
			[
				{ artwork_id: 'artwork-1', mode: 'flashcard' },
				{ mode: 'order', artwork_ids: ['artwork-1'] },
				{ artwork_id: 'artwork-2', mode: 'year', card: null },
				{
					artwork_id: 'artwork-1',
					mode: 'year',
					card: {
						due: '2026-11-04T08:00:00.000Z',
						stability: 3,
						difficulty: 5,
						state: 2,
						reps: 1,
						lapses: 0,
						scheduled_days: 3,
						learning_steps: 0,
						last_review: null
					}
				}
			],
			new Map([
				[artwork.id, artwork],
				[undated.id, undated]
			]),
			today
		);

		expect(items).toEqual([
			{
				mode: 'year',
				artwork,
				card: expect.objectContaining({ artworkId: 'artwork-1', stability: 3, lastReview: null })
			}
		]);
	});
});
