import { describe, expect, it } from 'vitest';
import type { Exhibit } from '#lib/career/types/exhibit.ts';
import type { UnlockedTier } from '#lib/career/types/unlocked-tier.ts';
import {
	hasNewTier,
	isHidden,
	metalOf,
	nextThreshold,
	reachedTier,
	withTiers
} from './exhibits.ts';

function exhibit(overrides: Partial<Exhibit> = {}): Exhibit {
	return { code: 'collection', value: 24, thresholds: [1, 10, 50, 100], tiers: [], ...overrides };
}

const unlocked = (tier: number, seen = true): UnlockedTier => ({
	exhibit: 'collection',
	tier,
	unlockedAt: new Date('2026-10-01T10:00:00Z'),
	seenAt: seen ? new Date('2026-10-02T10:00:00Z') : undefined
});

describe('exhibits', () => {
	it('joins the counted exhibits with their unlocked tiers', () => {
		expect(
			withTiers(
				[{ exhibit: 'collection', value: 24, thresholds: [1, 10] }],
				[unlocked(1), { ...unlocked(1), exhibit: 'eras' }]
			)
		).toEqual([{ code: 'collection', value: 24, thresholds: [1, 10], tiers: [unlocked(1)] }]);
	});

	it('keeps a tier unlocked after the count fell below it', () => {
		expect(reachedTier(exhibit())).toBe(2);
		expect(reachedTier(exhibit({ value: 4, tiers: [unlocked(1), unlocked(2)] }))).toBe(2);
	});

	it('names the next threshold until the top tier', () => {
		expect(nextThreshold(exhibit())).toBe(50);
		expect(nextThreshold(exhibit({ value: 120 }))).toBeUndefined();
	});

	it('casts the engraving in a nobler metal as the tiers rise, platinum at the top', () => {
		expect([0, 1, 2, 3, 4, 5].map((tier) => metalOf(tier, 5))).toEqual([
			'none',
			'bronze',
			'bronze',
			'silver',
			'gold',
			'platinum'
		]);
		expect([1, 2, 3, 4, 5, 6, 7, 8, 9].map((tier) => metalOf(tier, 9))).toEqual([
			'bronze',
			'bronze',
			'bronze',
			'silver',
			'silver',
			'silver',
			'gold',
			'gold',
			'platinum'
		]);
		expect(metalOf(1, 1)).toBe('platinum');
	});

	it('never counts more tiers than an exhibit has', () => {
		expect(
			reachedTier(exhibit({ thresholds: [1], value: 3, tiers: [unlocked(1), unlocked(2)] }))
		).toBe(1);
	});

	it('hides the easter eggs until they are found', () => {
		expect(isHidden(exhibit({ code: 'night_watch', value: 0, thresholds: [1] }))).toBe(true);
		expect(isHidden(exhibit({ code: 'night_watch', value: 1, thresholds: [1] }))).toBe(false);
		expect(isHidden(exhibit({ code: 'back_from_storage', value: 0, thresholds: [1] }))).toBe(true);
		expect(isHidden(exhibit({ value: 0 }))).toBe(false);
	});

	it('tells an exhibit with a tier not seen yet', () => {
		expect(hasNewTier(exhibit({ tiers: [unlocked(1), unlocked(2, false)] }))).toBe(true);
		expect(hasNewTier(exhibit({ tiers: [unlocked(1)] }))).toBe(false);
	});
});
