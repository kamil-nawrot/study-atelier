import { describe, expect, it } from 'vitest';
import { formsWithout, synonymChanges, synonymKey } from './word-forms.ts';

describe('word forms', () => {
	it('compares synonyms without case and outer spaces', () => {
		expect(synonymKey('  Fresk ')).toBe('fresk');
	});

	it('lists the synonyms removed and added since the last look', () => {
		expect(synonymChanges(['fresk', 'Tempera'], ['tempera ', 'gwasz'])).toEqual({
			removed: ['fresk'],
			added: ['gwasz']
		});
	});

	it('drops the forms of a synonym unless another word still has them', () => {
		expect(
			formsWithout(['freski', 'fresku', 'tempery'], ['freski', 'fresku'], [['fresku']])
		).toEqual(['fresku', 'tempery']);
	});
});
