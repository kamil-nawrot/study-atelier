import { describe, expect, it, vi, type Mock } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import type { BlockBarState } from '#lib/exhibitions/types/block-bar-state.ts';
import BlockBar from './BlockBar.svelte';

function bar(overrides: Partial<BlockBarState> = {}): BlockBarState {
	return {
		kind: 'textBlock',
		index: 1,
		count: 3,
		bold: false,
		italic: true,
		note: false,
		palette: false,
		paletteOnly: false,
		row: false,
		rect: { top: 300, bottom: 360, left: 100, right: 500 },
		...overrides
	};
}

type Handlers = Record<
	| 'onconvert'
	| 'onmovestart'
	| 'onnote'
	| 'onpalette'
	| 'oncloseup'
	| 'onremove'
	| 'onstep'
	| 'ontoggle',
	Mock
>;

function handlers(): Handlers {
	return {
		onconvert: vi.fn(),
		onmovestart: vi.fn(),
		onnote: vi.fn(),
		onpalette: vi.fn(),
		oncloseup: vi.fn(),
		onremove: vi.fn(),
		onstep: vi.fn(),
		ontoggle: vi.fn()
	};
}

function props(overrides: Partial<BlockBarState> = {}): {
	bar: BlockBarState;
	frameWidth: number;
	topLimit: number;
} & Handlers {
	return { bar: bar(overrides), frameWidth: 900, topLimit: 80, ...handlers() };
}

describe('BlockBar', () => {
	it('lets the learner change the kind of a text block and its marks', async () => {
		const given = props();
		render(BlockBar, given);

		await page.getByRole('button', { name: m.exhibitions.bar.quote }).click();
		await page.getByRole('button', { name: m.exhibitions.bar.bold }).click();

		expect(given.onconvert).toHaveBeenCalledWith('quote');
		expect(given.ontoggle).toHaveBeenCalledWith('bold');
		await expect
			.element(page.getByRole('button', { name: m.exhibitions.bar.italic }))
			.toHaveAttribute('aria-pressed', 'true');
	});

	it('moves the block up and down, and disables the step the block cannot make', async () => {
		const given = props({ index: 0 });
		render(BlockBar, given);

		await expect.element(page.getByRole('button', { name: m.exhibitions.bar.up })).toBeDisabled();
		await page.getByRole('button', { name: m.exhibitions.bar.down }).click();
		expect(given.onstep).toHaveBeenCalledWith(1);
	});

	it('offers the note and removal for an artwork, but no text formatting', async () => {
		const given = props({ kind: 'artwork' });
		render(BlockBar, given);

		await page.getByRole('button', { name: m.exhibitions.bar.note }).click();
		await page.getByRole('button', { name: m.exhibitions.bar.remove }).click();

		expect(given.onnote).toHaveBeenCalled();
		expect(given.onremove).toHaveBeenCalled();
		await expect
			.element(page.getByRole('button', { name: m.exhibitions.bar.bold }))
			.not.toBeInTheDocument();
	});

	it('does not offer bold in a heading', async () => {
		render(BlockBar, props({ kind: 'heading' }));

		await expect
			.element(page.getByRole('button', { name: m.exhibitions.bar.bold }))
			.not.toBeInTheDocument();
	});

	it('offers the palette, the palette alone and a close-up for an artwork', async () => {
		const given = props({ kind: 'artwork', paletteOnly: true });
		render(BlockBar, given);

		await page.getByRole('button', { name: m.exhibitions.bar.palette, exact: true }).click();
		await page.getByRole('button', { name: m.exhibitions.bar.paletteOnly }).click();
		await page.getByRole('button', { name: m.exhibitions.bar.closeUp }).click();

		expect(given.onpalette).toHaveBeenNthCalledWith(1, false);
		expect(given.onpalette).toHaveBeenNthCalledWith(2, true);
		expect(given.oncloseup).toHaveBeenCalled();
		await expect
			.element(page.getByRole('button', { name: m.exhibitions.bar.paletteOnly }))
			.toHaveAttribute('aria-pressed', 'true');
	});

	it('offers only removal for a close-up', async () => {
		render(BlockBar, props({ kind: 'closeUp' }));

		await expect
			.element(page.getByRole('button', { name: m.exhibitions.bar.remove }))
			.toBeVisible();
		await expect
			.element(page.getByRole('button', { name: m.exhibitions.bar.note }))
			.not.toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: m.exhibitions.bar.italic }))
			.not.toBeInTheDocument();
	});

	it('moves a block of a row to the left and to the right', async () => {
		render(BlockBar, props({ row: true }));

		await expect.element(page.getByRole('button', { name: m.exhibitions.bar.left })).toBeVisible();
		await expect.element(page.getByRole('button', { name: m.exhibitions.bar.right })).toBeVisible();
	});

	it('starts a move when the learner presses the handle', async () => {
		const given = props();
		render(BlockBar, given);

		document
			.querySelector('.handle')
			?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));

		expect(given.onmovestart).toHaveBeenCalledOnce();
	});

	it('stands above the block and stays inside the document', async () => {
		render(BlockBar, props({ rect: { top: 300, bottom: 360, left: 880, right: 900 } }));

		const track = document.querySelector<HTMLElement>('.track');
		await vi.waitFor(() => expect(Number.parseFloat(track?.style.left ?? '')).toBeLessThan(880));
		expect(Number.parseFloat(track?.style.top ?? '')).toBeLessThan(300);
	});
});
