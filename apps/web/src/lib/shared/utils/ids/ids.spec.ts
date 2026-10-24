import { describe, expect, it } from 'vitest';
import { UUID_PATTERN, isUuid } from './ids.ts';

const id = '3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b';

describe('isUuid', () => {
	it('accepts a UUID in either case', () => {
		expect(isUuid(id)).toBe(true);
		expect(isUuid(id.toUpperCase())).toBe(true);
	});

	it('rejects text that only contains a UUID or has the wrong shape', () => {
		expect(isUuid(`x${id}`)).toBe(false);
		expect(isUuid('3f2b8c1e-9a4d-4e6f-8b7a')).toBe(false);
		expect(isUuid('')).toBe(false);
	});
});

describe('UUID_PATTERN', () => {
	it('finds every UUID inside a longer text', () => {
		const other = '00000000-0000-4000-8000-000000000001';
		expect(`{"a":"${id}","b":"${other}"}`.match(new RegExp(UUID_PATTERN, 'g'))).toEqual([
			id,
			other
		]);
	});
});
