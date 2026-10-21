import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import './styles/tokens.css';
import './styles/base.css';
import OverlayScrollArea from './testing/OverlayScrollArea.svelte';

function area(): HTMLElement {
	return document.querySelector('[data-testid="area"]') as HTMLElement;
}

function thumb(): HTMLElement | null {
	return area()?.querySelector('.overlay-scrollbar-thumb') ?? null;
}

async function nextFrame(): Promise<void> {
	await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
}

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('overlayScrollbar', () => {
	it('hides the native bar and draws a thumb sized by the content in view', async () => {
		await render(OverlayScrollArea);
		await nextFrame();

		expect(area().classList.contains('overlay-scrollbar')).toBe(true);
		expect(thumb()?.hidden).toBe(false);
		expect(thumb()?.getAttribute('aria-hidden')).toBe('true');
		expect(thumb()?.style.height).toBe('25px');
	});

	it('shows the thumb while the content scrolls and hides it after a pause', async () => {
		await render(OverlayScrollArea);
		await nextFrame();

		area().scrollTop = 800;
		area().dispatchEvent(new Event('scroll'));
		await nextFrame();
		expect(thumb()?.classList.contains('visible')).toBe(true);
		expect(thumb()?.style.top).toBe(`${800 + Math.floor((800 / 1400) * 175)}px`);

		await vi.waitFor(() => expect(thumb()?.classList.contains('visible')).toBe(false), {
			timeout: 2000
		});
	});

	it('scrolls the content when the thumb is dragged', async () => {
		await render(OverlayScrollArea);
		await nextFrame();
		const handle = thumb() as HTMLElement;
		const box = handle.getBoundingClientRect();
		const at = { clientX: box.left + 1, clientY: box.top + 5, pointerId: 1, bubbles: true };

		handle.dispatchEvent(new PointerEvent('pointerdown', at));
		handle.dispatchEvent(new PointerEvent('pointermove', { ...at, clientY: at.clientY + 35 }));
		handle.dispatchEvent(new PointerEvent('pointerup', at));

		expect(area().scrollTop).toBe(280);
	});

	it('never lets the content scroll past its end or sideways', async () => {
		await render(OverlayScrollArea);
		await nextFrame();
		const height = area().scrollHeight;

		for (let round = 0; round < 5; round++) {
			area().scrollTop = area().scrollHeight;
			area().dispatchEvent(new Event('scroll'));
			await nextFrame();
			await nextFrame();
		}

		expect(area().scrollHeight).toBe(height);
		expect(area().scrollWidth).toBe(area().clientWidth);
		expect(area().scrollTop).toBe(height - area().clientHeight);
	});

	it('draws no thumb when the content fits', async () => {
		await render(OverlayScrollArea, { rows: 3 });
		await nextFrame();

		expect(thumb()?.hidden).toBe(true);
	});

	it('keeps the native bar on a touch screen or with forced colours', async () => {
		vi.stubGlobal('matchMedia', (query: string) => ({ matches: query === '(pointer: coarse)' }));
		await render(OverlayScrollArea);
		await nextFrame();

		expect(area().classList.contains('overlay-scrollbar')).toBe(false);
		expect(thumb()).toBeNull();
	});
});
