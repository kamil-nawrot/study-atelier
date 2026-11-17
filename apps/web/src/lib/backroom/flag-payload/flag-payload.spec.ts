import { describe, expect, it } from 'vitest';
import type { FlagItem } from '#lib/backroom/types/flag-item.ts';
import { commentMissing, flagPayload } from './flag-payload.ts';

const artwork: FlagItem = {
	kind: 'artwork',
	id: 'artwork-1',
	title: 'Saint Jerome',
	imageId: 'image-1',
	pin: { id: 'pin-1', imageId: 'image-2', x: 0.2, y: 0.4 }
};

describe('flag payload', () => {
	it('keeps the image of an artwork only for the image reason', () => {
		expect(flagPayload({ item: artwork, reason: 'image', comment: '' })).toEqual({
			artwork_id: 'artwork-1',
			image_id: 'image-1',
			reason: 'image',
			comment: null
		});
		expect(flagPayload({ item: artwork, reason: 'data', comment: '' })).toEqual({
			artwork_id: 'artwork-1',
			reason: 'data',
			comment: null
		});
	});

	it('points a pin flag at the pin and its image', () => {
		expect(flagPayload({ item: artwork, reason: 'pin', comment: '' })).toMatchObject({
			artwork_id: 'artwork-1',
			image_id: 'image-2',
			pin_id: 'pin-1'
		});
	});

	it('points a term and a symbol flag at the term or symbol alone', () => {
		expect(
			flagPayload({
				item: { kind: 'term', id: 'term-1', name: 'Vanitas' },
				reason: 'hidden',
				comment: ''
			})
		).toEqual({ term_id: 'term-1', reason: 'hidden', comment: null });
		expect(
			flagPayload({
				item: { kind: 'symbol', id: 'symbol-1', name: 'Skull' },
				reason: 'meaning',
				comment: ''
			})
		).toEqual({ symbol_id: 'symbol-1', reason: 'meaning', comment: null });
	});

	it('trims the comment, cuts it at 200 characters and carries the question', () => {
		const payload = flagPayload({
			item: artwork,
			reason: 'answers',
			comment: `  ${'x'.repeat(250)}  `,
			question: { mode: 'quiz_author', text: 'Kto jest autorem tego dzieła?', answer: 'Caravaggio' }
		});
		expect(payload.comment).toHaveLength(200);
		expect(payload.question).toEqual({
			mode: 'quiz_author',
			text: 'Kto jest autorem tego dzieła?',
			answer: 'Caravaggio'
		});
	});

	it('asks for a comment only for something else', () => {
		expect(commentMissing({ reason: 'other', comment: '  ' })).toBe(true);
		expect(commentMissing({ reason: 'other', comment: 'Two authors' })).toBe(false);
		expect(commentMissing({ reason: 'image', comment: '' })).toBe(false);
	});
});
