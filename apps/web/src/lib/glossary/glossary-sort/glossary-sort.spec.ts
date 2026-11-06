import { beforeEach, describe, expect, it } from 'vitest';
import { testEntry } from '#lib/testing/glossary/glossary.ts';
import { newestFirst, rememberedGlossarySort, rememberGlossarySort } from './glossary-sort.ts';

describe('glossary sort', () => {
	const stored = new Map<string, string>();

	beforeEach(() => {
		stored.clear();
		globalThis.localStorage = {
			getItem: (key: string) => stored.get(key) ?? null,
			setItem: (key: string, value: string) => void stored.set(key, value),
			removeItem: (key: string) => void stored.delete(key)
		} as Storage;
	});

	it('sorts by name until the learner picks another order', () => {
		expect(rememberedGlossarySort()).toBe('name');
		rememberGlossarySort('recent');
		expect(rememberedGlossarySort()).toBe('recent');
	});

	it('ignores an unknown stored order', () => {
		stored.set('study-atelier:glossary-sort', 'count');
		expect(rememberedGlossarySort()).toBe('name');
	});

	it('puts the newest entries first and orders entries added together by name', () => {
		const entries = [
			testEntry('old', 'Apse', { createdAt: '2026-10-01T10:00:00Z' }),
			testEntry('new', 'Nave', { createdAt: '2026-11-05T10:00:00Z' }),
			testEntry('same-b', 'Crypt', { createdAt: '2026-10-20T10:00:00Z' }),
			testEntry('same-a', 'Choir', { createdAt: '2026-10-20T10:00:00Z' })
		];

		expect(newestFirst(entries).map((entry) => entry.name)).toEqual([
			'Nave',
			'Choir',
			'Crypt',
			'Apse'
		]);
	});
});
