import { beforeEach, describe, expect, it } from 'vitest';
import type { ExhibitionSummary } from '#lib/exhibitions/types/exhibition-summary.ts';
import {
	rememberedExhibitionSort,
	rememberExhibitionSort,
	sortExhibitions
} from './exhibition-sort.ts';

function summary(id: string, title: string, artworkCount: number): ExhibitionSummary {
	return { id, title, updatedAt: '2020-03-04T10:00:00Z', artworkCount, coverId: null };
}

const exhibitions = [
	summary('a', 'Światło u Caravaggia', 2),
	summary('b', 'Martwa natura', 5),
	summary('c', 'Akt', 2)
];

const ids = (list: readonly ExhibitionSummary[]): string[] => list.map(({ id }) => id);

describe('sortExhibitions', () => {
	it('keeps the order of the last change', () => {
		expect(sortExhibitions(exhibitions, 'changed')).toBe(exhibitions);
	});

	it('orders by title in Polish', () => {
		expect(ids(sortExhibitions(exhibitions, 'name'))).toEqual(['c', 'b', 'a']);
	});

	it('puts the most artworks first, then by title', () => {
		expect(ids(sortExhibitions(exhibitions, 'count'))).toEqual(['b', 'c', 'a']);
	});
});

describe('rememberedExhibitionSort', () => {
	const stored = new Map<string, string>();

	beforeEach(() => {
		stored.clear();
		globalThis.localStorage = {
			getItem: (key: string) => stored.get(key) ?? null,
			setItem: (key: string, value: string) => void stored.set(key, value),
			removeItem: (key: string) => void stored.delete(key)
		} as Storage;
	});

	it('starts with the last change and keeps the choice on the device', () => {
		expect(rememberedExhibitionSort()).toBe('changed');
		rememberExhibitionSort('count');
		expect(rememberedExhibitionSort()).toBe('count');
	});

	it('ignores an unknown stored order', () => {
		stored.set('study-atelier:exhibition-sort', 'recent');
		expect(rememberedExhibitionSort()).toBe('changed');
	});
});
