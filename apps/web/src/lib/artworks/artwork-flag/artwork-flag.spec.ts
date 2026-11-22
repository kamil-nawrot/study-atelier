import { describe, expect, it } from 'vitest';
import type { ArtworkRecord } from '#lib/artworks/types/artwork-record.ts';
import type { Pin } from '#lib/pins/types/pin.ts';
import { artworkFlagGroup, stagePins } from './artwork-flag.ts';

const pin = (id: string, imageId: string, extra: Partial<Pin> = {}): Pin => ({
	id,
	imageId,
	x: 0.5,
	y: 0.5,
	glossaryEntryId: null,
	text: '',
	...extra
});

const pins = [
	pin('pin-1', 'image-1', { glossaryEntryId: 'term-1' }),
	pin('pin-2', 'image-2'),
	pin('pin-3', 'image-1', { symbolId: 'symbol-1' }),
	pin('pin-4', 'image-1', { text: 'A lily' })
];

describe('artwork flag', () => {
	it('numbers the pins of the stage image and names those with a term or a symbol', () => {
		expect(
			stagePins(pins, 'image-1', {
				glossary: [
					{
						id: 'term-1',
						name: 'Vanitas',
						kind: 'term' as const,
						category: 'painting',
						synonyms: [],
						forms: [],
						hasDefinition: true
					}
				],
				symbols: [{ id: 'symbol-1', name: 'Skull', meanings: [] }]
			})
		).toEqual([
			{ id: 'pin-1', imageId: 'image-1', number: 1, name: 'Vanitas' },
			{ id: 'pin-3', imageId: 'image-1', number: 2, name: 'Skull' },
			{ id: 'pin-4', imageId: 'image-1', number: 3 }
		]);
		expect(stagePins(pins, undefined, {})).toEqual([]);
	});

	it('offers the image and pins only when the artwork has them', () => {
		const artwork = {
			id: 'artwork-1',
			title: 'Jerome',
			image: { kind: 'url' }
		} as unknown as ArtworkRecord;
		expect(artworkFlagGroup(artwork, 'image-1', 2)).toEqual({
			item: { kind: 'artwork', id: 'artwork-1', title: 'Jerome', imageId: 'image-1' },
			reasons: ['image', 'pin', 'data', 'note', 'other']
		});
		expect(
			artworkFlagGroup({ ...artwork, image: null } as unknown as ArtworkRecord, undefined, 0)
				.reasons
		).toEqual(['data', 'note', 'other']);
	});
});
