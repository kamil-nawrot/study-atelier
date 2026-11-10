import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRawSnippet } from 'svelte';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import '@study-atelier/ui/styles.css';
import type { Pin } from '#lib/pins/types/pin.ts';
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

const card = createRawSnippet((shown: () => Pin) => ({
	render: () => `<p>Card of ${shown().id}</p>`
}));

describe('PinMarkers', () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it('opens the card of a hovered pin after the hover delay of a tooltip', async () => {
		vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
		render(PinMarkers, { pins: [pin('a')], card, onmove: vi.fn(), onselect: vi.fn() });
		const first = page.getByRole('button', { name: 'Pinezka 1' });

		await userEvent.hover(first);
		vi.advanceTimersByTime(300);
		await expect.element(first).toHaveAttribute('aria-expanded', 'false');
		vi.advanceTimersByTime(20);

		await expect.element(first).toHaveAttribute('aria-expanded', 'true');
		await expect.element(page.getByText('Card of a')).toBeInTheDocument();
	});

	it('opens no card when the pointer leaves a pin before the delay', async () => {
		vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
		render(PinMarkers, { pins: [pin('a')], card, onmove: vi.fn(), onselect: vi.fn() });
		const first = page.getByRole('button', { name: 'Pinezka 1' });

		const away = document.createElement('div');
		away.style.cssText = 'position: fixed; right: 0; bottom: 0; width: 20px; height: 20px';
		document.body.append(away);

		await userEvent.hover(first);
		vi.advanceTimersByTime(200);
		await userEvent.hover(away);
		vi.advanceTimersByTime(1000);

		await expect.element(first).toHaveAttribute('aria-expanded', 'false');
		expect(page.getByText('Card of a').elements()).toHaveLength(0);
		away.remove();
	});

	it('opens the card of a focused pin at once', async () => {
		vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
		render(PinMarkers, { pins: [pin('a')], card, onmove: vi.fn(), onselect: vi.fn() });

		await userEvent.keyboard('{Tab}');

		await expect
			.element(page.getByRole('button', { name: 'Pinezka 1' }))
			.toHaveAttribute('aria-expanded', 'true');
		await expect.element(page.getByText('Card of a')).toBeInTheDocument();
	});

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
