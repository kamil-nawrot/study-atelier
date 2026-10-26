import { describe, expect, it } from 'vitest';
import { megabytes } from './storage-usage.ts';

describe('megabytes', () => {
	it('writes megabytes with one decimal in the Polish way', () => {
		expect(megabytes(9_122_611)).toBe('8,7');
		expect(megabytes(209_715_200)).toBe('200');
		expect(megabytes(0)).toBe('0');
	});
});
