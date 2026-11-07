import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import type { ComponentProps } from 'svelte';
import { m } from '#lib/i18n/i18n.ts';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { ArtworkLookup } from '#lib/exhibitions/artwork-lookup/artwork-lookup.svelte.ts';
import { blockOf } from '#lib/exhibitions/editor/block-rows/block-rows.ts';
import { artwork, closeUp, heading } from '#lib/testing/exhibitions/exhibitions.ts';
import type { ExhibitionDocument } from '#lib/exhibitions/types/exhibition-document.ts';
import BlockCard from './BlockCard.svelte';

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

type Props = ComponentProps<typeof BlockCard> & {
	onchange: ReturnType<typeof vi.fn<(node: ExhibitionDocument) => void>>;
	onmovestart: ReturnType<typeof vi.fn<(event: PointerEvent) => void>>;
};

function props(node: ExhibitionDocument): Props {
	const lookup = new ArtworkLookup();
	lookup.add([testArtwork(1, 'Judith')]);
	return {
		block: blockOf(node),
		lookup,
		canUp: true,
		canDown: true,
		onmovestart: vi.fn<(event: PointerEvent) => void>(),
		onstep: vi.fn(),
		onremove: vi.fn(),
		onchange: vi.fn<(node: ExhibitionDocument) => void>()
	};
}

describe('BlockCard', () => {
	it('edits a heading in a field of its own', async () => {
		const given = props(heading('Night'));
		render(BlockCard, given);

		const field = page.getByRole('textbox', { name: m.exhibitions.blocks.heading });
		await expect.element(field).toHaveValue('Night');
		await userEvent.fill(field, 'Day');

		expect(given.onchange).toHaveBeenLastCalledWith({
			type: 'heading',
			attrs: { level: 2 },
			content: [{ type: 'text', text: 'Day' }]
		});
	});

	it('picks an artwork up by its image but not by its links', async () => {
		const given = props({ ...artwork('artwork-1'), content: [{ type: 'text', text: 'Old' }] });
		render(BlockCard, given);

		await expect.element(page.getByText('Old')).toBeInTheDocument();
		document
			.querySelector('.grab .mat')
			?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
		expect(given.onmovestart).toHaveBeenCalledTimes(1);
		expect(document.querySelector('.grab a')).toBeNull();
	});

	it('shows a detail and a palette with the name of their kind', async () => {
		render(BlockCard, props(closeUp('artwork-1')));
		await expect
			.element(page.getByRole('toolbar', { name: m.exhibitions.bar.label('Szczegół') }))
			.toBeInTheDocument();
	});

	it('ignores a press on a button inside a picked-up block', async () => {
		const given = props(closeUp('artwork-1'));
		render(BlockCard, given);
		const grab = document.querySelector('.grab');
		const button = document.createElement('button');
		grab?.appendChild(button);

		button.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));

		expect(given.onmovestart).not.toHaveBeenCalled();
	});
});
