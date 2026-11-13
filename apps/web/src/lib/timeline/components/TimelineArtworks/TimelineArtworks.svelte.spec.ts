import { describe, expect, it } from 'vitest';
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

describe('TimelineArtworks', () => {
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
