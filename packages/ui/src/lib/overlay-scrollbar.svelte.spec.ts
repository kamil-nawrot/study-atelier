import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { pageScrollbar } from './overlay-scrollbar.ts';
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

	it('keeps the thumb inside the content at a fractional size and scroll position', async () => {
		await render(OverlayScrollArea);
		const scroller = area();
		scroller.style.height = '199.6px';
		scroller.style.width = '239.6px';
		await nextFrame();
		const end = 1600 - 199.6;
		Object.defineProperty(scroller, 'scrollTop', { configurable: true, get: () => end });

		scroller.dispatchEvent(new Event('scroll'));
		await nextFrame();

		const handle = thumb() as HTMLElement;
		expect(parseFloat(handle.style.top) + parseFloat(handle.style.height)).toBeLessThanOrEqual(
			1600
		);
		expect(parseFloat(handle.style.left)).toBeLessThanOrEqual(239.6);
	});

	it('keeps its thumb when a list empties and fills again', async () => {
		const { rerender } = await render(OverlayScrollArea);
		await nextFrame();

		await rerender({ rows: 0 });
		await nextFrame();
		await rerender({ rows: 40 });
		await nextFrame();

		expect(thumb()?.hidden).toBe(false);
		expect(thumb()?.style.height).toBe('25px');
	});

	it('draws no thumb when the content fits', async () => {
		await render(OverlayScrollArea, { rows: 3 });
		await nextFrame();

		expect(thumb()?.hidden).toBe(true);
	});

	it('starts a drag only with the main button and ends it when the capture is lost', async () => {
		await render(OverlayScrollArea);
		await nextFrame();
		const handle = thumb() as HTMLElement;
		const box = handle.getBoundingClientRect();
		const at = { clientX: box.left + 1, clientY: box.top + 5, pointerId: 1, bubbles: true };

		handle.dispatchEvent(new PointerEvent('pointerdown', { ...at, button: 2 }));
		handle.dispatchEvent(new PointerEvent('pointermove', { ...at, clientY: at.clientY + 35 }));
		expect(area().scrollTop).toBe(0);

		handle.dispatchEvent(new PointerEvent('pointerdown', at));
		handle.dispatchEvent(new PointerEvent('lostpointercapture', at));
		handle.dispatchEvent(new PointerEvent('pointermove', { ...at, clientY: at.clientY + 35 }));
		expect(area().scrollTop).toBe(0);
		expect(handle.classList.contains('dragging')).toBe(false);
	});

	it('measures the content again when the pointer enters', async () => {
		await render(OverlayScrollArea);
		await nextFrame();
		for (const row of Array.from(area().children).slice(0, 10)) {
			(row as HTMLElement).style.height = '0px';
		}

		area().dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }));
		await nextFrame();

		expect(thumb()?.classList.contains('hovered')).toBe(true);
		expect(thumb()?.style.height).toBe(`${Math.floor((200 / 1200) * 200)}px`);
	});

	it('follows the scroller when it is resized and the content when it changes', async () => {
		const { rerender } = await render(OverlayScrollArea);
		await nextFrame();

		area().style.height = '400px';
		await vi.waitFor(() => expect(thumb()?.style.height).toBe('100px'));

		await rerender({ rows: 80 });
		await vi.waitFor(() => expect(thumb()?.style.height).toBe('50px'));
	});

	it('draws a horizontal thumb for the x axis', async () => {
		await render(OverlayScrollArea, { axis: 'x' });
		await nextFrame();

		expect(thumb()?.classList.contains('x')).toBe(true);
		expect(thumb()?.style.width).toBe(`${Math.floor((200 / 1600) * 200)}px`);
	});

	it('removes the thumb and gives back the native bar when the scroller goes', async () => {
		const { unmount } = await render(OverlayScrollArea);
		await nextFrame();
		const scroller = area();

		unmount();

		expect(scroller.classList.contains('overlay-scrollbar')).toBe(false);
		expect(scroller.querySelector('.overlay-scrollbar-thumb')).toBeNull();
	});

	it('draws the page thumb fixed to the window and removes it when stopped', async () => {
		const tall = document.createElement('div');
		tall.style.height = `${window.innerHeight * 4}px`;
		document.body.append(tall);
		const stop = pageScrollbar();
		await nextFrame();

		const page = document.body.querySelector(
			':scope > .overlay-scrollbar-thumb.page'
		) as HTMLElement;
		expect(page.hidden).toBe(false);
		expect(getComputedStyle(page).position).toBe('fixed');

		stop?.();
		tall.remove();
		expect(document.body.querySelector(':scope > .overlay-scrollbar-thumb.page')).toBeNull();
	});

	it('keeps the native bar on a touch screen or with forced colours', async () => {
		vi.stubGlobal('matchMedia', (query: string) => ({ matches: query === '(pointer: coarse)' }));
		await render(OverlayScrollArea);
		await nextFrame();

		expect(area().classList.contains('overlay-scrollbar')).toBe(false);
		expect(thumb()).toBeNull();
	});
});
