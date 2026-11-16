import { describe, expect, it } from 'vitest';
import type { FixEntry } from '#lib/backroom/types/fix-entry.ts';
import { fixStart, itemEntries } from './fix-entries.ts';

const entry = (key: string, path: string, flagIds?: string[]): FixEntry => ({
	key,
	path,
	field: 'top',
	note: key,
	...(flagIds ? { flagIds } : {})
});

const entries = [
	entry('a', '/atelier/1/edit', ['f1']),
	entry('b', '/atelier/2/edit', ['f2']),
	entry('c', '/atelier/1/edit', ['f3']),
	entry('d', '/atelier/3/edit')
];

describe('fix entries', () => {
	it('visits each item once with all its flags, in the order of the list', () => {
		expect(itemEntries(entries)).toEqual([
			entry('a', '/atelier/1/edit', ['f1', 'f3']),
			entry('b', '/atelier/2/edit', ['f2']),
			entry('d', '/atelier/3/edit')
		]);
	});

	it('starts at the item of the chosen row', () => {
		expect(fixStart(entries, 2).position).toBe(0);
		expect(fixStart(entries, 3).position).toBe(2);
	});
});
