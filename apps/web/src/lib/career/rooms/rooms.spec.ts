import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Exhibit } from '#lib/career/types/exhibit.ts';
import type { UnlockedTier } from '#lib/career/types/unlocked-tier.ts';
import {
	hasNewInRoom,
	intoRooms,
	isFinished,
	isLocked,
	isShown,
	rememberFilters,
	rememberFolded,
	rememberedFilters,
	rememberedFolded,
	squareOf
} from './rooms.ts';

function exhibit(overrides: Partial<Exhibit> = {}): Exhibit {
	return {
		code: 'collection',
		room: 'main_hall',
		hidden: false,
		value: 12,
		thresholds: [1, 10, 50],
		tiers: [],
		...overrides
	};
}

const unlocked = (tier: number, seen = true): UnlockedTier => ({
	exhibit: 'collection',
	tier,
	unlockedAt: new Date('2026-10-01T10:00:00Z'),
	seenAt: seen ? new Date('2026-10-02T10:00:00Z') : undefined
});

function memoryStorage(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> {
	const items = new Map<string, string>();
	return {
		getItem: (key) => items.get(key) ?? null,
		setItem: (key, value) => void items.set(key, value),
		removeItem: (key) => void items.delete(key)
	};
}

describe('rooms', () => {
	beforeEach(() => {
		vi.stubGlobal('localStorage', memoryStorage());
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('groups the exhibits into rooms in the order they come', () => {
		const rooms = intoRooms([
			exhibit({ code: 'collection' }),
			exhibit({ code: 'own_eye' }),
			exhibit({ code: 'eras', room: 'era_enfilade' })
		]);
		expect(rooms.map((room) => [room.code, room.exhibits.map((one) => one.code)])).toEqual([
			['main_hall', ['collection', 'own_eye']],
			['era_enfilade', ['eras']]
		]);
	});

	it('tells finished and locked exhibits, a found hidden one finished', () => {
		expect(isFinished(exhibit({ value: 50 }))).toBe(true);
		expect(isFinished(exhibit({ value: 12 }))).toBe(false);
		expect(isLocked(exhibit({ value: 0 }))).toBe(true);
		expect(isLocked(exhibit({ value: 0, tiers: [unlocked(1)] }))).toBe(false);
		expect(isFinished(exhibit({ hidden: true, value: 1, thresholds: [1] }))).toBe(true);
		expect(isLocked(exhibit({ hidden: true, value: 0, thresholds: [1] }))).toBe(true);
	});

	it('hides finished or locked exhibits by the switches', () => {
		const finished = exhibit({ value: 50 });
		const locked = exhibit({ value: 0 });
		const started = exhibit({ value: 12 });
		const off = { finished: false, locked: false };
		expect([finished, locked, started].map((one) => isShown(one, off))).toEqual([
			false,
			false,
			true
		]);
		expect(isShown(finished, { finished: true, locked: false })).toBe(true);
		expect(isShown(locked, { finished: false, locked: true })).toBe(true);
	});

	it('colours a square by the metal, empty for a hidden exhibit not found', () => {
		expect(squareOf(exhibit({ value: 0 }))).toBe('none');
		expect(squareOf(exhibit({ value: 12 }))).toBe('silver');
		expect(squareOf(exhibit({ value: 50 }))).toBe('platinum');
		expect(squareOf(exhibit({ hidden: true, value: 0, thresholds: [1] }))).toBe('none');
	});

	it('tells a room with a tier not seen yet', () => {
		expect(hasNewInRoom({ code: 'main_hall', exhibits: [exhibit({ tiers: [unlocked(1)] })] })).toBe(
			false
		);
		expect(
			hasNewInRoom({ code: 'main_hall', exhibits: [exhibit({ tiers: [unlocked(1, false)] })] })
		).toBe(true);
	});

	it('remembers the folded rooms and the switches, all open and on at first', () => {
		expect(rememberedFolded()).toEqual([]);
		expect(rememberedFilters()).toEqual({ finished: true, locked: true });
		rememberFolded(['crypt']);
		rememberFilters({ finished: false, locked: true });
		expect(rememberedFolded()).toEqual(['crypt']);
		expect(rememberedFilters()).toEqual({ finished: false, locked: true });
	});

	it('ignores what it cannot read from the storage', () => {
		localStorage.setItem('study-atelier:display-case-rooms', '{"crypt": true}');
		localStorage.setItem('study-atelier:display-case-filters', 'not json');
		expect(rememberedFolded()).toEqual([]);
		expect(rememberedFilters()).toEqual({ finished: true, locked: true });
	});
});
