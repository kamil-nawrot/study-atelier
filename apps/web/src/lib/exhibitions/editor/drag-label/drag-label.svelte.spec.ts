import { describe, expect, it, vi } from 'vitest';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { ArtworkLookup } from '#lib/exhibitions/artwork-lookup/artwork-lookup.svelte.ts';
import { m } from '#lib/i18n/i18n.ts';
vi.mock('#lib/wall/wall-images/wall-images.svelte.ts', () => ({
	WallImages: class {
		apply<T>(artworks: T[]): T[] {
			return artworks;
		}
		request(): void {}
		failed(): void {}
	}
}));

import { LABEL_LENGTH, blockLabel, newBlockLabel } from './drag-label.ts';

const lookup = new ArtworkLookup();
lookup.add([testArtwork(1, 'Judith')]);

function fake(name: string, text = '', attrs: Record<string, unknown> = {}): never {
	return { type: { name }, textContent: text, attrs } as never;
}

describe('blockLabel', () => {
	it('names an artwork and a close-up by the title of the artwork', () => {
		expect(blockLabel(fake('artwork', '', { artworkId: 'artwork-1' }), lookup)).toBe('Judith');
		expect(blockLabel(fake('closeUp', '', { artworkId: 'artwork-1' }), lookup)).toBe(
			m.exhibitions.closeUp.label('Judith')
		);
		expect(blockLabel(fake('artwork', '', { artworkId: 'gone' }), lookup)).toBe(
			m.exhibitions.bar.move
		);
	});

	it('names a text by its beginning, or by its kind while it is empty', () => {
		const long = 'Światło '.repeat(20);
		expect(blockLabel(fake('heading', '  Od   Leonarda '), lookup)).toBe('Od Leonarda');
		expect(blockLabel(fake('textBlock', long), lookup)).toHaveLength(LABEL_LENGTH);
		expect(blockLabel(fake('quote'), lookup)).toBe(m.exhibitions.bar.quote);
		expect(blockLabel(fake('paragraph'), lookup)).toBe(m.exhibitions.bar.move);
	});
});

describe('newBlockLabel', () => {
	it('names a block from the panel', () => {
		expect(newBlockLabel({ kind: 'artwork', artworkId: 'artwork-1' }, lookup)).toBe('Judith');
		expect(newBlockLabel({ kind: 'heading' }, lookup)).toBe(m.exhibitions.bar.heading);
	});
});
