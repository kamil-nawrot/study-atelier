import { describe, expect, it, vi } from 'vitest';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { ArtworkLookup } from '#lib/exhibitions/artwork-lookup/artwork-lookup.svelte.ts';
import { blockLabel, newBlockLabel } from '#lib/exhibitions/editor/block-label/block-label.ts';
import { artworkNode, textNode } from '#lib/exhibitions/editor/new-block/new-block.ts';

vi.mock('#lib/wall/wall-images/wall-images.svelte.ts', () => ({
	WallImages: class {
		apply<T>(artworks: T[]): T[] {
			return artworks;
		}
		request(): void {}
		failed(): void {}
	}
}));

const lookup = new ArtworkLookup();
lookup.add([testArtwork(1, 'Judith')]);

describe('block labels', () => {
	it('names the kind and the artwork of a block', () => {
		expect(newBlockLabel({ kind: 'heading' }, lookup)).toBe('Nagłówek');
		expect(newBlockLabel({ kind: 'palette', artworkId: 'artwork-1' }, lookup)).toBe(
			'Paleta: Judith'
		);
		expect(newBlockLabel({ kind: 'artwork', artworkId: 'gone' }, lookup)).toBe('Dzieło');
		expect(blockLabel(artworkNode('artwork-1'), lookup)).toBe('Dzieło: Judith');
		expect(blockLabel(textNode('quote'), lookup)).toBe('Cytat');
		expect(newBlockLabel({ kind: 'symbol', symbolId: 's1', name: 'Skull' }, lookup)).toBe(
			'Symbol: Skull'
		);
	});
});
