import { tick } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import '@study-atelier/ui/styles.css';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { stageGeometry } from '#lib/timeline/stage/stage.ts';
import type { Era } from '#lib/timeline/types/era.ts';
import TimelineArtworks from './TimelineArtworks.svelte';

const renaissance: Era = { code: 'early_modern', start: 1400, end: 1600 };
const view = { center: 1500, span: 200 };
const altarpiece = testArtwork(1, 'Altarpiece', {
	date: '1450–1520',
	yearFrom: 1450,
	yearTo: 1520
});

function centre(element: Element): { x: number; y: number } {
	const box = element.getBoundingClientRect();
	return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
}

function pointer(element: Element, type: 'pointerenter' | 'pointerleave'): void {
	element.dispatchEvent(new PointerEvent(type, { pointerType: 'mouse' }));
}

async function renderAltarpiece(): Promise<HTMLElement> {
	const { container } = await render(TimelineArtworks, {
		artworks: [altarpiece],
		era: renaissance,
		geometry: stageGeometry(view, 400, 0),
		selected: null,
		onselect: () => {}
	});
	return container;
}

describe('TimelineArtworks', () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it('opens the preview of a hovered artwork after the hover delay of other cards', async () => {
		const container = await renderAltarpiece();
		const mark = container.querySelector('.mark') as HTMLElement;
		vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });

		pointer(mark, 'pointerenter');
		vi.advanceTimersByTime(300);
		await tick();
		expect(container.querySelector('.preview')).toBeNull();

		vi.advanceTimersByTime(20);
		await tick();
		expect(container.querySelector('.preview')?.textContent).toContain('Altarpiece');
	});

	it('opens nothing when the pointer leaves the artwork before the delay', async () => {
		const container = await renderAltarpiece();
		const mark = container.querySelector('.mark') as HTMLElement;
		vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });

		pointer(mark, 'pointerenter');
		vi.advanceTimersByTime(200);
		pointer(mark, 'pointerleave');
		vi.advanceTimersByTime(1000);
		await tick();

		expect(container.querySelector('.preview')).toBeNull();
	});

	it('takes the pointer only on the dot of an artwork made over years, not on its line', async () => {
		const { container } = await render(TimelineArtworks, {
			artworks: [altarpiece],
			era: renaissance,
			geometry: stageGeometry(view, 400, 0),
			selected: null,
			onselect: () => {}
		});

		const mark = container.querySelector('.mark') as HTMLElement;
		await expect.poll(() => mark.classList.contains('spanned')).toBe(true);
		const line = centre(mark.querySelector('.line') as Element);
		expect(mark.contains(document.elementFromPoint(line.x, line.y))).toBe(false);
		const dot = centre(mark.querySelector('.dot') as Element);
		expect(mark.contains(document.elementFromPoint(dot.x, dot.y))).toBe(true);

		await page.elementLocator(mark.querySelector('.hit') as HTMLElement).hover();
		await expect
			.poll(() => container.querySelector('.preview')?.textContent)
			.toContain('Altarpiece');
	});
});
