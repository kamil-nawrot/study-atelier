import { describe, expect, it } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';
import { fieldOf, reasonText } from './flag-fields.ts';

describe('flag fields', () => {
	it('puts a flag at the field of the form it is about', () => {
		expect(fieldOf('artwork', 'pin')).toBe('image');
		expect(fieldOf('artwork', 'answers')).toBe('data');
		expect(fieldOf('term', 'definition')).toBe('definition');
		expect(fieldOf('term', 'hidden')).toBe('forms');
		expect(fieldOf('term', 'other')).toBe('top');
		expect(fieldOf('symbol', 'meaning')).toBe('meanings');
		expect(fieldOf('symbol', 'other')).toBe('top');
	});

	it('names the image of an image or pin flag', () => {
		expect(reasonText('pin', 2)).toBe(`${m.backroom.reasons.pin} (${m.backroom.imageNumber(2)})`);
		expect(reasonText('data', 2)).toBe(m.backroom.reasons.data);
		expect(reasonText('image', null)).toBe(m.backroom.reasons.image);
	});
});
