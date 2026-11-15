import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { NEUTRAL_FILTERS } from '#lib/exhibitions/exhibition-poster/exhibition-poster.ts';
import PosterFrame from './PosterFrame.svelte';

const WIDE =
	'data:image/svg+xml,' +
	encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000"></svg>');

function frame(picture?: { src: string }, oncrop = vi.fn()): typeof oncrop {
	render(PosterFrame, {
		picture,
		crop: null,
		filters: NEUTRAL_FILTERS,
		label: 'Crop',
		hintId: 'hint',
		oncrop
	});
	return oncrop;
}

function pointer(element: Element, type: string, x: number): void {
	element.dispatchEvent(
		new PointerEvent(type, { pointerId: 1, clientX: x, clientY: 0, bubbles: true })
	);
}

describe('PosterFrame', () => {
	it('moves the crop with the arrow keys', async () => {
		const oncrop = frame({ src: WIDE });

		page
			.getByRole('button', { name: 'Crop' })
			.element()
			.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));

		expect(oncrop).toHaveBeenCalledWith({ x: 0.5, y: 0.55, zoom: 1 });
	});

	it('moves a wide image sideways when dragged', async () => {
		const oncrop = frame({ src: WIDE });
		const button = page.getByRole('button', { name: 'Crop' }).element();
		await expect.poll(() => button.querySelector('img')?.complete).toBe(true);

		pointer(button, 'pointerdown', 100);
		pointer(button, 'pointermove', 80);
		pointer(button, 'pointerup', 80);
		pointer(button, 'pointermove', 40);

		expect(oncrop).toHaveBeenCalledTimes(1);
		expect(oncrop.mock.calls[0]?.[0].x).toBeGreaterThan(0.5);
		expect(oncrop.mock.calls[0]?.[0].y).toBe(0.5);
	});

	it('leaves the crop alone without an image', async () => {
		const oncrop = frame();
		const button = page.getByRole('button', { name: 'Crop' }).element();

		pointer(button, 'pointerdown', 100);
		pointer(button, 'pointermove', 80);
		button.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));

		expect(oncrop).not.toHaveBeenCalled();
	});
});
