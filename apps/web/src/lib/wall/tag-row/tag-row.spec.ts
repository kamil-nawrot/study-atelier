import { describe, expect, it } from 'vitest';
import { fittingTags } from './tag-row.ts';

describe('fittingTags', () => {
	it('shows every tag when they fit with the clear button', () => {
		expect(fittingTags([100, 100, 30, 80], 300, 8)).toBe(2);
	});

	it('collapses the tags that do not fit into the more button', () => {
		expect(fittingTags([100, 100, 100, 30, 80], 300, 8)).toBe(1);
	});

	it('keeps the more button when not even one tag fits', () => {
		expect(fittingTags([400, 100, 30, 80], 300, 8)).toBe(0);
	});

	it('shows every tag before the row is measured', () => {
		expect(fittingTags([100, 100, 100, 30, 80], 0, 8)).toBe(3);
		expect(fittingTags([], 300, 8)).toBe(0);
	});
});
