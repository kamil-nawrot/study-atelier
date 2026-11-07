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
		rect: { top: 300, bottom: 360, left: 100, right: 500 },
		...overrides
	};
}

type Handlers = Record<
	'onconvert' | 'onmovestart' | 'onnote' | 'onremove' | 'onstep' | 'ontoggle',
	Mock
>;

function handlers(): Handlers {
	return {
		onconvert: vi.fn(),
		onmovestart: vi.fn(),
		onnote: vi.fn(),
		onremove: vi.fn(),
		onstep: vi.fn(),
		ontoggle: vi.fn()
	};
}

function props(overrides: Partial<BlockBarState> = {}): {
	bar: BlockBarState;
	column: HTMLElement;
	topLimit: number;
} & Handlers {
	return { bar: bar(overrides), column: document.body, topLimit: 80, ...handlers() };
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
});
