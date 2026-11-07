import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import type { Position } from '#lib/exhibitions/editor/block-position/block-position.ts';
import PositionPicker from './PositionPicker.svelte';

describe('PositionPicker', () => {
	it('opens nine places, marks the current one and picks another', async () => {
		const onpick = vi.fn<(position: Position) => void>();
		render(PositionPicker, { position: { align: 'left', valign: 'top' }, onpick });

		const toggle = page.getByRole('button', { name: m.exhibitions.bar.position });
		await userEvent.click(toggle);
		await expect.element(toggle).toHaveAttribute('aria-expanded', 'true');
		expect(document.querySelectorAll('.cell')).toHaveLength(9);
		await expect
			.element(page.getByRole('button', { name: m.exhibitions.bar.place('top', 'left') }))
			.toHaveAttribute('aria-pressed', 'true');

		await userEvent.click(
			page.getByRole('button', { name: m.exhibitions.bar.place('bottom', 'center') })
		);

		expect(onpick).toHaveBeenCalledWith({ align: 'center', valign: 'bottom' });
		expect(document.querySelector('.cell')).toBeNull();
	});

	it('closes on Escape', async () => {
		render(PositionPicker, { position: { align: 'right', valign: 'middle' }, onpick: vi.fn() });

		await userEvent.click(page.getByRole('button', { name: m.exhibitions.bar.position }));
		document
			.querySelector('.cell')
			?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

		await expect.poll(() => document.querySelector('.cell')).toBeNull();
	});
});
