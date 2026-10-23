import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import type { Pin } from '../types.ts';
import PinMarkers from './PinMarkers.svelte';

function pin(id: string, overrides: Partial<Pin> = {}): Pin {
	return {
		id,
		imageId: 'image-1',
		x: 0.5,
		y: 0.5,
		glossaryEntryId: null,
		text: 'A detail',
		...overrides
	};
}

describe('PinMarkers', () => {
	it('numbers the markers and names the term of a pin', async () => {
		render(PinMarkers, {
			pins: [pin('a'), pin('b', { glossaryEntryId: 'entry-1' })],
			names: { 'entry-1': 'Apse' },
			onmove: vi.fn(),
			onselect: vi.fn()
		});

		await expect
			.element(page.getByRole('button', { name: 'Pinezka 1', exact: true }))
			.toBeVisible();
		await expect.element(page.getByRole('button', { name: 'Pinezka 2: Apse' })).toBeVisible();
	});

	it('selects a pin on a click', async () => {
		const onselect = vi.fn();
		const first = pin('a');
		render(PinMarkers, { pins: [first], onmove: vi.fn(), onselect });

		await page.getByRole('button', { name: 'Pinezka 1' }).click();

		expect(onselect).toHaveBeenCalledWith(first);
	});

	it('does not move a focused pin with the arrow keys outside editing', async () => {
		const onmove = vi.fn();
		render(PinMarkers, { pins: [pin('a')], onmove, onselect: vi.fn() });

		page.getByRole('button', { name: 'Pinezka 1' }).element().focus();
		await userEvent.keyboard('{ArrowRight}');

		expect(onmove).not.toHaveBeenCalled();
	});

	it('moves a focused pin with the arrow keys while editing', async () => {
		const onmove = vi.fn();
		const first = pin('a');
		render(PinMarkers, { pins: [first], editing: true, onmove, onselect: vi.fn() });

		page.getByRole('button', { name: 'Pinezka 1' }).element().focus();
		await userEvent.keyboard('{ArrowRight}');

		expect(onmove).toHaveBeenCalledWith(first, { x: 0.52, y: 0.5 });
	});

	it('saves the place of a pin moved with a held arrow key once, when the key is released', async () => {
		const onmove = vi.fn();
		const first = pin('a');
		render(PinMarkers, { pins: [first], editing: true, onmove, onselect: vi.fn() });

		page.getByRole('button', { name: 'Pinezka 1' }).element().focus();
		await userEvent.keyboard('{ArrowRight>3}');

		expect(onmove).not.toHaveBeenCalled();

		await userEvent.keyboard('{/ArrowRight}');

		expect(onmove).toHaveBeenCalledTimes(1);
		expect(onmove.mock.calls[0][1].x).toBeCloseTo(0.56);
	});

	it('shows the draft marker without making it a button', async () => {
		render(PinMarkers, {
			pins: [pin('a')],
			draft: { x: 0.2, y: 0.3, number: 2 },
			onmove: vi.fn(),
			onselect: vi.fn()
		});

		await expect.element(page.getByText('2', { exact: true })).toBeVisible();
		expect(page.getByRole('button').elements()).toHaveLength(1);
	});

	it('names a pin that keeps a view of the loupe', async () => {
		render(PinMarkers, {
			pins: [pin('a', { viewWidth: 0.1 })],
			onmove: vi.fn(),
			onselect: vi.fn()
		});

		await expect.element(page.getByRole('button', { name: 'Pinezka 1, widok lupy' })).toBeVisible();
	});
});
