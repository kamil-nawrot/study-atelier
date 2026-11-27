import { describe, expect, it } from 'vitest';
import { exactLike } from './exact-like.ts';

describe('exactLike', () => {
	it('escapes the characters that a LIKE pattern reads as wildcards and trims the name', () => {
		expect(exactLike(' 100%_a\\b ')).toBe('100\\%\\_a\\\\b');
	});
});
