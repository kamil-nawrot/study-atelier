import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import type { ComponentProps } from 'svelte';
import { m } from '#lib/i18n/i18n.ts';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { ArtworkLookup } from '#lib/exhibitions/artwork-lookup/artwork-lookup.svelte.ts';
import { blockOf } from '#lib/exhibitions/editor/block-rows/block-rows.ts';
import {
	artwork,
	closeUp,
	divider,
	heading,
	palette,
	set
} from '#lib/testing/exhibitions/exhibitions.ts';
import type { ExhibitionDocument } from '#lib/exhibitions/types/exhibition-document.ts';
import '@study-atelier/ui/styles.css';
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

	it('wraps a long heading onto more lines and keeps it one line of text', async () => {
		const given = props(heading(''));
		render(BlockCard, given);

		const field = page.getByRole('textbox', { name: m.exhibitions.blocks.heading });
		await userEvent.fill(field, 'Światło i cień\nw malarstwie');
		expect(given.onchange).toHaveBeenLastCalledWith({
			type: 'heading',
			attrs: { level: 2 },
			content: [{ type: 'text', text: 'Światło i cień w malarstwie' }]
		});

		await userEvent.fill(
			field,
			'Długi nagłówek, który na wąskim bloku nie mieści się w jednej linii'
		);
		const box = field.element().getBoundingClientRect();
		const line = parseFloat(getComputedStyle(field.element()).lineHeight);
		(field.element() as HTMLElement).style.width = '200px';
		await expect
			.poll(() => field.element().getBoundingClientRect().height)
			.toBeGreaterThan(line * 1.5);
		expect(box.width).toBeGreaterThan(0);
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

	it('switches the note of an artwork on and off from its toolbox', async () => {
		const given = props(artwork('artwork-1'));
		render(BlockCard, given);

		const note = page.getByRole('button', { name: m.exhibitions.bar.note });
		await expect.element(note).toHaveAttribute('aria-pressed', 'false');
		await userEvent.click(note);

		expect(given.onchange).toHaveBeenLastCalledWith({
			type: 'artwork',
			attrs: { artworkId: 'artwork-1', note: true }
		});
	});

	it('draws or hides the line of a divider from its toolbox and offers no position', async () => {
		const given = props(divider());
		render(BlockCard, given);

		await expect.element(page.getByRole('separator')).not.toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: m.exhibitions.bar.position }))
			.not.toBeInTheDocument();
		const line = page.getByRole('button', { name: m.exhibitions.bar.line });
		await expect.element(line).toHaveAttribute('aria-pressed', 'false');
		await userEvent.click(line);

		expect(given.onchange).toHaveBeenLastCalledWith({ type: 'divider', attrs: { line: true } });
	});

	it('shows the line of a divider that has one', async () => {
		render(BlockCard, props(divider(true)));
		await expect.element(page.getByRole('separator')).toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: m.exhibitions.bar.line }))
			.toHaveAttribute('aria-pressed', 'true');
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

	it('offers another detail or palette from the toolbox until the set holds five', async () => {
		const onaddmore = vi.fn();
		const { rerender } = await render(BlockCard, { ...props(palette('artwork-1')), onaddmore });

		await userEvent.click(page.getByRole('button', { name: m.exhibitions.bar.addMore }));
		expect(onaddmore).toHaveBeenCalledTimes(1);

		const full = set(...[1, 2, 3, 4, 5].map(() => closeUp('artwork-1')));
		await rerender({ block: blockOf(full) });
		await expect.element(page.getByRole('button', { name: m.exhibitions.bar.full })).toBeDisabled();
		await expect
			.element(page.getByRole('toolbar', { name: m.exhibitions.bar.label('Szczegół') }))
			.toBeInTheDocument();
	});

	it('removes one item of a set and keeps the rest', async () => {
		const given = props(set(palette('artwork-1'), palette('artwork-1'), palette('artwork-1')));
		render(BlockCard, given);

		await userEvent.click(page.getByRole('button', { name: m.exhibitions.bar.removeItem(2) }));

		expect(given.onchange).toHaveBeenCalledWith(set(palette('artwork-1'), palette('artwork-1')));
	});

	it('moves the image of an artwork to the place picked for its block', async () => {
		render(
			BlockCard,
			props({ ...artwork('artwork-1'), attrs: { artworkId: 'artwork-1', align: 'right' } })
		);

		await vi.waitFor(() => expect(document.querySelector('.figure .top')).not.toBeNull());
		expect(getComputedStyle(document.querySelector('.figure .top') as Element).justifyItems).toBe(
			'end'
		);
	});
});
