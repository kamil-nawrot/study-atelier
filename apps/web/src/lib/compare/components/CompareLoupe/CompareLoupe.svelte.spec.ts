import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '@study-atelier/ui/styles.css';
import { SharedLoupe } from '#lib/compare/shared-loupe/shared-loupe.svelte.ts';
import { m } from '#lib/i18n/i18n.ts';
import CompareLoupe from './CompareLoupe.svelte';

const SMALL = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="30"/>')}`;
const LARGE = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1200"/>')}`;

let frames: HTMLElement[] = [];

function renderLoupe(loupe: SharedLoupe, sourceWidth = 1600, width = 400): HTMLElement {
	const frame = document.createElement('div');
	frame.style.position = 'relative';
	frame.style.width = `${width}px`;
	frame.style.height = '300px';
	document.body.appendChild(frame);
	frames.push(frame);
	render(CompareLoupe, {
		target: frame,
		props: { loupe, image: SMALL, large: LARGE, sourceWidth }
	});
	return frame.querySelector('.loupe') as HTMLElement;
}

function point(layer: HTMLElement, x: number, y: number): void {
	const rect = layer.getBoundingClientRect();
	layer.dispatchEvent(
		new PointerEvent('pointermove', {
			pointerType: 'mouse',
			clientX: rect.left + x,
			clientY: rect.top + y,
			bubbles: true
		})
	);
}

describe('CompareLoupe', () => {
	afterEach(() => {
		for (const frame of frames) frame.remove();
		frames = [];
	});

	it('shows the same level on images of different widths', async () => {
		const loupe = new SharedLoupe();
		const wide = renderLoupe(loupe, 1600, 400);
		const narrow = renderLoupe(loupe, 1600, 220);

		point(wide, 100, 100);

		await expect.poll(() => narrow.querySelector('.level')?.textContent).toBe(m.loupe.level(2));
		expect(wide.querySelector('.level')?.textContent).toBe(m.loupe.level(2));
	});

	it('stores the place under the cursor as a share of the image', () => {
		const loupe = new SharedLoupe();
		const layer = renderLoupe(loupe);

		point(layer, 100, 150);

		expect(loupe.spot).toEqual({ x: 0.25, y: 0.5 });
		expect(loupe.level).toBeGreaterThan(0);
	});

	it('shows a lens where the other image holds the shared spot', async () => {
		const loupe = new SharedLoupe();
		const layer = renderLoupe(loupe);
		loupe.level = 2;

		loupe.spot = { x: 0.5, y: 0.5 };

		await expect.poll(() => layer.querySelector('.place')).not.toBeNull();
		const place = layer.querySelector('.place') as HTMLElement;
		expect(place.style.left).toBe('90px');
		expect(place.style.top).toBe('40px');
	});

	it('zooms every image with the wheel by changing the shared view', () => {
		const loupe = new SharedLoupe();
		const layer = renderLoupe(loupe);
		point(layer, 100, 100);
		const before = loupe.level as number;

		layer.dispatchEvent(new WheelEvent('wheel', { deltaY: -1, bubbles: true, cancelable: true }));

		expect(loupe.level).toBeGreaterThan(before);
	});

	it('forgets the spot when the cursor leaves', () => {
		const loupe = new SharedLoupe();
		const layer = renderLoupe(loupe);
		point(layer, 100, 100);

		layer.dispatchEvent(new PointerEvent('pointerleave', { bubbles: true }));

		expect(loupe.spot).toBeUndefined();
	});

	it('switches off with Escape and with the right button', () => {
		const loupe = new SharedLoupe();
		const layer = renderLoupe(loupe);
		loupe.toggle(true);

		window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
		expect(loupe.on).toBe(false);

		loupe.toggle(true);
		layer.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
		expect(loupe.on).toBe(false);
	});

	it('switches off on a click beside the images but not on the toggle', () => {
		const loupe = new SharedLoupe();
		renderLoupe(loupe);
		loupe.toggle(true);
		const toggle = document.createElement('button');
		toggle.setAttribute('data-loupe-toggle', '');
		document.body.appendChild(toggle);

		toggle.dispatchEvent(new PointerEvent('pointerdown', { button: 0, bubbles: true }));
		expect(loupe.on).toBe(true);

		document.body.dispatchEvent(new PointerEvent('pointerdown', { button: 0, bubbles: true }));
		expect(loupe.on).toBe(false);
		toggle.remove();
	});
});
