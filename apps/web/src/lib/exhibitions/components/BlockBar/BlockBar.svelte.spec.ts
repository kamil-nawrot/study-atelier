import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import BlockBar from './BlockBar.svelte';

function props(
	canUp = true,
	canDown = true
): {
	label: string;
	canUp: boolean;
	canDown: boolean;
	onmovestart: ReturnType<typeof vi.fn<(event: PointerEvent) => void>>;
	onstep: ReturnType<typeof vi.fn<(direction: -1 | 1) => void>>;
	onremove: ReturnType<typeof vi.fn<() => void>>;
} {
	return {
		label: 'Dzieło',
		canUp,
		canDown,
		onmovestart: vi.fn<(event: PointerEvent) => void>(),
		onstep: vi.fn<(direction: -1 | 1) => void>(),
		onremove: vi.fn<() => void>()
	};
}

describe('BlockBar', () => {
	it('names the block and moves or removes it', async () => {
		const given = props();
		render(BlockBar, given);

		await expect
			.element(page.getByRole('toolbar', { name: m.exhibitions.bar.label('Dzieło') }))
			.toBeInTheDocument();
		await userEvent.click(page.getByRole('button', { name: m.exhibitions.bar.up }));
		await userEvent.click(page.getByRole('button', { name: m.exhibitions.bar.down }));
		await userEvent.click(page.getByRole('button', { name: m.exhibitions.bar.remove }));

		expect(given.onstep).toHaveBeenNthCalledWith(1, -1);
		expect(given.onstep).toHaveBeenNthCalledWith(2, 1);
		expect(given.onremove).toHaveBeenCalled();
	});

	it('starts a move from its handle', async () => {
		const given = props();
		render(BlockBar, given);

		document
			.querySelector('.handle')
			?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));

		expect(given.onmovestart).toHaveBeenCalled();
	});

	it('turns off the steps a block cannot take', async () => {
		render(BlockBar, props(false, false));

		await expect.element(page.getByRole('button', { name: m.exhibitions.bar.up })).toBeDisabled();
		await expect.element(page.getByRole('button', { name: m.exhibitions.bar.down })).toBeDisabled();
	});
});
