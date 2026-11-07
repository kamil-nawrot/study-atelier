import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { ArtworkLookup } from '#lib/exhibitions/artwork-lookup/artwork-lookup.svelte.ts';
import { closeUp, palette, set } from '#lib/testing/exhibitions/exhibitions.ts';
import BlockSetItems from './BlockSetItems.svelte';

vi.mock('#lib/wall/wall-images/wall-images.svelte.ts', () => ({
	WallImages: class {
		apply<T>(artworks: T[]): T[] {
			return artworks;
		}
		request(): void {}
		failed(): void {}
	}
}));
vi.mock('#lib/exhibitions/exhibition-images-data/exhibition-images-data.ts', () => ({
	loadArtworkImages: vi.fn().mockResolvedValue({ images: new Map() })
}));

function lookup(): ArtworkLookup {
	const given = new ArtworkLookup();
	given.add([testArtwork(1, 'Judith'), testArtwork(2, 'Olympia')]);
	return given;
}

describe('BlockSetItems', () => {
	it('shows every item of a set and removes the one the learner picks', async () => {
		const onchange = vi.fn();
		render(BlockSetItems, {
			node: set(palette('artwork-1'), palette('artwork-2')),
			lookup: lookup(),
			onchange,
			ongrab: vi.fn()
		});

		await userEvent.click(page.getByRole('button', { name: m.exhibitions.bar.removeItem(1) }));

		expect(document.querySelectorAll('.item')).toHaveLength(2);
		expect(onchange).toHaveBeenCalledWith(palette('artwork-2'));
	});

	it('offers no removal for a block that is not a set and passes a grab on', async () => {
		const ongrab = vi.fn();
		render(BlockSetItems, {
			node: closeUp('artwork-1'),
			lookup: lookup(),
			onchange: vi.fn(),
			ongrab
		});

		expect(document.querySelectorAll('.item')).toHaveLength(1);
		expect(document.querySelector('.drop-item')).toBeNull();
		document
			.querySelector('.item')
			?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
		expect(ongrab).toHaveBeenCalledTimes(1);
	});
});
