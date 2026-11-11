import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import '@study-atelier/ui/styles.css';
import { stageGeometry } from '#lib/timeline/stage/stage.ts';
import type { Era } from '#lib/timeline/types/era.ts';
import TimelineAxis from './TimelineAxis.svelte';

const prehistory: Era = { code: 'prehistory', start: -2999999, end: -2999 };
const view = { center: -19999, span: 40000 };

function ticks(): HTMLElement[] {
	return [...document.querySelectorAll<HTMLElement>('.tick')];
}

describe('TimelineAxis', () => {
	it('labels the years of prehistory along a horizontal axis, up to its start', async () => {
		render(TimelineAxis, { geometry: stageGeometry(view, 1200, 0), era: prehistory });

		await expect
			.poll(() => ticks().map((tick) => tick.textContent?.trim()))
			.toContain('40000 p.n.e.');
	});

	it('keeps the vertical year labels inside the axis column and away from its ends', async () => {
		const ends = { center: -29999, span: 40000 };
		const geometry = stageGeometry(ends, 390, 0, 'vertical', 844);
		const { container } = await render(TimelineAxis, { geometry, era: prehistory });

		await expect.poll(() => ticks().length).toBeGreaterThan(0);
		const axis = container.querySelector('.axis') as HTMLElement;
		const column = axis.getBoundingClientRect();
		const texts = ticks().map((tick) => tick.textContent?.trim());
		expect(texts).not.toContain('50000 p.n.e.');
		expect(texts).not.toContain('10000 p.n.e.');
		expect(texts).toContain('30000 p.n.e.');
		for (const tick of ticks()) {
			const box = tick.getBoundingClientRect();
			expect(box.left).toBeGreaterThanOrEqual(column.left);
			expect(box.right).toBeLessThanOrEqual(column.right);
			expect(box.top).toBeGreaterThanOrEqual(column.top);
			expect(box.bottom).toBeLessThanOrEqual(column.top + geometry.length);
			expect(tick.scrollWidth).toBeLessThanOrEqual(tick.clientWidth);
		}
	});
});
