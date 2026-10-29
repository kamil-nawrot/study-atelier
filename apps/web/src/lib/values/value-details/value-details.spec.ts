import { describe, expect, it } from 'vitest';
import { valueDetailsChanged } from './value-details.ts';

describe('valueDetailsChanged', () => {
	it('ignores spaces around the summary', () => {
		expect(valueDetailsChanged({ summary: 'A ', notes: '' }, { summary: 'A', notes: '' })).toBe(
			false
		);
		expect(valueDetailsChanged({ summary: 'A', notes: 'x' }, { summary: 'A', notes: '' })).toBe(
			true
		);
	});
});
