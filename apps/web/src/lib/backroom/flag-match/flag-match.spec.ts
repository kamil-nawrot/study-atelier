import { describe, expect, it } from 'vitest';
import type { StoredFlag } from '#lib/backroom/types/stored-flag.ts';
import { flagOf, flagsOfGroups } from './flag-match.ts';

function flag(extra: Partial<StoredFlag>): StoredFlag {
	return {
		id: 'flag',
		reason: 'data',
		comment: null,
		artworkId: null,
		termId: null,
		symbolId: null,
		imageId: null,
		pinId: null,
		imageNumber: null,
		question: null,
		holds: false,
		mode: null,
		...extra
	};
}

const flags = [
	flag({ id: 'data', artworkId: 'a1', reason: 'data', comment: 'Wrong year' }),
	flag({ id: 'image-2', artworkId: 'a1', reason: 'image', imageId: 'i2' }),
	flag({ id: 'image', artworkId: 'a1', reason: 'image' }),
	flag({ id: 'pin', artworkId: 'a1', reason: 'pin', imageId: 'i1', pinId: 'p1' }),
	flag({ id: 'term', termId: 't1', reason: 'hidden' }),
	flag({ id: 'symbol', symbolId: 's1', reason: 'meaning' })
];

const artwork = { kind: 'artwork' as const, id: 'a1', title: 'Jerome' };

describe('flag match', () => {
	it('finds the flag of an item and reason', () => {
		expect(flagOf(flags, artwork, 'data')?.comment).toBe('Wrong year');
		expect(flagOf(flags, { kind: 'term', id: 't1', name: 'Vanitas' }, 'hidden')?.id).toBe('term');
		expect(flagOf(flags, { kind: 'symbol', id: 's1', name: 'Skull' }, 'meaning')?.id).toBe(
			'symbol'
		);
		expect(flagOf(flags, artwork, 'note')).toBeUndefined();
		expect(
			flagOf(flags, { kind: 'term', id: 't1', name: 'Vanitas' }, 'definition')
		).toBeUndefined();
	});

	it('tells the images of an artwork apart', () => {
		expect(flagOf(flags, artwork, 'image')?.id).toBe('image');
		expect(flagOf(flags, { ...artwork, imageId: 'i2' }, 'image')?.id).toBe('image-2');
		expect(flagOf(flags, { ...artwork, imageId: 'i3' }, 'image')).toBeUndefined();
	});

	it('finds a pin flag by the pin or by the image of the review pin', () => {
		expect(flagOf(flags, artwork, 'pin', 'p1')?.id).toBe('pin');
		expect(flagOf(flags, artwork, 'pin', 'p2')).toBeUndefined();
		expect(flagOf(flags, { ...artwork, pin: { imageId: 'i1', x: 0, y: 0 } }, 'pin')?.id).toBe(
			'pin'
		);
		expect(
			flagOf(flags, { ...artwork, pin: { imageId: 'i9', x: 0, y: 0 } }, 'pin')
		).toBeUndefined();
	});

	it('gathers the flags of the items of a question', () => {
		expect(
			flagsOfGroups(flags, [
				{ item: { kind: 'term', id: 't1', name: 'Vanitas' }, reasons: ['hidden'] },
				{ item: { kind: 'artwork', id: 'a9', title: 'Other' }, reasons: ['data'] }
			]).map((found) => found.id)
		).toEqual(['term']);
		expect(flagsOfGroups(flags, [{ item: artwork, reasons: [] }])).toHaveLength(4);
	});
});
