import { describe, expect, it } from 'vitest';
import { takesOneValue } from './category-values.ts';

describe('takesOneValue', () => {
	it('allows one value for the location and many for other categories', () => {
		expect(takesOneValue('location')).toBe(true);
		expect(takesOneValue('author')).toBe(false);
	});
});
